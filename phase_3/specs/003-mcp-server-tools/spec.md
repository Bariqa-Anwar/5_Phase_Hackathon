# Feature Specification: MCP Server Tools

**Feature Branch**: `003-mcp-server-tools`
**Created**: 2026-02-08
**Status**: Draft
**Input**: User description: "Define a technical specification for an MCP Server using the Official MCP SDK with 5 task-management tools integrated with existing SQLModel/Neon DB setup."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - AI Agent Manages Tasks on Behalf of User (Priority: P1)

A user interacts with an AI chatbot through a chat interface. The user
asks the chatbot to add, list, update, complete, or delete tasks. The
AI agent invokes MCP tools behind the scenes to perform these operations
against the user's task list in the database. The user sees the result
as a natural-language response from the chatbot.

Every tool call MUST include the user's identity so the system never
leaks or modifies another user's data.

**Why this priority**: This is the core value proposition — without
functional MCP tools the AI chatbot cannot manage tasks at all.

**Independent Test**: Can be fully tested by sending tool-call requests
to the MCP server with a known user identity and verifying the database
reflects the correct state. Delivers task management capability to the
AI agent layer.

**Acceptance Scenarios**:

1. **Given** a user with no tasks, **When** the AI agent calls
   `add_task` with the user's ID, a title, and a description, **Then**
   a new task is persisted with status "pending" and the tool returns
   the created task including its assigned ID.
2. **Given** a user with 3 tasks (1 pending, 1 in-progress,
   1 completed), **When** the AI agent calls `list_tasks` with
   status "pending", **Then** only the 1 pending task is returned.
3. **Given** a user with 3 tasks, **When** the AI agent calls
   `list_tasks` with no status filter, **Then** all 3 tasks are
   returned.
4. **Given** a user with a pending task (ID 42), **When** the AI agent
   calls `complete_task` with the user's ID and task ID 42, **Then**
   the task's status changes to "completed" and the updated task is
   returned.
5. **Given** a user with a task (ID 42), **When** the AI agent calls
   `update_task` with a new title and description, **Then** the task's
   title and description are updated and the updated task is returned.
6. **Given** a user with a task (ID 42), **When** the AI agent calls
   `delete_task` with the user's ID and task ID 42, **Then** the task
   is permanently removed and a success confirmation is returned.

---

### User Story 2 - User Isolation Across All Tools (Priority: P1)

Every MCP tool MUST enforce user-scoped data access. A tool call from
one user's agent session MUST never read, modify, or delete tasks
belonging to another user. The `user_id` parameter is the sole
mechanism for scoping — it is mandatory on every tool call.

**Why this priority**: Equal to P1 because user isolation is a
non-negotiable security requirement. Without it, no tool is safe to
deploy.

**Independent Test**: Can be tested by calling each tool with User A's
ID against tasks owned by User B, and verifying that User B's data is
never returned or modified.

**Acceptance Scenarios**:

1. **Given** User A owns task ID 10 and User B owns task ID 20,
   **When** User B's agent calls `complete_task` with User B's ID and
   task ID 10, **Then** the tool returns a "task not found" error —
   User A's task is unaffected.
2. **Given** User A has 3 tasks and User B has 5 tasks, **When**
   User A's agent calls `list_tasks`, **Then** only User A's 3 tasks
   are returned.
3. **Given** User A owns task ID 10, **When** User B's agent calls
   `delete_task` with User B's ID and task ID 10, **Then** the tool
   returns a "task not found" error and the task remains in the
   database.

---

### User Story 3 - MCP Server Coexists with Existing REST API (Priority: P2)

The MCP server MUST operate alongside the existing REST API without
breaking any Phase 2 functionality. Both systems share the same
database tables. The REST API continues to serve the web frontend
(authenticated via JWT). The MCP server serves the AI agent layer
(authenticated via explicit `user_id` parameters passed by the
orchestration layer).

**Why this priority**: The existing frontend and API are in production.
Any regression would break current users.

**Independent Test**: Can be tested by running the existing Phase 2
test suite after the MCP server is deployed and verifying all tests
still pass. Additionally, creating a task via MCP and reading it via
REST (and vice versa) confirms shared-database interoperability.

**Acceptance Scenarios**:

1. **Given** the MCP server is running alongside the REST API,
   **When** a user creates a task via the REST API, **Then** the AI
   agent can see it via `list_tasks` for the same user.
2. **Given** the AI agent creates a task via `add_task`, **When**
   the user opens the web dashboard, **Then** the task appears in
   their task list.
3. **Given** the MCP server is deployed, **When** the existing
   Phase 2 REST API test suite runs, **Then** all tests pass without
   modification.

---

### User Story 4 - OpenRouter LLM Integration (Priority: P2)

The AI orchestration layer MUST connect to OpenRouter as the LLM
provider. The system MUST support a custom `base_url` configuration
so that any OpenAI-compatible provider can be used by changing an
environment variable — not code. This ensures the system is not
locked to a single provider.

**Why this priority**: The LLM provider is essential for the chatbot
to function, but the MCP tools themselves are provider-independent.
This story can be integrated after the tools are working.

**Independent Test**: Can be tested by configuring the `base_url`
environment variable to point to OpenRouter, sending a chat message,
and verifying the agent receives a response and can invoke tools.

**Acceptance Scenarios**:

1. **Given** the `base_url` is set to OpenRouter's endpoint, **When**
   a user sends a chat message, **Then** the orchestration layer
   forwards it to OpenRouter and receives a valid response.
2. **Given** the `base_url` is changed to a different
   OpenAI-compatible provider, **When** a user sends a chat message,
   **Then** the system functions identically without code changes.

---

### Edge Cases

- What happens when `add_task` is called with a title exceeding
  200 characters? The system MUST reject it with a clear validation
  error.
- What happens when `complete_task` is called on a task that is
  already completed? The system MUST succeed idempotently (return
  the task with status "completed" without error).
- What happens when `delete_task` is called with a non-existent
  task ID? The system MUST return a "task not found" error.
- What happens when `list_tasks` is called with an invalid status
  value? The system MUST reject it with a validation error listing
  valid statuses.
- What happens when `update_task` is called with both title and
  description as empty/null? The system MUST reject it — at least
  one field to update MUST be provided.
- What happens when the database connection fails during a tool
  call? The system MUST return a clear error message without
  exposing connection details.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST expose exactly 5 MCP tools: `add_task`,
  `list_tasks`, `complete_task`, `delete_task`, `update_task`.
- **FR-002**: Every MCP tool MUST require a `user_id` parameter as
  its first argument. Calls without `user_id` MUST be rejected.
- **FR-003**: The `add_task` tool MUST accept `user_id` (required),
  `title` (required, max 200 chars), and `description` (optional,
  max 2000 chars). It MUST create a task with status "pending" and
  return the full task record including the assigned ID.
- **FR-004**: The `list_tasks` tool MUST accept `user_id` (required)
  and `status` (optional, one of: "pending", "in_progress",
  "completed"). When status is omitted, all tasks for the user MUST
  be returned. Results MUST be ordered by creation time (newest first).
- **FR-005**: The `complete_task` tool MUST accept `user_id`
  (required) and `task_id` (required). It MUST set the task's status
  to "completed" and return the updated task. If the task does not
  exist or does not belong to the user, it MUST return a "task not
  found" error.
- **FR-006**: The `delete_task` tool MUST accept `user_id` (required)
  and `task_id` (required). It MUST permanently remove the task and
  return a success confirmation. If the task does not exist or does
  not belong to the user, it MUST return a "task not found" error.
- **FR-007**: The `update_task` tool MUST accept `user_id` (required),
  `task_id` (required), `title` (optional, max 200 chars), and
  `description` (optional, max 2000 chars). At least one of `title`
  or `description` MUST be provided. It MUST return the updated task.
- **FR-008**: All tools MUST perform database operations directly
  against the shared task table — no in-memory caching or local state.
- **FR-009**: All tools MUST enforce user isolation by filtering
  every database query with the provided `user_id`. A tool MUST
  never return or modify tasks belonging to a different user.
- **FR-010**: The MCP server MUST NOT break or alter the existing
  REST API endpoints. Both systems MUST coexist sharing the same
  database.
- **FR-011**: Tool input parameters MUST be validated using Pydantic
  models. Invalid inputs MUST produce clear, structured error
  messages.
- **FR-012**: Tool outputs MUST use Pydantic models that serialize
  task records consistently: ID, title, description, status, user
  identity, and timestamps.
- **FR-013**: The LLM provider MUST be configurable via a `base_url`
  environment variable to support OpenRouter and any
  OpenAI-compatible provider without code changes.
- **FR-014**: The system MUST read all secrets and configuration
  (database URL, API keys, base URLs) from environment variables.

### Key Entities

- **Task**: A unit of work belonging to a specific user. Key
  attributes: unique identifier, title (max 200 chars), description
  (max 2000 chars, optional), status (pending | in_progress |
  completed), owning user identity, creation timestamp, last-updated
  timestamp. This entity already exists in the shared database from
  Phase 2.

- **MCP Tool**: A discrete operation exposed to the AI agent via the
  MCP protocol. Each tool has a name, a structured input schema
  (Pydantic model), and a structured output schema (Pydantic model).
  Tools are registered with the MCP server at startup.

- **Tool Input**: A validated request object for an MCP tool call.
  Always contains `user_id`. Additional fields vary per tool (title,
  description, task_id, status).

- **Tool Output**: A structured response from an MCP tool call.
  Contains either the task record(s) on success or a structured
  error with a message on failure.

### Assumptions

- The AI orchestration layer (OpenAI Agents SDK) is responsible for
  providing the correct `user_id` to each tool call. The MCP server
  trusts this value — it does not perform its own authentication.
- The existing Task table schema (from Phase 2) is sufficient for
  all MCP tool operations. No schema migrations are required.
- The MCP server runs as a subprocess or in-process server consumed
  by the OpenAI Agents SDK — it is not exposed directly to end users.
- OpenRouter's API is compatible with the OpenAI chat completions
  format, requiring only a different `base_url` and API key.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 5 MCP tools (add, list, complete, delete, update)
  successfully execute end-to-end — a task can be created, listed,
  updated, completed, and deleted through tool calls alone.
- **SC-002**: User isolation is enforced — calling any tool with
  User A's ID never returns or modifies User B's tasks (0 leakage
  across 100% of tool operations).
- **SC-003**: The existing Phase 2 REST API test suite passes with
  zero regressions after MCP server deployment.
- **SC-004**: Switching the LLM provider requires changing only
  environment variables (`base_url` and API key) — zero code changes.
- **SC-005**: Invalid tool inputs (missing required fields, values
  exceeding length limits, invalid status values) are rejected with
  descriptive error messages 100% of the time.
- **SC-006**: Tasks created via MCP tools are visible through the
  existing web dashboard, and tasks created through the web dashboard
  are accessible via MCP tools (full bidirectional interoperability).
