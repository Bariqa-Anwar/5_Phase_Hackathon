"""Console interface for Todo application.

This module provides the command-line interface for the in-memory todo
application, including menu display and handler functions for all CRUD operations.
"""

from todo import TodoManager


def display_menu() -> None:
    """Display the main menu options."""
    print("\n" + "=" * 50)
    print("TODO APPLICATION - IN-MEMORY SESSION")
    print("=" * 50)
    print("1. Add Task")
    print("2. View Tasks")
    print("3. Update Task")
    print("4. Delete Task")
    print("5. Mark Task Complete/Pending")
    print("6. Exit")
    print("=" * 50)


def handle_add_task(manager: TodoManager) -> None:
    """Handle adding a new task.

    Args:
        manager: TodoManager instance to add task to
    """
    print("\n--- Add New Task ---")
    title = input("Enter task title: ").strip()
    description = input("Enter task description: ").strip()

    try:
        task = manager.add_task(title, description)
        print(f"✓ Task {task.id} created: {task.title}")
    except ValueError as e:
        print(f"❌ Error: {e}")


def handle_view_tasks(manager: TodoManager) -> None:
    """Display all tasks in a formatted list.

    Args:
        manager: TodoManager instance to retrieve tasks from
    """
    print("\n--- All Tasks ---")
    tasks = manager.get_all_tasks()

    if not tasks:
        print("No tasks found. Add a task to get started!")
        return

    print(f"{'ID':<5} | {'Title':<30} | {'Status':<20}")
    print("-" * 60)
    for task in tasks:
        status = "[X] Completed" if task.is_completed else "[ ] Pending"
        title = task.title[:27] + "..." if len(task.title) > 30 else task.title
        print(f"{task.id:<5} | {title:<30} | {status:<20}")
        if task.description:
            print(f"       Description: {task.description}")


def handle_update_task(manager: TodoManager) -> None:
    """Handle updating an existing task.

    Args:
        manager: TodoManager instance to update task in
    """
    print("\n--- Update Task ---")
    try:
        task_id = int(input("Enter task ID to update: ").strip())
    except ValueError:
        print("❌ Invalid ID. Please enter a number.")
        return

    task = manager.get_task_by_id(task_id)
    if task is None:
        print(f"❌ Task {task_id} not found.")
        return

    print(f"Current: {task.title} - {task.description}")
    new_title = input("New title (press Enter to skip): ").strip()
    new_description = input("New description (press Enter to skip): ").strip()

    if not new_title and not new_description:
        print("No changes made.")
        return

    try:
        success = manager.update_task(
            task_id,
            title=new_title if new_title else None,
            description=new_description if new_description else None
        )
        if success:
            print(f"✓ Task {task_id} updated successfully.")
    except ValueError as e:
        print(f"❌ Error: {e}")


def handle_delete_task(manager: TodoManager) -> None:
    """Handle deleting a task.

    Args:
        manager: TodoManager instance to delete task from
    """
    print("\n--- Delete Task ---")
    try:
        task_id = int(input("Enter task ID to delete: ").strip())
    except ValueError:
        print("❌ Invalid ID. Please enter a number.")
        return

    success = manager.delete_task(task_id)
    if success:
        print(f"✓ Task {task_id} deleted successfully.")
    else:
        print(f"❌ Task {task_id} not found.")


def handle_toggle_completion(manager: TodoManager) -> None:
    """Handle toggling task completion status.

    Args:
        manager: TodoManager instance to toggle task in
    """
    print("\n--- Mark Task Complete/Pending ---")
    try:
        task_id = int(input("Enter task ID to toggle: ").strip())
    except ValueError:
        print("❌ Invalid ID. Please enter a number.")
        return

    task = manager.get_task_by_id(task_id)
    if task is None:
        print(f"❌ Task {task_id} not found.")
        return

    success = manager.toggle_completion(task_id)
    if success:
        task = manager.get_task_by_id(task_id)
        status = "Completed" if task.is_completed else "Pending"
        print(f"✓ Task {task_id} marked as {status}.")


def main() -> None:
    """Main entry point for the application."""
    manager = TodoManager()
    print("Welcome to the Todo Application!")
    print("Note: All data is stored in memory and will be lost on exit.")

    while True:
        display_menu()
        choice = input("\nEnter your choice (1-6): ").strip()

        match choice:
            case "1":
                handle_add_task(manager)
            case "2":
                handle_view_tasks(manager)
            case "3":
                handle_update_task(manager)
            case "4":
                handle_delete_task(manager)
            case "5":
                handle_toggle_completion(manager)
            case "6":
                print("\nExiting application. All data will be lost.")
                break
            case _:
                print("❌ Invalid choice. Please enter 1-6.")


if __name__ == "__main__":
    main()
