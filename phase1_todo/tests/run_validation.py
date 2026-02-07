"""
Automated validation script for Phase 3: Testing & Validation

This script programmatically tests all 5 core features of the Todo application:
1. Add and View Tasks
2. Mark Task Complete (Toggle)
3. Update Task
4. Delete Task (with ID Preservation)
5. Complete Workflow

All tests are executed against the TodoManager directly to validate business logic.
"""

from src.todo import TodoManager, Task


def test_add_and_view_tasks() -> tuple[bool, str]:
    """Test 1: Add and View Tasks - Verify task creation with auto-incrementing IDs."""
    manager = TodoManager()
    results = []

    # View empty list
    tasks = manager.get_all_tasks()
    if len(tasks) != 0:
        return False, "Empty list check failed: expected 0 tasks"
    results.append("[OK] Empty list verified")

    # Add 3 tasks
    task1 = manager.add_task("Fix login bug", "Users cannot log in with special characters in password")
    if task1.id != 1:
        return False, f"Task 1 ID incorrect: expected 1, got {task1.id}"
    results.append(f"[OK] Task 1 created: ID={task1.id}, Title='{task1.title}'")

    task2 = manager.add_task("Write tests", "Unit tests for todo manager")
    if task2.id != 2:
        return False, f"Task 2 ID incorrect: expected 2, got {task2.id}"
    results.append(f"[OK] Task 2 created: ID={task2.id}, Title='{task2.title}'")

    task3 = manager.add_task("Update docs", "Add installation guide to README")
    if task3.id != 3:
        return False, f"Task 3 ID incorrect: expected 3, got {task3.id}"
    results.append(f"[OK] Task 3 created: ID={task3.id}, Title='{task3.title}'")

    # View all tasks
    tasks = manager.get_all_tasks()
    if len(tasks) != 3:
        return False, f"Task count incorrect: expected 3, got {len(tasks)}"
    results.append(f"[OK] View displays all 3 tasks")

    # Verify all tasks show Pending status
    for task in tasks:
        if task.is_completed:
            return False, f"Task {task.id} should be Pending but is Completed"
    results.append("[OK] All tasks show '[ ] Pending' status")

    return True, "\n".join(results)


def test_mark_task_complete() -> tuple[bool, str]:
    """Test 2: Mark Task Complete - Verify toggling task completion status."""
    manager = TodoManager()
    results = []

    # Setup: Add 3 tasks
    manager.add_task("Fix login bug", "Test description")
    manager.add_task("Write tests", "Test description")
    manager.add_task("Update docs", "Test description")
    results.append("[OK] Setup: 3 tasks created")

    # Toggle task 1 to Completed
    success = manager.toggle_completion(1)
    if not success:
        return False, "Toggle task 1 failed"
    task1 = manager.get_task_by_id(1)
    if not task1.is_completed:
        return False, "Task 1 should be Completed"
    results.append("[OK] Task 1 marked as Completed")

    # Toggle task 1 back to Pending
    success = manager.toggle_completion(1)
    if not success:
        return False, "Toggle task 1 back failed"
    task1 = manager.get_task_by_id(1)
    if task1.is_completed:
        return False, "Task 1 should be Pending"
    results.append("[OK] Task 1 marked as Pending")

    # Try invalid ID
    success = manager.toggle_completion(999)
    if success:
        return False, "Toggle with invalid ID should fail"
    results.append("[OK] Invalid ID 999 handled correctly")

    return True, "\n".join(results)


def test_update_task() -> tuple[bool, str]:
    """Test 3: Update Task - Verify partial update functionality."""
    manager = TodoManager()
    results = []

    # Setup: Add 3 tasks
    manager.add_task("Fix login bug", "Original description")
    manager.add_task("Write tests", "Original description")
    manager.add_task("Update docs", "Original description")
    results.append("[OK] Setup: 3 tasks created")

    # Update task 2 title only
    success = manager.update_task(2, title="Write unit tests", description=None)
    if not success:
        return False, "Update task 2 title failed"
    task2 = manager.get_task_by_id(2)
    if task2.title != "Write unit tests":
        return False, f"Task 2 title incorrect: expected 'Write unit tests', got '{task2.title}'"
    if task2.description != "Original description":
        return False, "Task 2 description should be unchanged"
    results.append("[OK] Task 2 title updated, description unchanged")

    # Update task 2 description only
    success = manager.update_task(2, title=None, description="Unit tests for TodoManager class")
    if not success:
        return False, "Update task 2 description failed"
    task2 = manager.get_task_by_id(2)
    if task2.description != "Unit tests for TodoManager class":
        return False, f"Task 2 description incorrect"
    if task2.title != "Write unit tests":
        return False, "Task 2 title should be unchanged"
    results.append("[OK] Task 2 description updated, title unchanged")

    # Try invalid ID
    success = manager.update_task(999, title="New Title")
    if success:
        return False, "Update with invalid ID should fail"
    results.append("[OK] Invalid ID 999 handled correctly")

    return True, "\n".join(results)


def test_delete_task_id_preservation() -> tuple[bool, str]:
    """Test 4: Delete Task - Verify task deletion and ID preservation."""
    manager = TodoManager()
    results = []

    # Setup: Add 3 tasks
    manager.add_task("Task 1", "Description 1")
    manager.add_task("Task 2", "Description 2")
    manager.add_task("Task 3", "Description 3")
    results.append("[OK] Setup: 3 tasks created with IDs 1, 2, 3")

    # Delete task 2
    success = manager.delete_task(2)
    if not success:
        return False, "Delete task 2 failed"
    tasks = manager.get_all_tasks()
    if len(tasks) != 2:
        return False, f"Task count after delete incorrect: expected 2, got {len(tasks)}"
    task_ids = [t.id for t in tasks]
    if 2 in task_ids:
        return False, "Task 2 should be deleted"
    if task_ids != [1, 3]:
        return False, f"Remaining task IDs incorrect: expected [1, 3], got {task_ids}"
    results.append("[OK] Task 2 deleted successfully, tasks 1 and 3 remain")

    # Add new task - should get ID 4, NOT ID 2 (ID preservation)
    task4 = manager.add_task("Deploy to production", "Deploy v1.0 to prod server")
    if task4.id != 4:
        return False, f"CRITICAL: ID preservation failed! New task got ID {task4.id}, expected 4"
    results.append(f"[OK] ID PRESERVATION VERIFIED: New task got ID 4 (not 2)")

    # Verify current task IDs are 1, 3, 4
    tasks = manager.get_all_tasks()
    task_ids = sorted([t.id for t in tasks])
    if task_ids != [1, 3, 4]:
        return False, f"Final task IDs incorrect: expected [1, 3, 4], got {task_ids}"
    results.append("[OK] Final task IDs: 1, 3, 4 (ID 2 never reused)")

    # Try invalid ID
    success = manager.delete_task(999)
    if success:
        return False, "Delete with invalid ID should fail"
    results.append("[OK] Invalid ID 999 handled correctly")

    return True, "\n".join(results)


def test_complete_workflow() -> tuple[bool, str]:
    """Test 5: Complete Workflow - Verify full CRUD workflow in single session."""
    manager = TodoManager()
    results = []

    # Add 2 tasks
    task1 = manager.add_task("Implement feature X", "Feature X specification")
    task2 = manager.add_task("Write documentation", "Docs for feature X")
    tasks = manager.get_all_tasks()
    if len(tasks) != 2 or task1.id != 1 or task2.id != 2:
        return False, "Initial task creation failed"
    results.append("[OK] 2 tasks created with IDs 1, 2")

    # Mark task 1 complete
    manager.toggle_completion(1)
    task1 = manager.get_task_by_id(1)
    if not task1.is_completed:
        return False, "Task 1 should be Completed"
    results.append("[OK] Task 1 marked as Completed")

    # Update task 2 title
    manager.update_task(2, title="Write comprehensive documentation")
    task2 = manager.get_task_by_id(2)
    if task2.title != "Write comprehensive documentation":
        return False, "Task 2 title update failed"
    results.append("[OK] Task 2 title updated")

    # Delete task 1
    manager.delete_task(1)
    tasks = manager.get_all_tasks()
    if len(tasks) != 1 or tasks[0].id != 2:
        return False, "Task 1 deletion failed"
    results.append("[OK] Task 1 deleted, only task 2 remains")

    # Verify in-memory storage (data would be lost on application exit)
    # We simulate this by creating a new manager instance
    new_manager = TodoManager()
    new_tasks = new_manager.get_all_tasks()
    if len(new_tasks) != 0:
        return False, "New manager instance should be empty (in-memory storage)"
    results.append("[OK] In-memory verification: New manager instance is empty")

    return True, "\n".join(results)


def test_edge_cases() -> tuple[bool, str]:
    """Test Edge Cases: Validation and error handling."""
    manager = TodoManager()
    results = []

    # EC1: Empty title validation
    try:
        manager.add_task("", "Description")
        return False, "Empty title should raise ValueError"
    except ValueError:
        results.append("[OK] EC1: Empty title rejected")

    # EC2: Empty description validation
    try:
        manager.add_task("Title", "")
        return False, "Empty description should raise ValueError"
    except ValueError:
        results.append("[OK] EC2: Empty description rejected")

    # EC3: Very long input accepted
    long_desc = "A" * 500
    task = manager.add_task("Long task", long_desc)
    if len(task.description) != 500:
        return False, "Long description should be accepted"
    results.append("[OK] EC3: 500-character description accepted")

    # EC4: Unicode characters
    task_emoji = manager.add_task("🚀 Deploy app", "Deploy with rocket emoji")
    task_accent = manager.add_task("Café review", "Review café with accents")
    if "🚀" not in task_emoji.title or "Café" not in task_accent.title:
        return False, "Unicode characters should be preserved"
    results.append("[OK] EC4: Unicode characters (emoji, accents) preserved")

    # EC5: Invalid task ID operations
    if manager.get_task_by_id(999) is not None:
        return False, "get_task_by_id(999) should return None"
    if manager.update_task(999, title="New"):
        return False, "update_task(999) should return False"
    if manager.delete_task(999):
        return False, "delete_task(999) should return False"
    if manager.toggle_completion(999):
        return False, "toggle_completion(999) should return False"
    results.append("[OK] EC5: Invalid ID operations handled correctly")

    return True, "\n".join(results)


def run_all_tests() -> dict[str, dict]:
    """Execute all validation tests and return results."""
    test_suite = {
        "Test 1: Add and View Tasks": test_add_and_view_tasks,
        "Test 2: Mark Task Complete": test_mark_task_complete,
        "Test 3: Update Task": test_update_task,
        "Test 4: Delete Task (ID Preservation)": test_delete_task_id_preservation,
        "Test 5: Complete Workflow": test_complete_workflow,
        "Edge Case Tests": test_edge_cases,
    }

    results = {}
    print("=" * 70)
    print("PHASE 3 VALIDATION: IN-MEMORY TODO APPLICATION")
    print("=" * 70)
    print()

    for test_name, test_func in test_suite.items():
        print(f"Running: {test_name}")
        print("-" * 70)
        passed, details = test_func()
        results[test_name] = {"passed": passed, "details": details}
        print(details)
        print(f"\nResult: {'[PASS]' if passed else '[FAIL]'}")
        print("=" * 70)
        print()

    return results


if __name__ == "__main__":
    results = run_all_tests()

    # Summary
    total = len(results)
    passed = sum(1 for r in results.values() if r["passed"])
    failed = total - passed

    print("\n" + "=" * 70)
    print("VALIDATION SUMMARY")
    print("=" * 70)
    print(f"Total Tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Status: {'ALL TESTS PASSED' if failed == 0 else 'SOME TESTS FAILED'}")
    print("=" * 70)
