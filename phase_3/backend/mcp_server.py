"""
MCP Server for Todo Task Management
Official MCP SDK (FastMCP) — stdio transport

Standalone subprocess consumed by the OpenAI Agents SDK via MCPServerStdio.
Never imported by main.py or any FastAPI code.
All logging goes to stderr to avoid corrupting the stdio JSON-RPC transport.
"""
import logging
import sys
from datetime import datetime, UTC
from mcp.server.fastmcp import FastMCP
from sqlmodel import Session, select, SQLModel

from db import engine
from models import Task, TaskStatus

# Create MCP server (no DB call here — keep module import fast)
mcp = FastMCP("todo-tools")


def _task_to_dict(task: Task) -> dict:
    """Serialize Task to dict for tool output."""
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "status": task.status.value,
        "user_id": task.user_id,
        "created_at": task.created_at.isoformat(),
        "updated_at": task.updated_at.isoformat(),
    }


@mcp.tool()
def add_task(user_id: str, title: str, description: str = "") -> dict:
    """Add a new task for the specified user."""
    try:
        with Session(engine) as session:
            task = Task(
                title=title,
                description=description or None,
                user_id=user_id,
            )
            session.add(task)
            session.commit()
            session.refresh(task)
            return _task_to_dict(task)
    except Exception:
        return {"error": "Failed to create task"}


@mcp.tool()
def list_tasks(user_id: str, status: str = "") -> dict:
    """List tasks for the specified user, optionally filtered by status."""
    try:
        with Session(engine) as session:
            query = select(Task).where(Task.user_id == user_id)
            if status:
                query = query.where(Task.status == TaskStatus(status))
            query = query.order_by(Task.created_at.desc())
            tasks = session.exec(query).all()
            return {
                "tasks": [_task_to_dict(t) for t in tasks],
                "count": len(tasks),
            }
    except ValueError:
        return {"error": "Invalid status. Must be one of: pending, in_progress, completed"}
    except Exception:
        return {"error": "Failed to list tasks"}


@mcp.tool()
def complete_task(user_id: str, task_id: int) -> dict:
    """Mark a specific task as completed."""
    try:
        with Session(engine) as session:
            task = session.exec(
                select(Task).where(Task.id == task_id, Task.user_id == user_id)
            ).first()
            if not task:
                return {"error": "Task not found"}
            task.status = TaskStatus.COMPLETED
            task.updated_at = datetime.now(UTC)
            session.add(task)
            session.commit()
            session.refresh(task)
            return _task_to_dict(task)
    except Exception:
        return {"error": "Failed to complete task"}


@mcp.tool()
def delete_task(user_id: str, task_id: int) -> dict:
    """Permanently delete a specific task."""
    try:
        with Session(engine) as session:
            task = session.exec(
                select(Task).where(Task.id == task_id, Task.user_id == user_id)
            ).first()
            if not task:
                return {"error": "Task not found"}
            session.delete(task)
            session.commit()
            return {"deleted": True, "task_id": task_id}
    except Exception:
        return {"error": "Failed to delete task"}


@mcp.tool()
def update_task(user_id: str, task_id: int, title: str = "", description: str = "") -> dict:
    """Update the title and/or description of a specific task."""
    if not title and not description:
        return {"error": "At least one of title or description must be provided"}
    try:
        with Session(engine) as session:
            task = session.exec(
                select(Task).where(Task.id == task_id, Task.user_id == user_id)
            ).first()
            if not task:
                return {"error": "Task not found"}
            if title:
                task.title = title
            if description:
                task.description = description
            task.updated_at = datetime.now(UTC)
            session.add(task)
            session.commit()
            session.refresh(task)
            return _task_to_dict(task)
    except Exception:
        return {"error": "Failed to update task"}


if __name__ == "__main__":
    # Configure logging to stderr to avoid corrupting stdio JSON-RPC transport
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        stream=sys.stderr,
    )
    _logger = logging.getLogger(__name__)
    _logger.info("MCP server: initializing DB tables...")
    SQLModel.metadata.create_all(engine)
    _logger.info("MCP server: starting stdio transport...")
    mcp.run(transport="stdio")
