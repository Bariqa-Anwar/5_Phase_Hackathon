"""
Data models for Todo Backend API
SQLModel classes for database tables and Pydantic schemas for API contracts
"""
from datetime import datetime
from enum import Enum
from typing import Optional
from sqlmodel import Field, SQLModel, Index


class TaskStatus(str, Enum):
    """Task status enum"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class Task(SQLModel, table=True):
    """
    Task database model with user ownership for multi-user isolation

    Composite index (user_id, id) enables efficient user-scoped queries
    """
    __tablename__ = "tasks"
    __table_args__ = (
        Index("ix_tasks_user_id_id", "user_id", "id"),
        {"extend_existing": True}
    )

    # Primary key
    id: Optional[int] = Field(default=None, primary_key=True)

    # Task fields
    title: str = Field(max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    status: TaskStatus = Field(default=TaskStatus.PENDING)

    # User isolation
    user_id: str = Field(max_length=255, index=True)

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# Pydantic schemas for API contracts

class TaskCreate(SQLModel):
    """Schema for creating a new task"""
    title: str = Field(max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    status: TaskStatus = Field(default=TaskStatus.PENDING)


class TaskUpdate(SQLModel):
    """Schema for updating an existing task (all fields optional)"""
    title: Optional[str] = Field(default=None, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    status: Optional[TaskStatus] = Field(default=None)


class TaskResponse(SQLModel):
    """Schema for task API responses"""
    id: int
    title: str
    description: Optional[str]
    status: TaskStatus
    user_id: str
    created_at: datetime
    updated_at: datetime
