# Feature Specification: AI Chatbot Integration

**Feature Branch**: `004-ai-chatbot-integration`
**Created**: 2026-02-08
**Status**: Draft
**Input**: User description: "Define the technical specification for the AI Chatbot integration using OpenAI Agents SDK with OpenRouter LLM provider and MCP tools for stateless todo task management."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - User Chats with AI to Manage Tasks (Priority: P1)

A user sends a natural-language message to the AI chatbot through a
chat endpoint. The chatbot understands the intent, uses the
appropriate task-management tool (add, list, complete, delete, or
update), and responds with a human-friendly summary of what was done.
The entire conversation is persisted so the user can continue later.

**Why this priority**: This is the core feature — without a working
chat endpoint, the AI chatbot has no interface for users.

**Independent Test**: Can be tested by sending a POST request to the
chat endpoint with a user ID and message like "Add a task called Buy
groceries". Verify the response contains a natural-language
confirmation and the task exists in the database.

**Acceptance Scenarios**:

1. **Given** a user with no tasks, **When** the user sends "Add a
   task to buy milk", **Then** the chatbot creates the task and
   responds with a confirmation like "I've added 'buy milk' to your
   task list."
2. **Given** a user with 3 tasks, **When** the user sends "What are
   my tasks?", **Then** the chatbot lists all 3 tasks with their
   titles and statuses in a readable format.
3. **Given** a user with a task called "Buy groceries", **When** the
   user sends "Mark buy groceries as done", **Then** the chatbot
   marks it completed and responds with confirmation.
4. **Given** a user with a task called "Old task", **When** the user
   sends "Delete old task", **Then** the chatbot removes it and
   confirms the deletion.
5. **Given** a user with a task called "Draft email", **When** the
   user sends "Change the title of draft email to Send report",
   **Then** the chatbot updates the title and confirms.

---

### User Story 2 - Conversation History Persists Across Requests (Priority: P1)

Every chat interaction (user message and assistant response) MUST be
saved to the database. When the user sends a new message, the system
MUST load the previous conversation history and include it in the
AI context so the chatbot remembers what was discussed earlier in the
same conversation.

**Why this priority**: Without history persistence, the chatbot has
no memory between requests (stateless architecture). This is
essential for multi-turn conversations.

**Independent Test**: Send two sequential messages in the same
conversation. Verify the second response references or is consistent
with the first interaction.

**Acceptance Scenarios**:

1. **Given** a user starts a new conversation, **When** the user
   sends "Add a task: buy eggs", **Then** a new conversation is
   created, the message and response are saved, and a conversation
   ID is returned.
2. **Given** an existing conversation where the user previously
   added "buy eggs", **When** the user sends "What did I just add?"
   in the same conversation, **Then** the chatbot responds with
   "buy eggs" because it loaded the conversation history.
3. **Given** a user with conversation ID 5, **When** the user sends
   a message without specifying a conversation ID, **Then** a new
   conversation is automatically created.

---

### User Story 3 - Graceful Error Handling (Priority: P2)

When the LLM provider is unavailable, returns an error, or an MCP
tool fails during execution, the chatbot MUST respond with a
user-friendly error message rather than crashing or returning raw
error data. The user's message MUST still be persisted so it is not
lost.

**Why this priority**: Error resilience is important but secondary
to core functionality. Users should never see stack traces or
cryptic errors.

**Independent Test**: Simulate an LLM provider failure (e.g., invalid
API key) and verify the endpoint returns a structured, friendly error
response.

**Acceptance Scenarios**:

1. **Given** the LLM provider is unreachable, **When** the user sends
   a chat message, **Then** the system responds with a friendly
   message like "I'm having trouble connecting right now. Please try
   again in a moment." and the user's message is still saved.
2. **Given** an MCP tool returns an error (e.g., task not found),
   **When** the agent processes the tool result, **Then** the chatbot
   translates the error into a natural-language response like "I
   couldn't find that task. Could you check the name?"
3. **Given** an invalid conversation ID is provided, **When** the
   user sends a message, **Then** the system returns a clear error
   indicating the conversation was not found.

---

### User Story 4 - Provider-Agnostic LLM Configuration (Priority: P2)

The system MUST connect to the LLM provider using environment
variables for the base URL and API key. Changing the provider (e.g.,
from OpenRouter to a direct OpenAI endpoint) MUST require only
environment variable changes — no code modifications.

**Why this priority**: Provider flexibility is a deployment concern.
The chatbot works with any provider; this story ensures no
vendor lock-in.

**Independent Test**: Change the base URL environment variable to a
different OpenAI-compatible provider and verify the chatbot still
functions correctly.

**Acceptance Scenarios**:

1. **Given** the base URL is set to OpenRouter, **When** a user sends
   a chat message, **Then** the system routes it through OpenRouter
   and returns a valid response.
2. **Given** the base URL is changed to a different provider, **When**
   a user sends a chat message, **Then** the system works identically
   without any code changes.

---

### Edge Cases

- What happens when the user sends an empty message? The system MUST
  reject it with a validation error ("Message cannot be empty").
- What happens when the user sends a very long message (>10,000
  characters)? The system MUST reject it with a validation error.
- What happens when the conversation history is very large (>100
  messages)? The system MUST load only the most recent messages to
  stay within the LLM's context window. Assume a default of the last
  50 messages.
- What happens when the LLM response takes longer than 30 seconds?
  The system MUST time out and return a friendly error message.
- What happens when the user sends a message that doesn't relate to
  task management? The chatbot SHOULD still respond helpfully,
  explaining its capabilities, rather than returning an error.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST expose a chat endpoint that accepts a user
  identifier, an optional conversation identifier, and a
  natural-language message.
- **FR-002**: On each request, the system MUST load the conversation
  history from the database using the conversation identifier. If no
  conversation ID is provided, a new conversation MUST be created.
- **FR-003**: The system MUST forward the user's message (along with
  conversation history) to an AI agent that has access to the 5 MCP
  task-management tools (add, list, complete, delete, update).
- **FR-004**: The AI agent MUST have a system prompt that defines it
  as a helpful task management assistant. The prompt MUST instruct
  the agent to use the available tools for task operations and to
  respond in clear, friendly natural language.
- **FR-005**: The system MUST persist both the user's message and the
  assistant's response to the database as part of the conversation
  history.
- **FR-006**: The system MUST return the assistant's response, the
  conversation identifier, and a message identifier in the response
  payload.
- **FR-007**: The system MUST pass the user's identity to every MCP
  tool call so tools operate on the correct user's data.
- **FR-008**: The system MUST handle LLM provider errors gracefully,
  returning a user-friendly error message without exposing internal
  details.
- **FR-009**: The system MUST handle MCP tool errors gracefully,
  allowing the AI agent to interpret the error and respond naturally.
- **FR-010**: The system MUST validate incoming messages — reject
  empty messages and messages exceeding 10,000 characters.
- **FR-011**: The system MUST limit conversation history sent to the
  LLM to the most recent 50 messages to prevent context overflow.
- **FR-012**: The system MUST read all configuration (LLM base URL,
  API key, model name) from environment variables.
- **FR-013**: The system MUST enforce a 30-second timeout for LLM
  responses.
- **FR-014**: The chat endpoint MUST NOT require JWT authentication
  — the user identity is provided directly in the URL path. This
  matches the MCP tool pattern where user_id is an explicit
  parameter.

### Key Entities

- **Conversation**: A chat session belonging to a user. Contains an
  ordered sequence of messages. Already defined in the database
  schema (from feature 003).

- **Message**: An individual exchange within a conversation. Has a
  role (user, assistant, system, tool), content text, and optional
  tool metadata. Already defined in the database schema (from
  feature 003).

- **Chat Request**: The input to the chat endpoint. Contains the
  user's message text and an optional conversation identifier.

- **Chat Response**: The output from the chat endpoint. Contains the
  assistant's response text, the conversation identifier, and a
  message identifier.

### Assumptions

- The Conversation and Message database tables already exist (created
  by feature 003 MCP Server Tools during `create_all`).
- The MCP server (`backend/mcp_server.py`) with all 5 tools is
  already implemented and functional.
- OpenRouter's free tier models support the OpenAI chat completions
  API format and function/tool calling.
- The chat endpoint does not require JWT authentication because the
  user_id is passed in the URL path. Security for this endpoint is
  handled at the infrastructure level (e.g., API gateway, or the
  frontend authenticates before calling).
- The default LLM model for OpenRouter's free tier is a reasonable
  model that supports tool use (e.g., a model specified via an
  environment variable `OPENROUTER_MODEL`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can have a complete task management conversation
  — creating, listing, completing, and deleting tasks — using only
  natural-language chat messages, with 100% of operations reflected
  in the database.
- **SC-002**: Conversation history persists across requests — a user
  can reference previous messages in the same conversation and the
  chatbot responds contextually.
- **SC-003**: The chatbot responds to 95% of valid requests within
  10 seconds (excluding LLM provider latency spikes).
- **SC-004**: LLM provider failures result in a friendly error
  message 100% of the time — no raw errors, stack traces, or empty
  responses are ever returned to the user.
- **SC-005**: Switching the LLM provider requires changing only
  environment variables — zero code changes.
- **SC-006**: The user's message is always persisted, even when the
  LLM fails — zero message loss across all error scenarios.
