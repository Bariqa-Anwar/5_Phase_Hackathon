# Manual Test Scenarios: In-Memory Python Todo Console Application

**Date**: 2026-01-01
**Version**: 1.0
**Purpose**: Manual validation of all 5 core features and edge cases

---

## Test 1: Add and View Tasks

**Objective**: Verify task creation with auto-incrementing IDs and task list display

**Steps**:
1. Run `uv run todo` (or `uv run python -m src.main`)
2. View tasks (option 2) - verify empty list message displays
3. Add Task (option 1):
   - Title: "Fix login bug"
   - Description: "Users cannot log in with special characters in password"
4. Add Task (option 1):
   - Title: "Write tests"
   - Description: "Unit tests for todo manager"
5. Add Task (option 1):
   - Title: "Update docs"
   - Description: "Add installation guide to README"
6. View tasks (option 2)

**Expected Results**:
- Empty list shows: "No tasks found. Add a task to get started!"
- Task 1 created with ID 1, title "Fix login bug", status "[ ] Pending"
- Task 2 created with ID 2, title "Write tests", status "[ ] Pending"
- Task 3 created with ID 3, title "Update docs", status "[ ] Pending"
- View displays all 3 tasks with IDs 1, 2, 3 in formatted table
- All tasks show "[ ] Pending" status
- Descriptions displayed below each task

**Actual Results**: _______________

**Status**: [ ] PASS / [ ] FAIL

---

## Test 2: Mark Task Complete (Toggle Status)

**Objective**: Verify toggling task completion status

**Prerequisites**: Test 1 completed (3 tasks exist)

**Steps**:
1. Mark task complete (option 5)
2. Enter task ID: 1
3. View tasks (option 2) - verify task 1 shows "[X] Completed"
4. Mark task complete (option 5)
5. Enter task ID: 1 again
6. View tasks (option 2) - verify task 1 shows "[ ] Pending"
7. Mark task complete (option 5)
8. Enter invalid ID: 999
9. Verify error message displays

**Expected Results**:
- After step 2: "Task 1 marked as Completed"
- After step 3: Task 1 shows "[X] Completed" status
- After step 5: "Task 1 marked as Pending"
- After step 6: Task 1 shows "[ ] Pending" status
- After step 8: "Task 999 not found" error message

**Actual Results**: _______________

**Status**: [ ] PASS / [ ] FAIL

---

## Test 3: Update Task

**Objective**: Verify partial update functionality (title only, description only, both)

**Prerequisites**: Test 1 completed (3 tasks exist)

**Steps**:
1. Update task (option 3)
2. Enter task ID: 2
3. New title: "Write unit tests" (update title)
4. New description: [Press Enter to skip]
5. View tasks (option 2) - verify task 2 title changed, description unchanged
6. Update task (option 3)
7. Enter task ID: 2
8. New title: [Press Enter to skip]
9. New description: "Unit tests for TodoManager class"
10. View tasks (option 2) - verify task 2 description changed, title unchanged
11. Update task (option 3)
12. Enter task ID: 999
13. Verify error message

**Expected Results**:
- After step 4: "Task 2 updated successfully"
- After step 5: Task 2 title is "Write unit tests", description unchanged
- After step 9: "Task 2 updated successfully"
- After step 10: Task 2 description is "Unit tests for TodoManager class"
- After step 12: "Task 999 not found" error message

**Actual Results**: _______________

**Status**: [ ] PASS / [ ] FAIL

---

## Test 4: Delete Task (ID Preservation)

**Objective**: Verify task deletion and ID preservation (IDs never reused)

**Prerequisites**: Test 1 completed (3 tasks exist)

**Steps**:
1. View tasks (option 2) - note IDs: 1, 2, 3
2. Delete task (option 4)
3. Enter task ID: 2
4. Verify success message
5. View tasks (option 2) - verify only tasks 1 and 3 remain
6. Add new task (option 1):
   - Title: "Deploy to production"
   - Description: "Deploy v1.0 to prod server"
7. View tasks (option 2) - verify new task has ID 4 (not 2)
8. Delete task (option 4)
9. Enter invalid ID: 999
10. Verify error message

**Expected Results**:
- After step 3: "Task 2 deleted successfully"
- After step 5: Only tasks 1 and 3 displayed (task 2 gone)
- After step 6: "Task 4 created: Deploy to production"
- After step 7: New task has ID 4, not ID 2 (ID preservation working)
- Tasks displayed: ID 1, 3, 4 (not 1, 2, 3)
- After step 9: "Task 999 not found" error message

**Actual Results**: _______________

**Status**: [ ] PASS / [ ] FAIL

---

## Test 5: Complete Workflow (All Operations)

**Objective**: Verify full CRUD workflow in single session

**Steps**:
1. Launch fresh application session
2. Add 2 tasks (any titles/descriptions)
3. View tasks - verify 2 tasks with IDs 1, 2
4. Mark task 1 complete
5. View tasks - verify task 1 shows "[X] Completed"
6. Update task 2 title
7. View tasks - verify task 2 title changed
8. Delete task 1
9. View tasks - verify only task 2 remains
10. Exit application (option 6)
11. Relaunch application
12. View tasks (option 2)

**Expected Results**:
- Steps 1-9: All operations work as expected
- Step 10: Exit message: "Exiting application. All data will be lost."
- Step 12: Empty list displayed (data not persisted - in-memory only)

**Actual Results**: _______________

**Status**: [ ] PASS / [ ] FAIL

---

## Edge Case Tests

### EC1: Empty Input Validation

**Steps**:
1. Add task (option 1)
2. Title: [Press Enter without typing]
3. Verify error message

**Expected**: "Title cannot be empty" error

**Actual**: _______________

**Status**: [ ] PASS / [ ] FAIL

---

### EC2: Very Long Input

**Steps**:
1. Add task with 500-character description
2. View tasks
3. Verify description displays (may truncate in display)

**Expected**: Task created, description accepted

**Actual**: _______________

**Status**: [ ] PASS / [ ] FAIL

---

### EC3: Unicode Characters

**Steps**:
1. Add task with emoji in title: "🚀 Deploy app"
2. Add task with accented chars: "Café review"
3. View tasks

**Expected**: Characters display correctly (or gracefully degrade)

**Actual**: _______________

**Status**: [ ] PASS / [ ] FAIL

---

### EC4: Invalid Menu Choice

**Steps**:
1. Enter menu choice: 0
2. Enter menu choice: 7
3. Enter menu choice: abc

**Expected**: "Invalid choice. Please enter 1-6" for all

**Actual**: _______________

**Status**: [ ] PASS / [ ] FAIL

---

### EC5: Invalid Task ID Format

**Steps**:
1. Update task (option 3)
2. Enter task ID: abc
3. Delete task (option 4)
4. Enter task ID: 1.5

**Expected**: "Invalid ID. Please enter a number" error

**Actual**: _______________

**Status**: [ ] PASS / [ ] FAIL

---

### EC6: Application Exit

**Steps**:
1. Add 3 tasks
2. Exit application (option 6)
3. Verify exit message displays

**Expected**: "Exiting application. All data will be lost."

**Actual**: _______________

**Status**: [ ] PASS / [ ] FAIL

---

## Summary

**Total Tests**: 5 functional + 6 edge cases = 11 tests
**Passed**: ___ / 11
**Failed**: ___ / 11

**Overall Status**: [ ] ALL PASS / [ ] SOME FAILURES

**Notes**: _______________________________________________
