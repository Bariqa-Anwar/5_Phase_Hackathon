# Data Model: Build Secure Backend Foundation

**Feature**: 001-secure-backend-foundation
**Date**: 2026-02-05
**Purpose**: Database schema and entity definitions

---

## Overview

This feature introduces a single entity (**Task**) with user-level ownership for multi-tenant task management. The model enforces strict user isolation at the database level through query-level filtering.

---

## Entity: Task

**Description**: Represents a user's to-do task with title, description, status, and ownership tracking.

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | Integer | Primary Key, Auto-increment | Unique task identifier |
| `title` | String(200) | NOT NULL | Task title (max 200 characters) |
| `description` | String(2000) | NULL | Optional task description (max 2000 characters) |
| `status` | String(20) | NOT NULL, Enum | Task status: "pending", "in_progress", "completed" |
| `user_id` | String(255) | NOT NULL, Indexed | Owner's user ID (from JWT token) |
| `created_at` | DateTime | NOT NULL, Auto-generated | Task creation timestamp (UTC) |
| `updated_at` | DateTime | NOT NULL, Auto-updated | Last modification timestamp (UTC) |

### Indexes

| Index Name | Fields | Type | Purpose |
|------------|--------|------|---------|
| `pk_task_id` | `id` | Primary Key | Unique task lookup |
| `idx_task_user_id` | `user_id`, `id` | Composite | Efficient user-scoped queries and ownership checks |

**Rationale for Composite Index**: Most queries filter by `user_id` (for isolation), then may sort/filter by `id`. The composite index `(user_id, id)` enables efficient:
- `SELECT * FROM tasks WHERE user_id = ? ORDER BY id`
- `SELECT * FROM tasks WHERE user_id = ? AND id = ?`

### Relationships

- **Task** → **User** (via `user_id`)
  - Relationship: Many-to-One (many tasks belong to one user)
  - Enforcement: Query-level (not foreign key constraint, as User table managed by Better Auth frontend)
  - Cardinality: A user can have 0..N tasks; a task has exactly 1 owner

### Validation Rules

| Rule | Field | Validation | Error Message |
|------|-------|------------|---------------|
| VR-001 | `title` | Non-empty, 1-200 characters | "Title is required and must be between 1 and 200 characters" |
| VR-002 | `description` | 0-2000 characters (nullable) | "Description must be 2000 characters or less" |
| VR-003 | `status` | Must be one of: "pending", "in_progress", "completed" | "Status must be one of: pending, in_progress, completed" |
| VR-004 | `user_id` | Non-empty string | "User ID is required" |
| VR-005 | `created_at` | Auto-generated, cannot be modified | N/A (system-managed) |
| VR-006 | `updated_at` | Auto-updated on save | N/A (system-managed) |

### State Transitions

**Status Enum**: `pending` → `in_progress` → `completed`

```
┌─────────┐
│ pending │
└────┬────┘
     │
     ▼
┌──────────────┐
│ in_progress  │
└──────┬───────┘
       │
       ▼
┌───────────┐
│ completed │
└───────────┘
```

**Allowed Transitions** (enforced at application level, not database):
- `pending` → `in_progress`
- `pending` → `completed` (skip in_progress)
- `in_progress` → `completed`
- `in_progress` → `pending` (reopen task)
- `completed` → `pending` (reopen task)

**Validation**: Any status value in ["pending", "in_progress", "completed"] is valid. No strict state machine at database level (flexibility for future states).

### SQLModel Definition Example

```python
from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum

class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

class Task(SQLModel, table=True):
    __tablename__ = "tasks"

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(max_length=200, nullable=False)
    description: Optional[str] = Field(default=None, max_length=2000)
    status: TaskStatus = Field(default=TaskStatus.PENDING, nullable=False)
    user_id: str = Field(max_length=255, nullable=False, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False, sa_column_kwargs={"onupdate": datetime.utcnow})

    # Composite index defined at table level
    __table_args__ = (
        Index('idx_task_user_id', 'user_id', 'id'),
    )
```

### Pydantic Schemas (API Request/Response)

```python
from pydantic import BaseModel, Field as PydanticField
from datetime import datetime
from typing import Optional

class TaskCreate(BaseModel):
    """Request schema for creating a new task"""
    title: str = PydanticField(..., min_length=1, max_length=200)
    description: Optional[str] = PydanticField(None, max_length=2000)
    status: TaskStatus = TaskStatus.PENDING

class TaskUpdate(BaseModel):
    """Request schema for updating an existing task"""
    title: Optional[str] = PydanticField(None, min_length=1, max_length=200)
    description: Optional[str] = PydanticField(None, max_length=2000)
    status: Optional[TaskStatus] = None

class TaskResponse(BaseModel):
    """Response schema for task data"""
    id: int
    title: str
    description: Optional[str]
    status: TaskStatus
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # Allow ORM model conversion
```

---

## Database Migration

**Initial Schema Creation**:

```sql
-- Create tasks table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(2000),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_status CHECK (status IN ('pending', 'in_progress', 'completed'))
);

-- Create composite index for user-scoped queries
CREATE INDEX idx_task_user_id ON tasks(user_id, id);

-- Optional: Add updated_at trigger (PostgreSQL)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**SQLModel Auto-Migration**:
SQLModel can create tables automatically via `SQLModel.metadata.create_all(engine)`. However, for production, use Alembic for versioned migrations.

---

## Data Integrity

### User Isolation

**Critical Security Requirement**: ALL queries MUST filter by `user_id` to prevent cross-user data access.

**Query Pattern** (enforced in code review):
```python
# CORRECT: Always filter by user_id
statement = select(Task).where(Task.user_id == current_user)

# INCORRECT: Missing user_id filter - SECURITY VULNERABILITY
statement = select(Task)  # ❌ NEVER DO THIS
```

**Testing**: Integration tests MUST verify:
1. User A cannot access User B's tasks (returns 404)
2. User A can only see their own tasks in list queries
3. User A can only update/delete their own tasks

### Constraints

| Constraint | Type | Enforcement | Purpose |
|------------|------|-------------|---------|
| `user_id` NOT NULL | Database | Column constraint | Prevent orphaned tasks |
| `title` NOT NULL | Database | Column constraint | Ensure all tasks have titles |
| `status` enum check | Database | CHECK constraint | Ensure valid status values |
| `user_id` filtering | Application | Query-level WHERE clause | Multi-tenant isolation |

---

## Performance Considerations

| Scenario | Expected Volume | Optimization |
|----------|-----------------|--------------|
| List user's tasks | 100-1000 tasks per user | Composite index `(user_id, id)`, pagination (LIMIT/OFFSET) |
| Get single task | 1 task | Composite index `(user_id, id)` enables index-only scan |
| Create task | < 10 TPS per user | Auto-increment ID, minimal validation overhead |
| Update task | < 5 TPS per user | Update only modified fields (SQLModel partial updates) |
| Delete task | < 2 TPS per user | Simple DELETE with composite index lookup |

**Concurrency**: PostgreSQL row-level locking handles concurrent updates. No application-level locking required for <100 concurrent users (SC-007).

---

## Example Queries

### Create Task
```python
new_task = Task(
    title="Complete project documentation",
    description="Write comprehensive docs for API",
    status=TaskStatus.PENDING,
    user_id=current_user
)
db.add(new_task)
db.commit()
db.refresh(new_task)
return new_task
```

### List User's Tasks
```python
statement = select(Task).where(Task.user_id == current_user).order_by(Task.id)
tasks = db.exec(statement).all()
return tasks
```

### Get Single Task (with ownership check)
```python
statement = select(Task).where(Task.id == task_id, Task.user_id == current_user)
task = db.exec(statement).first()
if task is None:
    raise HTTPException(status_code=404, detail="Task not found")
return task
```

### Update Task (partial update)
```python
statement = select(Task).where(Task.id == task_id, Task.user_id == current_user)
task = db.exec(statement).first()
if task is None:
    raise HTTPException(status_code=404, detail="Task not found")

# Update only provided fields
if update_data.title is not None:
    task.title = update_data.title
if update_data.description is not None:
    task.description = update_data.description
if update_data.status is not None:
    task.status = update_data.status

task.updated_at = datetime.utcnow()  # Explicit update
db.add(task)
db.commit()
db.refresh(task)
return task
```

### Delete Task
```python
statement = select(Task).where(Task.id == task_id, Task.user_id == current_user)
task = db.exec(statement).first()
if task is None:
    raise HTTPException(status_code=404, detail="Task not found")

db.delete(task)
db.commit()
return {"detail": "Task deleted successfully"}
```

---

## Summary

**Entity Count**: 1 (Task)
**Table Count**: 1 (tasks)
**Index Count**: 2 (primary key + composite user_id/id)
**Validation Rules**: 6
**Security**: User isolation enforced via query-level filtering

**Ready for**: Contract definition (OpenAPI spec) and implementation
