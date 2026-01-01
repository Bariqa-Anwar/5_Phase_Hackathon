"""
Task management module for in-memory todo application.

This module provides the core data model (Task) and business logic (TodoManager)
for managing tasks with CRUD operations.
"""

from dataclasses import dataclass


@dataclass
class Task:
    """Represents a single todo task with ID, title, description, and completion status.

    Attributes:
        id: Unique integer identifier (auto-assigned by TodoManager)
        title: Short text summary of the task
        description: Detailed text description of the task
        is_completed: Boolean indicating task completion status (default: False)
    """
    id: int
    title: str
    description: str
    is_completed: bool = False


class TodoManager:
    """Manages a collection of tasks with CRUD operations and auto-incrementing IDs.

    The TodoManager maintains an in-memory list of tasks and provides methods for
    creating, reading, updating, and deleting tasks. Task IDs are auto-generated
    sequentially starting from 1, and are never reused even after deletion.

    Attributes:
        _tasks: Private list storing all Task objects
        _next_id: Private counter for generating unique task IDs
    """

    def __init__(self) -> None:
        """Initialize empty task list and ID counter starting at 1."""
        self._tasks: list[Task] = []
        self._next_id: int = 1

    def add_task(self, title: str, description: str) -> Task:
        """Create a new task with auto-generated ID.

        Args:
            title: Task title (required, non-empty)
            description: Task description (required, non-empty)

        Returns:
            The newly created Task object

        Raises:
            ValueError: If title or description is empty
        """
        if not title.strip():
            raise ValueError("Title cannot be empty")
        if not description.strip():
            raise ValueError("Description cannot be empty")

        task = Task(
            id=self._next_id,
            title=title.strip(),
            description=description.strip(),
            is_completed=False
        )
        self._tasks.append(task)
        self._next_id += 1
        return task

    def get_all_tasks(self) -> list[Task]:
        """Return a copy of all tasks.

        Returns:
            List of all Task objects (copy to prevent external modification)
        """
        return self._tasks.copy()

    def get_task_by_id(self, task_id: int) -> Task | None:
        """Find task by ID. Returns None if not found.

        Args:
            task_id: Unique task identifier

        Returns:
            Task object if found, None otherwise
        """
        for task in self._tasks:
            if task.id == task_id:
                return task
        return None

    def update_task(self, task_id: int, title: str | None = None, description: str | None = None) -> bool:
        """Update task title and/or description. Returns True if successful.

        Supports partial updates: only provided fields are updated.

        Args:
            task_id: Unique task identifier
            title: New title (optional, if None then title unchanged)
            description: New description (optional, if None then description unchanged)

        Returns:
            True if task found and updated, False if task not found

        Raises:
            ValueError: If provided title or description is empty string
        """
        task = self.get_task_by_id(task_id)
        if task is None:
            return False

        if title is not None:
            if not title.strip():
                raise ValueError("Title cannot be empty")
            task.title = title.strip()

        if description is not None:
            if not description.strip():
                raise ValueError("Description cannot be empty")
            task.description = description.strip()

        return True

    def delete_task(self, task_id: int) -> bool:
        """Delete task by ID. Returns True if successful.

        Note: Task IDs are never reused. Deleting a task does not
        decrement the ID counter.

        Args:
            task_id: Unique task identifier

        Returns:
            True if task found and deleted, False if task not found
        """
        task = self.get_task_by_id(task_id)
        if task is None:
            return False
        self._tasks.remove(task)
        return True

    def toggle_completion(self, task_id: int) -> bool:
        """Toggle task completion status. Returns True if successful.

        Flips the is_completed boolean: True → False, False → True

        Args:
            task_id: Unique task identifier

        Returns:
            True if task found and toggled, False if task not found
        """
        task = self.get_task_by_id(task_id)
        if task is None:
            return False
        task.is_completed = not task.is_completed
        return True
