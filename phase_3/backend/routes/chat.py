"""
AI Chatbot endpoint — POST /api/{user_id}/chat
OpenAI Agents SDK + MCP Tools + OpenRouter

Stateless request cycle: History Fetch -> Agent Run -> Save -> Respond
"""

import asyncio
import logging
import os
from datetime import datetime, UTC
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Request, status
from openai import AsyncOpenAI
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from agents import (
    Agent,
    Runner,
    set_default_openai_api,
    set_default_openai_client,
    set_tracing_disabled,
)
from agents.models.openai_chatcompletions import OpenAIChatCompletionsModel

from db import engine
from models import Conversation, Message, MessageRole

# Load env vars from backend/.env
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

logger = logging.getLogger(__name__)

# Configure OpenRouter (must be done before any Agent/Runner usage)
set_default_openai_api("chat_completions")
set_tracing_disabled(True)

_api_key = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")  # OpenRouter model IDs

# Build the OpenAI-compatible client pointing at OpenRouter and wrap it in an
# OpenAIChatCompletionsModel so the Agents SDK doesn't try to parse the model
# name through MultiProvider (which only knows "openai/" and "litellm/" prefixes).
_openrouter_client: AsyncOpenAI | None = None
_chat_model: OpenAIChatCompletionsModel | None = None


if _api_key:
    _openrouter_client = AsyncOpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=_api_key,
    )
    _chat_model = OpenAIChatCompletionsModel(
        model=OPENROUTER_MODEL,
        openai_client=_openrouter_client,
    )
    set_default_openai_client(_openrouter_client)
    logger.info(f"Using LLM model: {OPENROUTER_MODEL} via OpenRouter")
else:
    logger.error("OPENROUTER_API_KEY is NOT set — LLM calls will fail!")

HISTORY_LIMIT = 50
AGENT_TIMEOUT = 30.0

router = APIRouter(prefix="/api", tags=["chat"])


# --- Pydantic schemas ---

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=10000)
    conversation_id: Optional[int] = None


class ChatResponse(BaseModel):
    response: str
    conversation_id: int
    message_id: int

SYSTEM_PROMPT = """You are a helpful Todo Task Assistant. You help users manage their tasks using natural language.

You have access to these tools:
- add_task: Create a new task for the user
- list_tasks: List all tasks (optionally filtered by status: pending, in_progress, completed)
- complete_task: Mark a task as completed
- delete_task: Delete a task permanently
- update_task: Update a task's title or description

IMPORTANT: The user_id is provided to you automatically. Always use the user_id that was given to you when calling any tool.

When you perform an action, confirm what you did in clear, friendly language.
When listing tasks, format them in a readable way with their status.
If the user asks about something unrelated to task management, politely explain that you are a task management assistant and describe what you can help with."""




def _load_or_create_conversation(session: Session, user_id: str, conversation_id: Optional[int]) -> Conversation:
    """Load existing conversation or create a new one."""
    if conversation_id is not None:
        conversation = session.exec(
            select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id,
            )
        ).first()
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )
        return conversation

    # Create new conversation
    conversation = Conversation(user_id=user_id)
    session.add(conversation)
    session.commit()
    session.refresh(conversation)
    return conversation


def _load_history(session: Session, conversation_id: int) -> list[dict]:
    """Load the last HISTORY_LIMIT messages as input list for Runner.run()."""
    messages = session.exec(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .where(Message.role.in_([MessageRole.USER, MessageRole.ASSISTANT]))
        .order_by(Message.created_at.desc())
        .limit(HISTORY_LIMIT)
    ).all()

    # Reverse to chronological order and convert to dicts
    return [
        {"role": msg.role.value, "content": msg.content}
        for msg in reversed(messages)
    ]


def _save_message(session: Session, conversation_id: int, role: MessageRole, content: str) -> Message:
    """Persist a message to the database."""
    message = Message(
        conversation_id=conversation_id,
        role=role,
        content=content,
    )
    session.add(message)
    session.commit()
    session.refresh(message)
    return message


# --- Chat endpoint ---

@router.post("/{user_id}/chat", response_model=ChatResponse)
async def chat(user_id: str, body: ChatRequest, request: Request):
    """
    Send a natural-language message to the AI chatbot.
    The chatbot processes the message using MCP task-management tools
    and returns a human-friendly response.
    """
    mcp_server = request.app.state.mcp_server

    with Session(engine) as session:
        # 1. Load or create conversation
        conversation = _load_or_create_conversation(
            session, user_id, body.conversation_id
        )

        # 2. Load history (last 50 messages)
        history = _load_history(session, conversation.id)

        # 3. Save user message BEFORE agent run (persistence-first, SC-006)
        _save_message(session, conversation.id, MessageRole.USER, body.message)

        # 4. Build input for agent: history + new user message
        input_messages = history + [{"role": "user", "content": body.message}]

        # 5. Create agent with system prompt and MCP server
        if _chat_model is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="LLM not configured — check OPENROUTER_API_KEY in .env",
            )
        agent = Agent(
            name="Todo Assistant",
            instructions=SYSTEM_PROMPT + f"\n\nThe current user_id is: {user_id}",
            model=_chat_model,
            mcp_servers=[mcp_server],
        )

        # 6. Run agent with timeout
        try:
            result = await asyncio.wait_for(
                Runner.run(agent, input_messages, max_turns=10),
                timeout=AGENT_TIMEOUT,
            )
            assistant_text = result.final_output

        except asyncio.TimeoutError:
            logger.warning(f"Agent timeout for user {user_id}")
            assistant_text = (
                "That request took too long. Please try again with a simpler message."
            )

        except Exception as e:
            logger.error(f"Agent error for user {user_id}: {type(e).__name__}: {e}", exc_info=True)
            assistant_text = (
                "I'm having trouble connecting right now. Please try again in a moment."
            )

        # 7. Save assistant response
        assistant_msg = _save_message(
            session, conversation.id, MessageRole.ASSISTANT, assistant_text
        )

        # 8. Update conversation timestamp
        conversation.updated_at = datetime.now(UTC)
        session.add(conversation)
        session.commit()

        return ChatResponse(
            response=assistant_text,
            conversation_id=conversation.id,
            message_id=assistant_msg.id,
        )
