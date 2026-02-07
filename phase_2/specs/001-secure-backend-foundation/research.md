# Research: Build Secure Backend Foundation

**Feature**: 001-secure-backend-foundation
**Date**: 2026-02-05
**Purpose**: Technology decisions and best practices research for backend implementation

---

## Decision: UV Monorepo Migration Strategy

**Context**: Need to transform root-level UV project into `/backend` subdirectory while preserving workspace integrity for future `/frontend` addition.

**Options Considered**:

1. **UV Workspaces (Recommended)** - Use UV's workspace feature with root `pyproject.toml` coordinating multiple sub-projects
   - Pros: Official UV pattern, shared dependencies where beneficial, independent execution per project
   - Cons: Requires UV 0.1.0+ workspace support

2. **Complete Separation** - Make backend entirely independent, remove root UV files
   - Pros: Maximum isolation, simplest mental model
   - Cons: Loses coordination benefits, harder to share tooling config (linters, formatters)

3. **Symlink Approach** - Keep root UV, symlink into backend
   - Pros: Avoids duplication
   - Cons: Fragile on Windows, confusing mental model, complicates CI/CD

**Decision**: UV Workspaces with coordinated root

**Rationale**:
- UV workspaces (introduced in v0.1.0) provide the official pattern for monorepos
- Root `pyproject.toml` becomes workspace coordinator with `[tool.uv.workspace]` section
- Each sub-project (`backend/`, future `frontend/`) has its own `pyproject.toml` with dependencies
- Aligns with constitution principle I (Monorepo Structure) and supports independent execution

**Implementation Notes**:
```toml
# root/pyproject.toml
[tool.uv.workspace]
members = ["backend"]

# backend/pyproject.toml
[project]
name = "backend"
version = "0.1.0"
requires-python = ">=3.13"
dependencies = [
    "fastapi>=0.115.0",
    "sqlmodel>=0.0.22",
    ...
]
```

Migration steps:
1. Create `backend/` directory
2. Move/copy root `pyproject.toml` to `backend/pyproject.toml`, adjust name/deps
3. Update root `pyproject.toml` to workspace coordinator
4. Run `cd backend && uv sync` to initialize backend environment
5. Root `main.py` can be removed or become orchestrator

---

## Decision: FastAPI Project Structure Best Practices

**Context**: Need maintainable directory layout for FastAPI + SQLModel project that aligns with constitution and scales to multiple endpoints.

**Options Considered**:

1. **Flat Structure** - All files in root: `main.py`, `models.py`, `auth.py`, `routes.py`
   - Pros: Simple for tiny projects
   - Cons: Doesn't scale, violates constitution directory structure principle

2. **Feature-Based** - Organize by feature: `/tasks`, `/users`, each with models/routes/services
   - Pros: Good for large apps with many domains
   - Cons: Overkill for single Task entity, harder to find cross-cutting concerns (auth, db)

3. **Layer-Based (Recommended)** - Separate by technical concern: `/models`, `/routes`, `/services`, shared modules at root
   - Pros: Clear separation of concerns, easy to locate files by role, aligns with constitution
   - Cons: Can become large if many features

**Decision**: Layer-Based structure with clear separation

**Rationale**:
- Matches constitution Development Constraints (models/, services/, api/ structure)
- Easy to understand for new developers (models = data, routes = endpoints, services = business logic)
- SQLModel models naturally group in `/models`
- FastAPI routes naturally group in `/routes` or `/api`
- Shared concerns (db connection, auth middleware) live at project root

**Implementation Notes**:
```
backend/
├── main.py           # FastAPI app initialization, router registration
├── db.py             # Database engine and session management
├── auth.py           # JWT verification dependency
├── models.py         # SQLModel definitions (Task)
├── routes/
│   └── tasks.py      # Task CRUD endpoints (APIRouter)
└── tests/
    ├── contract/     # OpenAPI schema validation
    ├── integration/  # DB + auth integration tests
    └── unit/         # Pure function tests
```

Dependency injection pattern:
```python
# FastAPI dependency for DB session
def get_db():
    with Session(engine) as session:
        yield session

# FastAPI dependency for current user
def get_current_user(token: str = Depends(oauth2_scheme)):
    # Verify JWT, extract user_id
    return user_id
```

---

## Decision: Neon PostgreSQL Connection Patterns

**Context**: Need reliable, performant connection to Neon Serverless Postgres with SQLModel that meets <5s reconnection and 100+ concurrent user requirements.

**Options Considered**:

1. **Synchronous SQLModel with connection pooling** - Standard SQLModel/SQLAlchemy sync engine with pool
   - Pros: Simpler code, well-documented, sufficient for most workloads
   - Cons: Blocks event loop under heavy load, may not hit 100 concurrent users

2. **Async SQLModel with asyncpg** - Use SQLModel async with asyncpg driver
   - Pros: True async, better concurrency, FastAPI-native async/await
   - Cons: More complex, SQLModel async support still maturing

3. **Hybrid: Sync SQLModel with thread pool** - Run sync SQLModel in thread pool executor
   - Pros: Simple code, good concurrency via threads
   - Cons: Thread overhead, less elegant than native async

**Decision**: Synchronous SQLModel with connection pooling

**Rationale**:
- Neon Serverless Postgres supports standard PostgreSQL protocol (psycopg2)
- SQLModel's sync API is stable and well-documented
- Connection pooling via SQLAlchemy handles concurrency up to 100 users (SC-007)
- Simpler to implement and maintain than async (less cognitive load)
- FastAPI can run sync database calls in thread pool automatically via `def` routes (not `async def`)

**Implementation Notes**:
```python
# db.py
from sqlmodel import create_engine, Session
import os

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable required")

# Connection pool: 10 connections, 20 overflow, 30s timeout
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_timeout=30,
    pool_recycle=3600,  # Recycle connections every hour (Neon best practice)
    pool_pre_ping=True,  # Verify connections before use (handles reconnection)
)

def get_session():
    with Session(engine) as session:
        yield session
```

Neon-specific considerations:
- Use `pool_pre_ping=True` for automatic reconnection (meets SC-005 < 5s downtime)
- Set `pool_recycle=3600` to refresh connections (Neon serverless may hibernate)
- Connection string format: `postgresql://user:pass@host/db?sslmode=require`

---

## Decision: JWT Verification with python-jose

**Context**: Need secure JWT verification that works with Better Auth tokens, extracts user_id claim, and rejects 100% of invalid tokens (SC-004).

**Options Considered**:

1. **python-jose[cryptography]** - Popular JWT library with HS256 support
   - Pros: Widely used, good docs, FastAPI examples abundant
   - Cons: Development slowed, some security concerns in old versions

2. **PyJWT** - Official JWT library
   - Pros: Actively maintained, security-focused, simple API
   - Cons: Less FastAPI integration examples

3. **authlib** - Comprehensive OAuth/JWT library
   - Pros: Feature-rich, modern, well-maintained
   - Cons: Overkill for simple JWT verification, larger dependency

**Decision**: python-jose[cryptography] with HS256 algorithm

**Rationale**:
- Better Auth typically uses HS256 (HMAC-SHA256) for JWT signing with shared secret
- python-jose has extensive FastAPI integration examples and patterns
- The `[cryptography]` extra provides secure implementations
- Sufficient for shared-secret JWT verification (BETTER_AUTH_SECRET)
- Well-documented error handling for expired/invalid tokens

**Implementation Notes**:
```python
# auth.py
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os

BETTER_AUTH_SECRET = os.getenv("BETTER_AUTH_SECRET")
if not BETTER_AUTH_SECRET:
    raise ValueError("BETTER_AUTH_SECRET environment variable required")

ALGORITHM = "HS256"
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, BETTER_AUTH_SECRET, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")  # or payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token: missing user_id")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

Error responses (FR-013):
- Missing token: 401 Unauthorized (HTTPBearer handles this)
- Invalid signature: 401 Unauthorized
- Expired token: 401 Unauthorized with "Token expired" detail
- Missing user_id claim: 401 Unauthorized with "Invalid token" detail

**Better Auth Token Format Assumption**:
```json
{
  "sub": "user-uuid-or-email",
  "exp": 1234567890,
  "iat": 1234567800
}
```

Note: Actual claim name for user_id (`sub`, `user_id`, `userId`) should be verified with Better Auth documentation during implementation. If different, adjust `payload.get("sub")` accordingly.

---

## Decision: User Isolation Query Patterns

**Context**: Need to enforce user_id filtering on all database queries to guarantee zero cross-user data leakage (SC-003) without manual WHERE clauses in every query.

**Options Considered**:

1. **Manual Filtering in Every Query** - Always add `.where(Task.user_id == current_user)`
   - Pros: Explicit, easy to understand
   - Cons: Error-prone, easy to forget, doesn't scale, violates DRY

2. **SQLModel/SQLAlchemy Events** - Use before_query events to inject WHERE clauses
   - Pros: Automatic, can't forget
   - Cons: Complex, global side effects, harder to debug

3. **Dependency Injection with Scoped Queries (Recommended)** - Pass current_user to service functions, make filtering explicit but required
   - Pros: Type-safe, testable, explicit control flow, FastAPI-native
   - Cons: Requires discipline, but enforced by function signatures

**Decision**: Dependency Injection with explicit filtering

**Rationale**:
- FastAPI dependency injection makes current_user available everywhere
- Type hints ensure user_id is always passed to query functions
- Explicit is better than implicit (Zen of Python)
- Easy to test (mock current_user in tests)
- Aligns with FastAPI patterns and constitution principle VII (Smallest Viable Change - don't add complex ORM event systems)

**Implementation Notes**:
```python
# routes/tasks.py
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from db import get_session
from auth import get_current_user
from models import Task

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

@router.get("/")
def list_tasks(
    db: Session = Depends(get_session),
    current_user: str = Depends(get_current_user)
):
    statement = select(Task).where(Task.user_id == current_user)
    tasks = db.exec(statement).all()
    return tasks

@router.get("/{task_id}")
def get_task(
    task_id: int,
    db: Session = Depends(get_session),
    current_user: str = Depends(get_current_user)
):
    statement = select(Task).where(
        Task.id == task_id,
        Task.user_id == current_user  # Critical: prevents cross-user access
    )
    task = db.exec(statement).first()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task
```

**Pattern Enforcement**:
- All route functions MUST include `current_user: str = Depends(get_current_user)` parameter
- All queries MUST include `.where(Task.user_id == current_user)`
- Code review checklist: verify user_id filtering on every database query
- Integration tests MUST verify cross-user access returns 404

**Anti-Pattern to Avoid**:
```python
# BAD: Global filter without current_user context
task = db.get(Task, task_id)  # No user_id check - SECURITY VULNERABILITY
```

---

## Research Summary

**All technical decisions resolved**. Ready to proceed to Phase 1 (Design & Contracts).

**Key Takeaways**:
1. Use UV workspaces for monorepo structure
2. Layer-based FastAPI structure (models/, routes/, root modules)
3. Synchronous SQLModel with connection pooling (sufficient for 100 users)
4. python-jose for JWT verification with HS256 and BETTER_AUTH_SECRET
5. Explicit user_id filtering via dependency injection (no magic, type-safe)

**No NEEDS CLARIFICATION remaining** - all decisions made with reasonable defaults and constitution compliance.
