"""
Temporary diagnostic routes for debugging the chatbot pipeline.
Remove once the issue is resolved.
"""
import asyncio
import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import APIRouter, Request
from openai import AsyncOpenAI

env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["diagnostics"])


@router.get("/test-chat")
async def test_chat(request: Request):
    """
    Diagnostic endpoint that independently tests each component in the
    chat pipeline:
      1. MCP server — can we list tools?
      2. MCP tool call — can we call list_tasks with a dummy user?
      3. OpenRouter LLM — can we get a completion?

    Returns a JSON report of pass/fail per component.
    """
    report: dict = {
        "mcp_tools": {"status": "skipped", "detail": None},
        "mcp_tool_call": {"status": "skipped", "detail": None},
        "llm_completion": {"status": "skipped", "detail": None},
        "env_check": {"status": "skipped", "detail": None},
    }

    # --- 0. Environment check ---
    api_key = os.getenv("OPENROUTER_API_KEY", "")
    model = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")
    report["env_check"] = {
        "status": "pass" if api_key else "FAIL",
        "detail": {
            "OPENROUTER_API_KEY_present": bool(api_key),
            "OPENROUTER_API_KEY_length": len(api_key),
            "OPENROUTER_MODEL": model,
        },
    }

    # --- 1. MCP tool listing ---
    mcp_server = getattr(request.app.state, "mcp_server", None)
    if mcp_server is None:
        report["mcp_tools"] = {
            "status": "FAIL",
            "detail": "mcp_server not found on app.state — lifespan may have failed",
        }
        report["mcp_tool_call"]["detail"] = "skipped (no mcp_server)"
    else:
        try:
            tools = await mcp_server.list_tools()
            tool_names = [t.name for t in tools]
            report["mcp_tools"] = {
                "status": "pass",
                "detail": {"tool_count": len(tools), "tools": tool_names},
            }
        except Exception as e:
            report["mcp_tools"] = {"status": "FAIL", "detail": str(e)}

        # --- 2. MCP tool call (list_tasks for a test user) ---
        try:
            from agents import Agent, Runner, set_default_openai_api, set_tracing_disabled

            # Call list_tasks through MCP with a dummy user
            result = await mcp_server.call_tool("list_tasks", {"user_id": "__diag_test__"})
            report["mcp_tool_call"] = {
                "status": "pass",
                "detail": str(result)[:500],
            }
        except Exception as e:
            report["mcp_tool_call"] = {"status": "FAIL", "detail": str(e)}

    # --- 3. LLM completion via OpenRouter ---
    if not api_key:
        report["llm_completion"] = {
            "status": "FAIL",
            "detail": "No OPENROUTER_API_KEY set",
        }
    else:
        try:
            client = AsyncOpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=api_key,
            )
            resp = await asyncio.wait_for(
                client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": "Say 'hello' in one word."}],
                    max_tokens=10,
                ),
                timeout=15.0,
            )
            text = resp.choices[0].message.content if resp.choices else "(empty)"
            report["llm_completion"] = {
                "status": "pass",
                "detail": {"model": model, "response": text},
            }
        except asyncio.TimeoutError:
            report["llm_completion"] = {
                "status": "FAIL",
                "detail": "OpenRouter request timed out after 15s",
            }
        except Exception as e:
            report["llm_completion"] = {
                "status": "FAIL",
                "detail": f"{type(e).__name__}: {e}",
            }

    return report
