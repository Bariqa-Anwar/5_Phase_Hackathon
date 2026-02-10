# Backend Development Guide

## Overview

This backend is built with FastAPI 0.128.1, SQLModel 0.0.32, and Neon Serverless PostgreSQL. It implements JWT authentication via Better Auth and enforces multi-user data isolation.

## Architecture Patterns

### FastAPI Routing Pattern

All routes follow this structure:

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from db import get_session
from auth import get_current_user
from models import Task, TaskCreate, TaskResponse

router = APIRouter(prefix="/api/resource", tags=["resource"])

@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_resource(
    data: TaskCreate,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> Task:
    """Create endpoint with user isolation"""
    resource = Task(**data.model_dump(), user_id=current_user)
    session.add(resource)
    session.commit()
    session.refresh(resource)
    return resource
```

### SQLModel Query Patterns

**User Isolation (CRITICAL)**
Always filter by `user_id` to enforce data isolation:

```python
# Good: User can only see their own tasks
statement = select(Task).where(Task.user_id == current_user)
tasks = session.exec(statement).all()

# Bad: Exposes all users' data
statement = select(Task)  # NEVER do this
```

**Single Resource with 404**

```python
statement = select(Task).where(
    Task.id == task_id,
    Task.user_id == current_user,  # User isolation
)
task = session.exec(statement).first()

if not task:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Task not found",
    )
```

**Pagination**

```python
statement = (
    select(Task)
    .where(Task.user_id == current_user)
    .offset(offset)
    .limit(limit)
)
tasks = session.exec(statement).all()
```

**Partial Updates**

```python
# Only update provided fields
update_data = task_update.model_dump(exclude_unset=True)
for field, value in update_data.items():
    setattr(task, field, value)

task.updated_at = datetime.now(UTC)
session.add(task)
session.commit()
```

### JWT Middleware Usage

**Dependency Injection**

```python
from fastapi import Depends
from auth import get_current_user

@router.get("/protected")
def protected_route(current_user: str = Depends(get_current_user)):
    # current_user is the user_id from JWT "sub" claim
    # If token is invalid, middleware raises 401 before route executes
    return {"user_id": current_user}
```

**Token Format**

JWT tokens must include:
- `sub`: User identifier (extracted as `user_id`)
- `exp`: Expiration timestamp
- Signed with `BETTER_AUTH_SECRET` using HS256

### Error Handling Conventions

**HTTP Status Codes**
- 200 OK: Successful GET/PUT
- 201 Created: Successful POST
- 204 No Content: Successful DELETE
- 401 Unauthorized: Invalid/missing/expired JWT token
- 404 Not Found: Resource doesn't exist or belongs to another user
- 422 Unprocessable Entity: Invalid request payload (automatic via Pydantic)
- 500 Internal Server Error: Database or unexpected errors

**Error Response Format**

```python
# FastAPI automatically returns this format
{
    "detail": "Error message here"
}
```

**Database Error Pattern**

```python
import logging
logger = logging.getLogger(__name__)

try:
    # Database operation
    session.add(task)
    session.commit()
except Exception as e:
    logger.error(f"Operation failed: {e}")
    session.rollback()
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Operation failed",
    )
```

## Database Connection

**Engine Configuration**
Connection pooling optimized for Neon Serverless PostgreSQL:

```python
engine = create_engine(
    DATABASE_URL,
    pool_size=10,              # Base connections
    max_overflow=20,           # Extra connections when busy
    pool_timeout=30,           # Wait time for connection
    pool_recycle=3600,         # Recycle after 1 hour
    pool_pre_ping=True,        # Verify before use (auto-reconnect)
)
```

**Session Pattern**

```python
def get_session():
    with Session(engine) as session:
        yield session
```

Use as FastAPI dependency:
```python
def endpoint(session: Session = Depends(get_session)):
    # Session is automatically closed after request
    pass
```

## Adding New Models

1. Define SQLModel class in `backend/models.py`
2. Add user_id field for multi-user isolation
3. Create Pydantic schemas (Create, Update, Response)
4. Create database tables via `SQLModel.metadata.create_all(engine)`

```python
class Resource(SQLModel, table=True):
    __tablename__ = "resources"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=200)
    user_id: str = Field(max_length=255, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

## Adding New Endpoints

1. Create router file in `backend/routes/`
2. Define APIRouter with prefix and tags
3. Implement endpoints with proper dependencies
4. Register router in `backend/main.py` via `app.include_router()`

## Environment Variables

Required in `.env`:
- `DATABASE_URL`: Neon PostgreSQL connection string
- `BETTER_AUTH_SECRET`: JWT signing secret (minimum 32 characters)

## Testing

Use FastAPI TestClient for unit tests:

```python
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)
response = client.get("/health")
assert response.status_code == 200
```

## Security Checklist

- [ ] All protected routes use `Depends(get_current_user)`
- [ ] All queries filter by `user_id` for isolation
- [ ] No hardcoded secrets (use environment variables)
- [ ] Database errors are logged but don't expose internals
- [ ] CORS is configured for specific frontend origin in production
- [ ] Rate limiting is implemented (future enhancement)

## Performance Considerations

- Use pagination for list endpoints (default limit: 100)
- Connection pooling handles concurrent requests efficiently
- Database indexes on `user_id` for fast filtering
- Composite index `(user_id, id)` for user-scoped lookups

## Logging

Structured logging format:
```
YYYY-MM-DD HH:MM:SS - module - LEVEL - message
```

Log levels:
- INFO: Normal operations (startup, requests)
- WARNING: Potential issues (404s, auth failures)
- ERROR: Failures (database errors, unexpected exceptions)
