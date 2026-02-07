"""
Task CRUD API endpoints with user isolation
All endpoints require JWT authentication and enforce user_id filtering
"""
import logging
from typing import List, Optional
from datetime import datetime, UTC
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select

from db import get_session
from auth import get_current_user
from models import Task, TaskCreate, TaskUpdate, TaskResponse

# Configure logging
logger = logging.getLogger(__name__)

# Create router with prefix and tags
router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task_data: TaskCreate,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> Task:
    """
    Create a new task for the authenticated user

    Returns 201 with created task on success
    """
    try:
        # Create task with user ownership
        task = Task(
            title=task_data.title,
            description=task_data.description,
            status=task_data.status,
            user_id=current_user,
        )
        session.add(task)
        session.commit()
        session.refresh(task)

        logger.info(f"Created task {task.id} for user {current_user}")
        return task

    except Exception as e:
        logger.error(f"Error creating task for user {current_user}: {e}")
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create task",
        )


@router.get("/", response_model=List[TaskResponse])
def list_tasks(
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> List[Task]:
    """
    List all tasks for the authenticated user

    Supports pagination via limit and offset query parameters
    Returns 200 with list of tasks (may be empty)
    """
    try:
        # Query tasks filtered by user_id with pagination
        statement = (
            select(Task)
            .where(Task.user_id == current_user)
            .offset(offset)
            .limit(limit)
        )
        tasks = session.exec(statement).all()

        logger.info(f"Listed {len(tasks)} tasks for user {current_user}")
        return list(tasks)

    except Exception as e:
        logger.error(f"Error listing tasks for user {current_user}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list tasks",
        )


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> Task:
    """
    Get a specific task by ID

    Returns 200 with task if found and owned by user
    Returns 404 if task not found or belongs to another user (user isolation)
    """
    try:
        # Query task by id AND user_id for user isolation
        statement = select(Task).where(
            Task.id == task_id,
            Task.user_id == current_user,
        )
        task = session.exec(statement).first()

        if not task:
            logger.warning(f"Task {task_id} not found for user {current_user}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found",
            )

        return task

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting task {task_id} for user {current_user}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get task",
        )


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_update: TaskUpdate,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> Task:
    """
    Update a specific task by ID

    Only updates fields that are provided (partial update)
    Returns 200 with updated task if found and owned by user
    Returns 404 if task not found or belongs to another user (user isolation)
    """
    try:
        # Query task by id AND user_id for user isolation
        statement = select(Task).where(
            Task.id == task_id,
            Task.user_id == current_user,
        )
        task = session.exec(statement).first()

        if not task:
            logger.warning(f"Task {task_id} not found for user {current_user}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found",
            )

        # Update only provided fields
        update_data = task_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(task, field, value)

        # Update timestamp
        task.updated_at = datetime.now(UTC)

        session.add(task)
        session.commit()
        session.refresh(task)

        logger.info(f"Updated task {task_id} for user {current_user}")
        return task

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating task {task_id} for user {current_user}: {e}")
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update task",
        )


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> None:
    """
    Delete a specific task by ID

    Returns 204 if task deleted successfully
    Returns 404 if task not found or belongs to another user (user isolation)
    """
    try:
        # Query task by id AND user_id for user isolation
        statement = select(Task).where(
            Task.id == task_id,
            Task.user_id == current_user,
        )
        task = session.exec(statement).first()

        if not task:
            logger.warning(f"Task {task_id} not found for user {current_user}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found",
            )

        session.delete(task)
        session.commit()

        logger.info(f"Deleted task {task_id} for user {current_user}")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting task {task_id} for user {current_user}: {e}")
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete task",
        )
