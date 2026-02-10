# Feature Specification: Frontend ChatKit Backend Integration

**Feature Branch**: `005-frontend-chatkit-integration`
**Created**: 2026-02-08
**Status**: Draft
**Input**: User description: "Define the integration requirements for connecting the existing frontend (OpenAI ChatKit) to the new Chatbot backend."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Send a Chat Message and Receive a Response (Priority: P1)

A logged-in user navigates to the chat interface within the dashboard. They type a natural-language message (e.g., "Add a task called 'Buy groceries'") and press send. The message is delivered to the backend chatbot endpoint, and the assistant's response appears in the conversation thread within a few seconds. The conversation persists so the user can continue the dialogue without losing context.

**Why this priority**: This is the core interaction — without the ability to send and receive messages through the chat UI, no other integration feature has value. It validates the end-to-end connection between frontend and backend.

**Independent Test**: Can be fully tested by opening the chat page, typing a message, and confirming a response renders in the conversation thread. Delivers the primary value of AI-powered task management through natural language.

**Acceptance Scenarios**:

1. **Given** a logged-in user on the chat page, **When** they type a message and press send, **Then** the message appears in the conversation thread and the assistant's reply is displayed within 10 seconds.
2. **Given** a logged-in user on the chat page, **When** they send a message without text (empty input), **Then** the send action is blocked and a validation hint is shown.
3. **Given** a logged-in user on the chat page, **When** the backend is unreachable, **Then** an error message is displayed and the user can retry.

---

### User Story 2 - Maintain Conversation Context Across Messages (Priority: P2)

A user sends multiple messages in sequence (e.g., "Add a task called 'Buy groceries'", then "Mark it as completed"). The system maintains conversation context by tracking a conversation identifier on the client, so the backend can retrieve prior messages and the assistant responds with awareness of the full conversation history.

**Why this priority**: Without conversation persistence, every message would be treated as an isolated request, breaking the natural dialogue experience and preventing multi-step task operations.

**Independent Test**: Can be tested by sending two related messages in sequence and verifying the assistant's second reply references the context from the first (e.g., the assistant knows which task to mark completed without the user specifying it again).

**Acceptance Scenarios**:

1. **Given** a user who has sent a message and received a reply, **When** they send a follow-up message, **Then** the backend receives the stored conversation identifier and the reply reflects awareness of prior context.
2. **Given** a user who closes and reopens the chat, **When** they start typing, **Then** the prior conversation is available and continuity is maintained within the same session.
3. **Given** a user who has no prior conversation, **When** they send their first message, **Then** a new conversation identifier is created, stored locally, and sent with subsequent messages.

---

### User Story 3 - See Tool Call Feedback in the Chat (Priority: P3)

When the assistant performs an action using backend tools (e.g., creating a task, listing tasks, completing a task), the chat interface displays visual feedback indicating what action was performed. For example, after the assistant creates a task, a confirmation indicator (e.g., "Task Created") appears alongside the assistant's text response.

**Why this priority**: Tool call visualization builds user trust by making the assistant's actions transparent. Without it, users must infer what happened from text alone, which can feel uncertain.

**Independent Test**: Can be tested by sending a message like "Create a task called 'Test'" and confirming the assistant's response includes a visual action indicator alongside the text reply.

**Acceptance Scenarios**:

1. **Given** a user sends a message that triggers a tool call (e.g., "Add a task called 'Test'"), **When** the assistant responds, **Then** a visual indicator (chip or badge) shows the action performed (e.g., "Task Created").
2. **Given** a user sends a message that triggers multiple tool calls, **When** the assistant responds, **Then** each tool action is indicated individually.
3. **Given** a user sends a conversational message that does not trigger any tool, **When** the assistant responds, **Then** no tool call indicator is shown.

---

### User Story 4 - Environment Configuration for Local Development (Priority: P4)

A developer cloning the project can configure the frontend to connect to their local backend by setting environment variables. The required variables are documented, and the frontend reads them at build/runtime to determine the backend URL and any other integration-specific settings.

**Why this priority**: Developer experience is foundational but is a one-time setup concern rather than an ongoing user-facing interaction.

**Independent Test**: Can be tested by copying the example environment file, filling in the values, and verifying the frontend successfully communicates with a running local backend.

**Acceptance Scenarios**:

1. **Given** a developer with the example environment file, **When** they set the backend URL variable and start the frontend, **Then** chat messages are routed to the configured backend.
2. **Given** a developer who omits the backend URL variable, **When** they start the frontend, **Then** the system falls back to a sensible default (localhost:8000).

---

### Edge Cases

- What happens when the user's session expires mid-conversation? The system should detect the authentication failure and redirect the user to log in again, preserving the conversation identifier for resumption after re-authentication.
- What happens when the backend returns an unexpected response format? The chat UI should display a generic error message rather than crashing or showing raw data.
- What happens when the user sends a very long message (approaching the 10,000-character backend limit)? The input should enforce a character limit and show a counter as the user approaches it.
- What happens when the conversation identifier stored on the client references a conversation that no longer exists on the backend? The system should handle the 404 gracefully by starting a new conversation and informing the user.
- What happens if the user rapidly sends multiple messages before receiving a reply? The UI should disable the send button while a request is in flight to prevent duplicate submissions.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a chat interface accessible from the dashboard navigation where users can send and receive messages.
- **FR-002**: System MUST route chat messages from the frontend to the backend chatbot endpoint using the authenticated user's identifier.
- **FR-003**: System MUST display the assistant's text response in the conversation thread after each message is sent.
- **FR-004**: System MUST store the conversation identifier on the client and include it in subsequent requests to maintain conversation continuity.
- **FR-005**: System MUST create a new conversation (omitting the conversation identifier) when the user initiates a fresh chat session.
- **FR-006**: System MUST display visual indicators (chips or badges) when the assistant's response involves tool-call actions (e.g., task creation, task completion, task listing).
- **FR-007**: System MUST show a loading state while waiting for the assistant's response and disable further input until the response arrives.
- **FR-008**: System MUST display a user-friendly error message when the backend is unreachable or returns an error, with an option to retry.
- **FR-009**: System MUST enforce the message length limit (10,000 characters) on the client side with a visible character counter.
- **FR-010**: System MUST define and document all required frontend environment variables in an example configuration file.
- **FR-011**: System MUST fall back to a default backend URL (localhost:8000) when the environment variable is not set.
- **FR-012**: System MUST use the authenticated user's identifier (from the existing auth session) as the `user_id` path parameter in chat requests.

### Key Entities

- **Chat Message**: A single message in a conversation thread. Has a role (user or assistant), text content, an optional list of tool-call actions, and a timestamp. Displayed chronologically in the chat interface.
- **Conversation**: A session of related messages identified by a conversation ID. The ID is provided by the backend on first message and stored on the client for subsequent requests.
- **Tool Call Indicator**: A visual element representing a backend action performed by the assistant (e.g., "Task Created", "Tasks Listed", "Task Completed", "Task Deleted", "Task Updated"). Derived from the assistant's response metadata.

## Assumptions

- The backend `POST /api/{user_id}/chat` endpoint is stable and deployed, accepting `{ message: string, conversation_id?: number }` and returning `{ response: string, conversation_id: number, message_id: number }`.
- The frontend already has Better Auth authentication in place, and the user's ID is available via the existing `useAuth` hook and session.
- The `NEXT_PUBLIC_API_URL` environment variable already exists in the frontend `.env.example` and is used by the existing API client — the chat integration will reuse this same variable.
- Tool call metadata is currently embedded in the assistant's text response (not as structured metadata in the JSON response). Tool call visualization will parse recognized action patterns from the response text. If the backend later adds structured tool-call metadata to the response, the frontend can be updated to use it.
- The conversation identifier is stored in component state (React state) for the current session. Persistent storage across browser sessions (e.g., localStorage) is out of scope for this feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can send a chat message and see the assistant's reply within 10 seconds under normal conditions.
- **SC-002**: Users can send 5 or more sequential messages in a single conversation and the assistant maintains contextual awareness throughout.
- **SC-003**: 100% of tool-call actions performed by the assistant are visually indicated in the chat interface.
- **SC-004**: New developers can configure the frontend-to-backend connection by following the documented environment setup in under 5 minutes.
- **SC-005**: When the backend is unreachable, 100% of failed requests result in a visible error message (no silent failures or crashes).
