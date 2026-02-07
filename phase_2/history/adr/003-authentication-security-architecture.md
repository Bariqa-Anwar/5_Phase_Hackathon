# ADR-003: Authentication and Security Architecture

> **Scope**: Document decision clusters, not individual technology choices. Group related decisions that work together.

- **Status:** Accepted
- **Date:** 2026-02-05
- **Feature:** 001-secure-backend-foundation
- **Context:** Need to secure the backend API with authentication that integrates with Better Auth (frontend session management) while enforcing strict multi-tenant data isolation. The architecture must support stateless horizontal scaling, prevent cross-user data leakage, and meet security criteria (100% rejection of invalid tokens, zero unauthorized data access).

<!-- Significance checklist (ALL must be true to justify this ADR)
     1) Impact: Long-term consequence for architecture/platform/security? ✅ YES - Defines security model for entire application
     2) Alternatives: Multiple viable options considered with tradeoffs? ✅ YES - JWT vs session cookies vs OAuth2 flows
     3) Scope: Cross-cutting concern (not an isolated detail)? ✅ YES - Every protected endpoint depends on this architecture
-->

## Decision

We will implement a **JWT-Based Stateless Authentication** architecture with the following integrated approach:

**Authentication Layer**:
- **Token Format**: JWT (JSON Web Tokens) with HS256 signing algorithm
- **Shared Secret**: BETTER_AUTH_SECRET environment variable (min 32 chars, shared with frontend)
- **Token Issuer**: Better Auth (frontend) - backend only verifies, never issues tokens
- **Token Verification**: python-jose[cryptography] library with signature + expiration validation
- **Token Delivery**: `Authorization: Bearer <token>` HTTP header (mandatory on all protected endpoints)

**User Isolation Strategy**:
- **Pattern**: Explicit user_id filtering via FastAPI dependency injection
- **Enforcement**: Every database query MUST include `.where(Task.user_id == current_user)`
- **No Magic**: Query-level filtering (not ORM events or global filters)
- **Type Safety**: `current_user: str = Depends(get_current_user)` injected into all route functions

**Security Boundaries**:
- **Backend Stateless**: No session storage, no cookies, no in-memory user tracking
- **Frontend Stateful**: Better Auth manages sessions, issues JWT tokens
- **Cross-Origin**: Backend trusts JWT signature, doesn't track sessions
- **Error Responses**: 401 Unauthorized for auth failures, 404 Not Found for ownership violations (never expose existence of other users' data)

**Implementation Pattern**:
```python
# auth.py
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())) -> str:
    token = credentials.credentials
    payload = jwt.decode(token, BETTER_AUTH_SECRET, algorithms=["HS256"])
    user_id = payload.get("sub")  # Extract user_id from token
    return user_id

# routes/tasks.py
def list_tasks(db: Session = Depends(get_session), current_user: str = Depends(get_current_user)):
    statement = select(Task).where(Task.user_id == current_user)
    return db.exec(statement).all()
```

## Consequences

### Positive

- **Stateless Scaling**: Backend can scale horizontally without session synchronization (cloud-native)
- **Frontend Integration**: Seamless integration with Better Auth (frontend issues tokens, backend verifies)
- **Zero Cross-User Leakage**: Explicit user_id filtering prevents accidental data exposure (SC-003 compliance)
- **Type Safety**: FastAPI dependency injection makes user_id presence guaranteed at compile time
- **100% Auth Rejection**: JWT signature/expiration validation catches all invalid tokens (SC-004 compliance)
- **Constitution Compliance**: Meets Principle IV (Security & Multi-Tenancy) requirements exactly
- **Auditability**: Every request logs user_id for security auditing (FR-015)
- **Simple Mental Model**: Backend doesn't manage users/sessions, only verifies tokens and filters queries

### Negative

- **Shared Secret Management**: BETTER_AUTH_SECRET must be synchronized between frontend and backend (.env files)
- **Token Revocation Limitations**: No built-in token revocation (JWT is stateless) - requires short expiration times
- **Explicit Filtering Required**: Developer must remember to add user_id filtering to every query (not automatic)
- **No Refresh Token Logic**: Refresh token handling is frontend responsibility (backend doesn't implement)
- **Secret Rotation Complexity**: Changing BETTER_AUTH_SECRET requires coordinated frontend + backend deployment
- **Dependency on Frontend**: Backend cannot function without Better Auth issuing valid tokens (tight coupling)
- **Query Verbosity**: Every query must explicitly include `.where(Task.user_id == current_user)` (some ORMs auto-inject this)

## Alternatives Considered

### Alternative 1: Session Cookie Authentication

**Approach**: Backend issues session cookies, stores session state in Redis/database, validates cookies on each request.

**Pros**:
- Trivial session revocation (delete session from store)
- No JWT complexity or shared secrets
- Session data can store additional user context

**Cons**:
- Violates constitution Principle IV (Stateless Backend - no session cookies)
- Requires Redis or database for session storage (additional infrastructure)
- Doesn't scale horizontally without sticky sessions or session replication
- Worse CORS support (cookies + CORS is tricky)
- Requires backend to manage session lifecycle (logout, expiration)

**Why Rejected**: Constitution explicitly prohibits session cookies for backend ("Stateless Backend Authentication: The backend MUST NOT use session cookies"). JWT enables true stateless scaling.

### Alternative 2: OAuth2 Authorization Code Flow

**Approach**: Backend acts as OAuth2 authorization server, issues access/refresh tokens, manages user authentication flows.

**Pros**:
- Industry-standard protocol (RFC 6749)
- Built-in refresh token support
- Better token revocation mechanisms

**Cons**:
- Backend must manage user credentials (login forms, password hashing)
- Significantly more complex (authorization endpoints, token exchange, refresh flow)
- Violates separation of concerns (frontend handles auth, backend handles data)
- Better Auth already provides authentication - backend would duplicate effort

**Why Rejected**: Over-engineered for the architecture. Better Auth handles authentication flows; backend only needs to verify tokens. OAuth2 full flow is overkill when frontend already manages auth.

### Alternative 3: API Keys (No JWT)

**Approach**: Frontend passes long-lived API keys in headers, backend validates keys against database.

**Pros**:
- Simple implementation
- Easy to revoke (delete key from database)
- No JWT parsing complexity

**Cons**:
- Requires database lookup on every request (latency penalty)
- No user context in token (must query user_id separately)
- Long-lived keys are security risk (hard to rotate)
- Doesn't integrate with Better Auth (which uses JWT)

**Why Rejected**: Worse performance (DB lookup per request), doesn't integrate with Better Auth's JWT system, less secure than short-lived JWTs.

### Alternative 4: SQLAlchemy ORM Events for Automatic User Filtering

**Approach**: Use SQLAlchemy's event system to automatically inject `.where(user_id == current_user)` on all queries.

**Pros**:
- Developers can't forget to filter by user_id (automatic)
- Less query boilerplate
- Centralized filtering logic

**Cons**:
- Global side effects (hard to debug when queries mysteriously filter)
- Requires thread-local or context variable to store current_user (fragile)
- SQLModel doesn't fully support advanced SQLAlchemy events
- Implicit behavior violates "Explicit is better than implicit" (Zen of Python)
- Harder to test (mock current_user context)

**Why Rejected**: Constitution Principle VII (Smallest Viable Change) prefers explicit over implicit. Dependency injection is FastAPI-native, easier to understand, and testable. The trade-off of manual filtering is acceptable for explicitness.

## References

- Feature Spec: [specs/001-secure-backend-foundation/spec.md](../../specs/001-secure-backend-foundation/spec.md)
  - User Story 4: JWT Authentication Middleware (lines 60-74)
  - FR-005, FR-006: JWT verification requirements (lines 114-115)
  - FR-012: User isolation enforcement (line 121)
  - SC-003, SC-004: Security success criteria (lines 145-146)
- Implementation Plan: [specs/001-secure-backend-foundation/plan.md](../../specs/001-secure-backend-foundation/plan.md)
  - Lines 39-42: Security & Multi-Tenancy compliance
- Research: [specs/001-secure-backend-foundation/research.md](../../specs/001-secure-backend-foundation/research.md)
  - Lines 154-203: JWT Verification with python-jose
  - Lines 205-256: User Isolation Query Patterns
- Constitution: [.specify/memory/constitution.md](../../.specify/memory/constitution.md)
  - Principle IV: Security & Multi-Tenancy (lines 67-75)
- Related ADRs:
  - [ADR-002](./002-backend-technology-stack.md) (python-jose is part of technology stack)
