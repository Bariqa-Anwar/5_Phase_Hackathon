---
description: "Atomic task list for In-Memory Python Todo Console Application"
---

# Tasks: In-Memory Python Todo Console Application

**Input**: Design documents from `specs/001-todo-console-app/`
**Prerequisites**: plan.md (complete), spec.md (complete), constitution.md (ratified)

**Tests**: Manual validation via 5 test scenarios (Add, View, Update, Delete, Mark Complete)

**Organization**: Tasks grouped by implementation phase, aligned with user story priorities (P1→P2→P3)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task primarily supports (US1-US4)
- **Duration**: Each task estimated at 15-30 minutes
- **Acceptance**: Single, testable criterion per task

## Path Conventions

Single project structure:
- Source: `src/` at repository root
- Tests: `tests/` at repository root
- Config: `pyproject.toml` at repository root

---

## Phase 0: Environment Setup (Foundation)

**Purpose**: Initialize UV project structure without git operations

**Duration**: ~30 minutes total

### ✅ T0.1: Initialize UV Project Structure [COMPLETED]

**Description**: Initialize UV project with Python 3.13+ requirement and basic configuration

**Duration**: 15 minutes

**Acceptance Criteria**:
- `pyproject.toml` exists with correct project metadata
- Python version requirement set to `>=3.13`
- Entry point script configured: `todo = "src.main:main"`
- NO `.git` directory created (constitution compliance)

**Dependencies**: None

**Steps**:
1. Run `uv init --name phase1-todo` (or manually create `pyproject.toml`)
2. Edit `pyproject.toml` to add:
   ```toml
   [project]
   name = "phase1-todo"
   version = "0.1.0"
   requires-python = ">=3.13"

   [project.scripts]
   todo = "src.main:main"
   ```
3. Verify no `.git` directory exists: `ls -la | grep git` should return empty

**Constitution Check**: ✅ No git operations, ✅ UV tooling used

---

### ✅ T0.2: Create Directory Structure [COMPLETED]

**Description**: Create source and test directories per project structure

**Duration**: 10 minutes

**Acceptance Criteria**:
- `src/` directory exists
- `tests/` directory exists
- `specs_history/` directory exists (if not already present)
- NO persistent storage files created (no .db, .json, .csv)

**Dependencies**: T0.1 (project initialized)

**Steps**:
1. Create directories: `mkdir -p src tests`
2. Create empty `src/__init__.py` package marker
3. Verify directory structure:
   ```
   phase1_todo/
   ├── src/
   │   └── __init__.py
   ├── tests/
   └── pyproject.toml
   ```

**Constitution Check**: ✅ Code in `/src`, ✅ No file persistence

---

### ✅ T0.3: Verify UV Environment [COMPLETED]

**Description**: Create virtual environment and verify Python 3.13+ is active

**Duration**: 10 minutes

**Acceptance Criteria**:
- Virtual environment created via `uv venv`
- Python version is 3.13 or higher when checked via `uv run python --version`
- Can execute Python commands via `uv run` prefix

**Dependencies**: T0.1 (pyproject.toml exists)

**Steps**:
1. Run `uv venv` to create virtual environment
2. Test: `uv run python --version` → Output should show Python 3.13.x
3. Test: `uv run python -c "import sys; print(sys.version_info >= (3, 13))"` → Output: True

**Constitution Check**: ✅ UV tooling verified

**Checkpoint 1**: 🛑 **MANUAL REVIEW** - Verify environment setup complete, no git artifacts present

---

## Phase 1: Data Model & Business Logic (Core Foundation)

**Purpose**: Implement Task dataclass and TodoManager with full CRUD operations

**Duration**: ~90 minutes total

**User Story Alignment**: Supports US1 (Create/View), US2 (Mark Complete), US3 (Update), US4 (Delete)

---

### ✅ T1.1: [P] [US1] Create Task Dataclass [COMPLETED]

**Description**: Define Task dataclass in `src/todo.py` with type hints

**Duration**: 20 minutes

**Acceptance Criteria**:
- `src/todo.py` exists with `Task` dataclass
- Task has 4 fields: `id: int`, `title: str`, `description: str`, `is_completed: bool = False`
- Uses `@dataclass` decorator from Python standard library
- Full type hints on all fields
- Docstring explains Task purpose

**Dependencies**: T0.2 (src/ directory exists)

**Steps**:
1. Create `src/todo.py`
2. Import: `from dataclasses import dataclass`
3. Define Task:
   ```python
   @dataclass
   class Task:
       """Represents a single todo task with ID, title, description, and completion status."""
       id: int
       title: str
       description: str
       is_completed: bool = False
   ```
4. Test instantiation: `uv run python -c "from src.todo import Task; t = Task(1, 'Test', 'Desc'); print(t)"`

**Constitution Check**: ✅ Type hints required, ✅ Clean code (PEP 8)

---

### ✅ T1.2: [P] [US1] Initialize TodoManager Class [COMPLETED]

**Description**: Create TodoManager class with empty task list and ID counter initialization

**Duration**: 15 minutes

**Acceptance Criteria**:
- `TodoManager` class defined in `src/todo.py`
- `__init__()` method initializes `_tasks: list[Task]` as empty list
- `__init__()` method initializes `_next_id: int = 1`
- Private attributes (`_tasks`, `_next_id`) use underscore convention
- Class docstring explains TodoManager purpose

**Dependencies**: T1.1 (Task dataclass exists)

**Steps**:
1. Add to `src/todo.py`:
   ```python
   class TodoManager:
       """Manages a collection of tasks with CRUD operations and auto-incrementing IDs."""

       def __init__(self) -> None:
           """Initialize empty task list and ID counter starting at 1."""
           self._tasks: list[Task] = []
           self._next_id: int = 1
   ```
2. Test instantiation: `uv run python -c "from src.todo import TodoManager; m = TodoManager(); print(m._next_id)"`

**Constitution Check**: ✅ In-memory storage (list), ✅ ID-based management

---

### ✅ T1.3: [US1] Implement add_task() Method [COMPLETED]

**Description**: Implement task creation with auto-incrementing ID and input validation

**Duration**: 25 minutes

**Acceptance Criteria**:
- `add_task(self, title: str, description: str) -> Task` method exists in TodoManager
- Creates Task with current `_next_id`, appends to `_tasks`, increments `_next_id`
- Returns created Task object
- Validates title and description are non-empty (raise ValueError if empty)
- Full type hints and docstring

**Dependencies**: T1.2 (TodoManager initialized)

**Steps**:
1. Add method to TodoManager:
   ```python
   def add_task(self, title: str, description: str) -> Task:
       """Create a new task with auto-generated ID."""
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
   ```
2. Test: Create 3 tasks, verify IDs are 1, 2, 3

**Constitution Check**: ✅ ID auto-increment enforced

---

### ✅ T1.4: [US1] Implement get_all_tasks() Method [COMPLETED]

**Description**: Return copy of all tasks for display without exposing internal list

**Duration**: 15 minutes

**Acceptance Criteria**:
- `get_all_tasks(self) -> list[Task]` method exists
- Returns a copy of `_tasks` list (not the original)
- Works with empty list (returns empty list, not None)
- Full type hints and docstring

**Dependencies**: T1.2 (TodoManager initialized)

**Steps**:
1. Add method:
   ```python
   def get_all_tasks(self) -> list[Task]:
       """Return a copy of all tasks."""
       return self._tasks.copy()
   ```
2. Test: Add 2 tasks, call `get_all_tasks()`, verify length is 2 and modifying returned list doesn't affect internal state

**Constitution Check**: ✅ Encapsulation (returns copy)

---

### ✅ T1.5: [US3,US4] Implement get_task_by_id() Method [COMPLETED]

**Description**: Find task by ID using linear search, return None if not found

**Duration**: 20 minutes

**Acceptance Criteria**:
- `get_task_by_id(self, task_id: int) -> Task | None` method exists
- Uses linear search through `_tasks` list
- Returns Task if found, None if not found
- Works correctly after task deletion (doesn't return deleted tasks)
- Full type hints and docstring

**Dependencies**: T1.2 (TodoManager initialized)

**Steps**:
1. Add method:
   ```python
   def get_task_by_id(self, task_id: int) -> Task | None:
       """Find task by ID. Returns None if not found."""
       for task in self._tasks:
           if task.id == task_id:
               return task
       return None
   ```
2. Test: Add 3 tasks, lookup ID 2, verify correct task returned; lookup ID 999, verify None returned

**Constitution Check**: ✅ Linear search (acceptable performance per plan)

---

### ✅ T1.6: [US3] Implement update_task() Method [COMPLETED]

**Description**: Update task title and/or description by ID, supporting partial updates

**Duration**: 25 minutes

**Acceptance Criteria**:
- `update_task(self, task_id: int, title: str | None = None, description: str | None = None) -> bool` method exists
- Updates only non-None fields (partial update support)
- Returns True if task found and updated, False if task not found
- Validates non-empty strings (raise ValueError if empty string provided)
- Full type hints and docstring

**Dependencies**: T1.5 (get_task_by_id() exists)

**Steps**:
1. Add method:
   ```python
   def update_task(self, task_id: int, title: str | None = None, description: str | None = None) -> bool:
       """Update task title and/or description. Returns True if successful."""
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
   ```
2. Test: Update title only, description only, both; verify non-updated fields unchanged

**Constitution Check**: ✅ ID-based operations

---

### ✅ T1.7: [US4] Implement delete_task() Method [COMPLETED]

**Description**: Remove task from list by ID without renumbering remaining tasks

**Duration**: 20 minutes

**Acceptance Criteria**:
- `delete_task(self, task_id: int) -> bool` method exists
- Removes task from `_tasks` list if found
- Returns True if deleted, False if task not found
- Does NOT decrement `_next_id` (IDs never reused)
- Remaining tasks keep original IDs (no renumbering)
- Full type hints and docstring

**Dependencies**: T1.5 (get_task_by_id() exists)

**Steps**:
1. Add method:
   ```python
   def delete_task(self, task_id: int) -> bool:
       """Delete task by ID. Returns True if successful."""
       task = self.get_task_by_id(task_id)
       if task is None:
           return False
       self._tasks.remove(task)
       return True
   ```
2. Test: Create tasks 1-5, delete #2 and #4, verify #1, #3, #5 remain with original IDs; create new task, verify ID is 6 (not 2)

**Constitution Check**: ✅ ID never reused (per ADR)

---

### ✅ T1.8: [US2] Implement toggle_completion() Method [COMPLETED]

**Description**: Toggle task completion status (Pending ↔ Completed)

**Duration**: 20 minutes

**Acceptance Criteria**:
- `toggle_completion(self, task_id: int) -> bool` method exists
- Flips `task.is_completed` boolean (True → False, False → True)
- Returns True if successful, False if task not found
- Full type hints and docstring

**Dependencies**: T1.5 (get_task_by_id() exists)

**Steps**:
1. Add method:
   ```python
   def toggle_completion(self, task_id: int) -> bool:
       """Toggle task completion status. Returns True if successful."""
       task = self.get_task_by_id(task_id)
       if task is None:
           return False
       task.is_completed = not task.is_completed
       return True
   ```
2. Test: Create task (default Pending), toggle (now Completed), toggle again (back to Pending)

**Constitution Check**: ✅ Boolean toggle (per ADR)

**Checkpoint 2**: 🛑 **MANUAL REVIEW** - Verify all TodoManager methods functional via Python REPL tests

---

## Phase 2: CLI Interface (User Interaction)

**Purpose**: Build console menu with handlers for all 5 operations + exit

**Duration**: ~120 minutes total

**User Story Alignment**: All user stories (US1-US4) depend on CLI interface

---

### ✅ T2.1: [US1-US4] Create Main Entry Point and Menu Display [COMPLETED]

**Description**: Create `src/main.py` with menu display function and basic structure

**Duration**: 20 minutes

**Acceptance Criteria**:
- `src/main.py` exists with `main()` function
- `display_menu()` function shows 6 numbered options:
  1. Add Task
  2. View Tasks
  3. Update Task
  4. Delete Task
  5. Mark Task Complete/Pending
  6. Exit
- Menu is clearly formatted and readable
- Full type hints and docstrings

**Dependencies**: T0.2 (src/ directory exists)

**Steps**:
1. Create `src/main.py`:
   ```python
   """Console interface for Todo application."""
   from src.todo import TodoManager

   def display_menu() -> None:
       """Display the main menu options."""
       print("\n" + "="*50)
       print("TODO APPLICATION - IN-MEMORY SESSION")
       print("="*50)
       print("1. Add Task")
       print("2. View Tasks")
       print("3. Update Task")
       print("4. Delete Task")
       print("5. Mark Task Complete/Pending")
       print("6. Exit")
       print("="*50)

   def main() -> None:
       """Main entry point for the application."""
       manager = TodoManager()
       print("Welcome to the Todo Application!")
       display_menu()

   if __name__ == "__main__":
       main()
   ```
2. Test: `uv run python -m src.main` → Menu displays correctly

**Constitution Check**: ✅ Console interface (per ADR)

---

### ✅ T2.2: [US1-US4] Implement Menu Loop with match/case Routing [COMPLETED]

**Description**: Add infinite loop with user input and command routing

**Duration**: 25 minutes

**Acceptance Criteria**:
- `main()` contains `while True` loop that displays menu and gets input
- Uses Python 3.13 `match/case` statement for command routing
- Handles options 1-6 (even if handlers are stubs)
- Invalid input displays error and re-prompts
- Option 6 breaks loop and exits gracefully
- Full type hints

**Dependencies**: T2.1 (display_menu() exists)

**Steps**:
1. Update `main()`:
   ```python
   def main() -> None:
       """Main entry point for the application."""
       manager = TodoManager()
       print("Welcome to the Todo Application!")

       while True:
           display_menu()
           choice = input("\nEnter your choice (1-6): ").strip()

           match choice:
               case "1":
                   print("Add Task - TODO")
               case "2":
                   print("View Tasks - TODO")
               case "3":
                   print("Update Task - TODO")
               case "4":
                   print("Delete Task - TODO")
               case "5":
                   print("Toggle Complete - TODO")
               case "6":
                   print("\nExiting application. All data will be lost.")
                   break
               case _:
                   print("❌ Invalid choice. Please enter 1-6.")
   ```
2. Test: Run app, try options 1-6, verify option 6 exits, invalid input shows error

**Constitution Check**: ✅ Match/case (Python 3.13+ feature)

---

### ✅ T2.3: [US1] Implement handle_add_task() Function [COMPLETED]

**Description**: Prompt for title/description and create task via manager

**Duration**: 25 minutes

**Acceptance Criteria**:
- `handle_add_task(manager: TodoManager) -> None` function exists
- Prompts user for title and description
- Calls `manager.add_task()` and displays success message with task ID
- Catches ValueError for empty inputs and displays error message
- Returns to menu after completion
- Full type hints and docstring

**Dependencies**: T1.3 (add_task() method exists), T2.2 (menu loop exists)

**Steps**:
1. Add function to `src/main.py`:
   ```python
   def handle_add_task(manager: TodoManager) -> None:
       """Handle adding a new task."""
       print("\n--- Add New Task ---")
       title = input("Enter task title: ").strip()
       description = input("Enter task description: ").strip()

       try:
           task = manager.add_task(title, description)
           print(f"✓ Task {task.id} created: {task.title}")
       except ValueError as e:
           print(f"❌ Error: {e}")
   ```
2. Update match case "1" to call `handle_add_task(manager)`
3. Test: Add task with valid input, verify success; try empty title, verify error

**Constitution Check**: ✅ Input validation enforced

---

### ✅ T2.4: [US1] Implement handle_view_tasks() Function [COMPLETED]

**Description**: Display all tasks in formatted table with status indicators

**Duration**: 30 minutes

**Acceptance Criteria**:
- `handle_view_tasks(manager: TodoManager) -> None` function exists
- Displays tasks in table format: ID | Title | Description | Status
- Status shows `[X] Completed` or `[ ] Pending` per FR-013
- Empty list shows friendly message "No tasks found. Add a task to get started!"
- Handles long titles/descriptions gracefully (truncate or wrap)
- Full type hints and docstring

**Dependencies**: T1.4 (get_all_tasks() exists), T2.2 (menu loop exists)

**Steps**:
1. Add function:
   ```python
   def handle_view_tasks(manager: TodoManager) -> None:
       """Display all tasks in a formatted list."""
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
   ```
2. Update match case "2" to call `handle_view_tasks(manager)`
3. Test: View empty list, add 3 tasks, view list with mix of Pending/Completed

**Constitution Check**: ✅ Status indicators clear (per FR-013)

---

### ✅ T2.5: [US3] Implement handle_update_task() Function [COMPLETED]

**Description**: Prompt for task ID and new values, support partial updates

**Duration**: 30 minutes

**Acceptance Criteria**:
- `handle_update_task(manager: TodoManager) -> None` function exists
- Prompts for task ID (validates integer input)
- Displays current task details if found
- Prompts for new title (Enter to skip), new description (Enter to skip)
- Calls `manager.update_task()` with non-empty inputs
- Displays success or "Task not found" error
- Full type hints and docstring

**Dependencies**: T1.6 (update_task() exists), T2.2 (menu loop exists)

**Steps**:
1. Add function:
   ```python
   def handle_update_task(manager: TodoManager) -> None:
       """Handle updating an existing task."""
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
   ```
2. Update match case "3" to call `handle_update_task(manager)`
3. Test: Update title only, description only, both, invalid ID

**Constitution Check**: ✅ Partial update support (per spec)

---

### ✅ T2.6: [US4] Implement handle_delete_task() Function [COMPLETED]

**Description**: Prompt for task ID and delete from manager

**Duration**: 20 minutes

**Acceptance Criteria**:
- `handle_delete_task(manager: TodoManager) -> None` function exists
- Prompts for task ID (validates integer input)
- Calls `manager.delete_task()` and displays success or error
- Success message confirms deletion
- Full type hints and docstring

**Dependencies**: T1.7 (delete_task() exists), T2.2 (menu loop exists)

**Steps**:
1. Add function:
   ```python
   def handle_delete_task(manager: TodoManager) -> None:
       """Handle deleting a task."""
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
   ```
2. Update match case "4" to call `handle_delete_task(manager)`
3. Test: Delete existing task, verify success; delete non-existent ID, verify error

**Constitution Check**: ✅ ID-based deletion

---

### ✅ T2.7: [US2] Implement handle_toggle_completion() Function [COMPLETED]

**Description**: Prompt for task ID and toggle completion status

**Duration**: 25 minutes

**Acceptance Criteria**:
- `handle_toggle_completion(manager: TodoManager) -> None` function exists
- Prompts for task ID (validates integer input)
- Calls `manager.toggle_completion()` and displays new status
- Success message shows whether task is now Completed or Pending
- Error message for invalid ID
- Full type hints and docstring

**Dependencies**: T1.8 (toggle_completion() exists), T2.2 (menu loop exists)

**Steps**:
1. Add function:
   ```python
   def handle_toggle_completion(manager: TodoManager) -> None:
       """Handle toggling task completion status."""
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
   ```
2. Update match case "5" to call `handle_toggle_completion(manager)`
3. Test: Toggle task twice, verify status changes each time

**Constitution Check**: ✅ Toggle behavior (per FR-007)

**Checkpoint 3**: 🛑 **MANUAL REVIEW** - Run application end-to-end, test all 5 operations manually

---

## Phase 3: Testing & Validation (Quality Assurance)

**Purpose**: Manual validation of all 5 core features and edge cases

**Duration**: ~60 minutes total

---

### ✅ T3.1: [US1] Create Manual Test Scenarios Document [COMPLETED]

**Description**: Document 5 test scenarios in `tests/manual_tests.md`

**Duration**: 20 minutes

**Acceptance Criteria**:
- `tests/manual_tests.md` exists with all 5 test scenarios documented
- Each test includes: purpose, steps, expected results
- Tests cover: Add, View, Update, Delete, Mark Complete
- Edge cases documented: empty input, invalid IDs, Unicode characters

**Dependencies**: T0.2 (tests/ directory exists)

**Steps**:
1. Create `tests/manual_tests.md` with template from plan.md
2. Document all 5 test scenarios from plan.md (Test 1-5)
3. Add edge case section with 6 scenarios

**Constitution Check**: ✅ Testing documentation

---

### ✅ T3.2: [US1] Execute Test 1: Add and View Tasks [COMPLETED]

**Description**: Manually test task creation and viewing functionality

**Duration**: 15 minutes

**Acceptance Criteria**:
- Can add 3 tasks with titles and descriptions
- Tasks assigned sequential IDs (1, 2, 3)
- All tasks show "[ ] Pending" status initially
- View shows all 3 tasks with correct details
- Empty list message displays before adding tasks

**Dependencies**: T2.3 (handle_add_task), T2.4 (handle_view_tasks), T3.1 (test doc)

**Steps**:
1. Run `uv run todo`
2. View tasks (should show empty message)
3. Add 3 tasks with different titles/descriptions
4. View tasks, verify all details correct and IDs sequential
5. Document results in `tests/manual_tests.md`

**Constitution Check**: ✅ FR-001, FR-002, FR-003, FR-005 validated

---

### ✅ T3.3: [US2] Execute Test 2: Mark Complete [COMPLETED]

**Description**: Manually test toggling task completion status

**Duration**: 15 minutes

**Acceptance Criteria**:
- Can mark task as Completed (Pending → Completed)
- Can toggle back to Pending (Completed → Pending)
- Status indicator changes: [ ] → [X] → [ ]
- Invalid task ID shows error message

**Dependencies**: T2.7 (handle_toggle_completion), T3.2 (tasks exist), T3.1 (test doc)

**Steps**:
1. From existing session (or add 3 tasks)
2. Mark task #1 as complete
3. View tasks, verify shows "[X] Completed"
4. Mark task #1 again
5. View tasks, verify shows "[ ] Pending"
6. Try invalid ID (999), verify error message
7. Document results

**Constitution Check**: ✅ FR-006, FR-007, FR-013 validated

---

### ✅ T3.4: [US3] Execute Test 3: Update Task [COMPLETED]

**Description**: Manually test updating task title and description

**Duration**: 15 minutes

**Acceptance Criteria**:
- Can update title only (description unchanged)
- Can update description only (title unchanged)
- Can update both simultaneously
- Empty input validation works (shows error)
- Invalid ID shows error message

**Dependencies**: T2.5 (handle_update_task), T3.2 (tasks exist), T3.1 (test doc)

**Steps**:
1. Add task: "Write tests" / "Unit tests for todo manager"
2. Update title only to "Write unit tests", skip description
3. View tasks, verify title changed, description same
4. Update description only
5. Try empty title, verify error
6. Try invalid ID, verify error
7. Document results

**Constitution Check**: ✅ FR-008 validated

---

### ✅ T3.5: [US4] Execute Test 4: Delete Task [COMPLETED]

**Description**: Manually test task deletion with ID preservation

**Duration**: 15 minutes

**Acceptance Criteria**:
- Can delete task by ID
- Deleted task no longer appears in view
- Remaining tasks keep original IDs (no renumbering)
- New tasks get next sequential ID (not deleted ID)
- Invalid ID shows error message

**Dependencies**: T2.6 (handle_delete_task), T3.2 (tasks exist), T3.1 (test doc)

**Steps**:
1. Add 5 tasks (IDs 1-5)
2. Delete task #2
3. Delete task #4
4. View tasks, verify only #1, #3, #5 remain
5. Add new task, verify gets ID #6 (not #2)
6. Try deleting ID #999, verify error
7. Document results

**Constitution Check**: ✅ FR-009 validated, ✅ ID never reused (per ADR)

---

### ✅ T3.6: Execute Edge Case Tests [COMPLETED]

**Description**: Test edge cases: empty input, long strings, Unicode, invalid menu

**Duration**: 20 minutes

**Acceptance Criteria**:
- Empty title/description shows error (not accepted)
- Very long title/description (500+ chars) displays without crash
- Unicode characters (emoji, accented chars) display correctly
- Invalid menu choice (0, 7, 'abc') shows error and re-prompts
- Application exits cleanly on option 6

**Dependencies**: All Phase 2 tasks complete, T3.1 (test doc)

**Steps**:
1. Try adding task with empty title → Verify error
2. Add task with 500-char description → Verify accepted and displays
3. Add task with emoji in title: "🚀 Deploy app" → Verify displays correctly
4. Add task with accented chars: "Café review" → Verify displays correctly
5. Try menu option 0, 7, "abc" → Verify error messages
6. Select option 6 → Verify exits with message
7. Document all results in `tests/manual_tests.md`

**Constitution Check**: ✅ Edge cases handled gracefully (per spec)

**Checkpoint 4**: 🛑 **MANUAL REVIEW** - All 5 test scenarios pass, edge cases handled

---

## Phase 4: Documentation & Finalization (Delivery Readiness)

**Purpose**: Complete user-facing documentation and verify constitution compliance

**Duration**: ~45 minutes total

---

### ✅ T4.1: Write README.md [COMPLETED]

**Description**: Create comprehensive user-facing documentation

**Duration**: 30 minutes

**Acceptance Criteria**:
- `README.md` exists at repository root
- Includes: Project overview, installation instructions (UV setup), usage guide, feature summary, limitations
- Installation instructions work on fresh system
- Usage guide covers all 5 operations
- Limitations section notes in-memory only + data loss on exit

**Dependencies**: T3.6 (all features tested)

**Steps**:
1. Create `README.md` with sections:
   - Project Overview
   - Requirements (Python 3.13+, UV)
   - Installation (`uv venv`, `uv pip install`)
   - Usage (`uv run todo`)
   - Features (5 operations listed)
   - Limitations (in-memory, data loss on exit)
   - License (if applicable)
2. Test installation instructions on clean environment (if possible)

**Constitution Check**: ✅ Documentation requirement

---

### ✅ T4.2: Run Constitution Compliance Check [COMPLETED]

**Description**: Verify all constitution requirements met using checklist from plan.md

**Duration**: 20 minutes

**Acceptance Criteria**:
- All 30+ items in constitution compliance checklist verified
- NO `.git` directory exists
- NO persistent storage files (*.db, *.json, *.csv)
- All source code in `/src` directory
- Type hints present on all functions/methods
- PEP 8 compliance verified (can use `ruff check src/` if available)

**Dependencies**: All implementation tasks complete

**Steps**:
1. Open `specs/001-todo-console-app/plan.md` constitution checklist section
2. Verify each checklist item:
   - Core Principle 1: Spec-driven (✓ all code from spec)
   - Core Principle 2: Modularity (✓ Task/TodoManager/main separation)
   - Core Principle 3: Clean Code (✓ type hints, docstrings)
   - Core Principle 4: Environment (✓ UV, /src structure)
   - Core Principle 5: ID-based (✓ auto-increment integers)
   - Core Principle 6: Zero deps (✓ no files/DBs/network)
   - Tool Restriction (✓ no git commands executed)
   - Success Criteria SC-001 to SC-008 (✓ all validated)
3. Document any violations found (should be zero)
4. Verify filesystem: `ls -la | grep git` → No output
5. Verify no persistent files: `find . -name "*.db" -o -name "*.json"` → No output

**Constitution Check**: ✅ Full compliance verified

---

### ✅ T4.3: Final Smoke Test [COMPLETED]

**Description**: Complete end-to-end test of application on fresh terminal session

**Duration**: 15 minutes

**Acceptance Criteria**:
- Application launches successfully via `uv run todo`
- Can complete full workflow: Add → View → Update → Mark Complete → Delete → Exit
- No crashes or unhandled exceptions
- Exit message confirms data will be lost
- Relaunch confirms all data gone (in-memory only)

**Dependencies**: T4.1 (README complete), T4.2 (compliance verified)

**Steps**:
1. Close any existing application session
2. Run `uv run todo` in fresh terminal
3. Execute complete workflow:
   - Add 2 tasks
   - View tasks
   - Update task #1
   - Mark task #2 complete
   - Delete task #1
   - View tasks (only #2 remains, marked complete)
   - Exit application
4. Relaunch `uv run todo`
5. View tasks → Verify empty (data lost as expected)
6. Document successful smoke test

**Constitution Check**: ✅ SC-005 validated (no persistence)

**Checkpoint 5**: 🛑 **MANUAL REVIEW** - README complete, compliance verified, smoke test passes

---

## Dependencies & Execution Order

### Phase Dependencies

1. **Phase 0: Environment Setup** (T0.1 → T0.2 → T0.3)
   - **Duration**: 30 minutes
   - **Checkpoint**: Manual review after T0.3

2. **Phase 1: Data Model & Logic** (T1.1, T1.2 in parallel → T1.3 → T1.4 || T1.5 → T1.6 || T1.7 || T1.8)
   - **Duration**: 90 minutes
   - **Parallel**: T1.1 and T1.2 can start together; T1.4, T1.6, T1.7, T1.8 can run in parallel after T1.5
   - **Checkpoint**: Manual review after T1.8

3. **Phase 2: CLI Interface** (T2.1 → T2.2 → [T2.3 || T2.4 || T2.5 || T2.6 || T2.7])
   - **Duration**: 120 minutes
   - **Parallel**: T2.3-T2.7 can all run in parallel after T2.2 (different handler functions)
   - **Checkpoint**: Manual review after T2.7

4. **Phase 3: Testing** (T3.1 → [T3.2 → T3.3 → T3.4 → T3.5] → T3.6)
   - **Duration**: 60 minutes
   - **Sequential**: Tests must run in order (build on previous state)
   - **Checkpoint**: Manual review after T3.6

5. **Phase 4: Documentation** (T4.1 → T4.2 → T4.3)
   - **Duration**: 45 minutes
   - **Sequential**: Must complete in order
   - **Checkpoint**: Manual review after T4.3

### Task Dependency Graph

```
T0.1 (UV Init) ──→ T0.2 (Directories) ──→ T0.3 (Verify) ──┐
                                                            │
┌───────────────────────────────────────────────────────────┘
│
├─→ T1.1 (Task dataclass) ──→ T1.2 (TodoManager init) ──→ T1.3 (add_task)
│                                  │                              │
│                                  ├──→ T1.4 (get_all)           │
│                                  │                              │
│                                  └──→ T1.5 (get_by_id) ────────┼──→ T1.6 (update)
│                                                                 │
│                                                                 ├──→ T1.7 (delete)
│                                                                 │
│                                                                 └──→ T1.8 (toggle) ──┐
│                                                                                       │
├─→ T2.1 (Menu display) ──→ T2.2 (Menu loop) ──────────────────────────────────────────┤
                                                                                        │
┌───────────────────────────────────────────────────────────────────────────────────────┘
│
├─→ T2.3 (handle_add) ──┐
├─→ T2.4 (handle_view) ─┤
├─→ T2.5 (handle_update)├──→ T3.1 (Test doc) ──→ T3.2 (Test Add/View) ──→ T3.3 (Test Toggle)
├─→ T2.6 (handle_delete)│                               ↓                        ↓
└─→ T2.7 (handle_toggle)┘                       T3.4 (Test Update) ──→ T3.5 (Test Delete)
                                                        ↓                        ↓
                                                        └────────────┬───────────┘
                                                                     │
                                                         T3.6 (Edge cases) ──→ T4.1 (README)
                                                                                   ↓
                                                                         T4.2 (Compliance) ──→ T4.3 (Smoke test)
```

### Parallel Execution Opportunities

**Phase 1 Parallel Tasks**:
- T1.1 and T1.2 (different sections of same file, can coordinate)
- After T1.5 completes: T1.4, T1.6, T1.7, T1.8 (all depend on get_by_id but independent of each other)

**Phase 2 Parallel Tasks**:
- After T2.2 completes: T2.3, T2.4, T2.5, T2.6, T2.7 (all handler functions in different parts of file)

**Critical Path**: T0.1 → T0.2 → T0.3 → T1.1 → T1.2 → T1.3 → T1.5 → T2.1 → T2.2 → Any handler → T3.1 → T3.2 → ... → T4.3

**Total Duration (Sequential)**: 30 + 90 + 120 + 60 + 45 = **345 minutes (~6 hours)**

**Total Duration (With Parallelism)**: ~240 minutes (~4 hours) if Phase 1 and Phase 2 tasks parallelized

---

## Implementation Strategy

### MVP-First Approach (Recommended)

**Goal**: Get P1 (US1) working first, then iterate

1. Complete **Phase 0** (Environment Setup) - 30 min
2. Complete **Phase 1** (Data Model) - focus on T1.1-T1.4 only - 60 min
3. Complete **Phase 2** (CLI) - focus on T2.1-T2.4 only (Add + View) - 75 min
4. **Validate MVP**: Can add and view tasks - ~15 min
5. Add remaining features (T1.5-T1.8, T2.5-T2.7) - 90 min
6. Complete **Phase 3** (Testing) - 60 min
7. Complete **Phase 4** (Documentation) - 45 min

**MVP Milestone**: After step 4, you have a working (minimal) todo app!

### Full Sequential Approach

Follow phases in order: Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4

**Advantages**: Clear progress, easy to track, no coordination needed

**Duration**: ~6 hours total

### Parallel Team Approach

If multiple developers available:

1. **Phase 0**: One person (30 min)
2. **Phase 1**: Split TodoManager methods across 2-3 people (45 min parallel)
3. **Phase 2**: Split handlers across 2-3 people (60 min parallel)
4. **Phase 3**: One person tests integration (60 min)
5. **Phase 4**: One person documents (45 min)

**Duration**: ~3.5 hours with 3 developers

---

## Constitution Compliance Guardrails

### Pre-Task Checks (For Every Task)

Before starting any task:
- [ ] Verify NO `.git` directory exists: `ls -la | grep "\.git"`
- [ ] Verify working in correct directory: `pwd` shows `phase1_todo/`
- [ ] Verify UV environment active: `uv run python --version` works

### Post-Task Checks (For Every File-Creating Task)

After completing any task that creates/modifies files:
- [ ] Verify NO `.git` artifacts created: `find . -name ".git*"` returns empty
- [ ] Verify NO persistent storage files: `find . -name "*.db" -o -name "*.json" -o -name "*.csv"` returns empty
- [ ] Verify file is in correct location: Source files in `src/`, tests in `tests/`, config at root

### Phase Checkpoints (Manual Review Required)

1. **After Phase 0 (T0.3)**: Environment setup complete, no git artifacts
2. **After Phase 1 (T1.8)**: All TodoManager methods functional, tested via REPL
3. **After Phase 2 (T2.7)**: Full application runs, all 5 operations accessible
4. **After Phase 3 (T3.6)**: All test scenarios pass, edge cases handled
5. **After Phase 4 (T4.3)**: README complete, compliance verified, smoke test passes

### Constitution Violation Response

If ANY of these are detected:
- `.git` directory exists → **STOP**: Remove `.git`, restart from Phase 0
- Persistent files created → **STOP**: Delete files, verify in-memory only
- Git commands in shell history → **STOP**: Document violation, proceed without using git
- Code not in `/src` → **STOP**: Move files to correct location

---

## Notes

- **[P] Marker**: Tasks can run in parallel (different files or independent sections)
- **Duration Estimates**: All tasks 15-30 minutes; total ~6 hours sequential, ~4 hours with parallelism
- **Checkpoints**: 5 manual review points ensure quality gates before proceeding
- **Constitution**: Every file operation includes pre/post checks for git artifacts and persistence violations
- **Testing**: Manual validation only (no automated tests for Phase I per spec)
- **Documentation**: README.md is user-facing; CLAUDE.md already exists for AI agent
- **Incremental Value**: MVP (Add + View) functional after ~2.5 hours; full feature set after ~4.5 hours

---

## Summary

**Total Tasks**: 24 tasks across 5 phases
**Estimated Duration**: 6 hours (sequential) or 4 hours (parallel)
**Checkpoints**: 5 manual review points
**Constitution Compliance**: 100% - no git ops, in-memory only, type hints enforced

**Critical Path**: Environment Setup → Data Model → CLI Interface → Testing → Documentation

**Ready for Implementation**: All tasks are atomic (15-30 min), have clear acceptance criteria, and dependencies are explicit.

**Next Step**: Begin with **T0.1: Initialize UV Project Structure** after user approval of this task breakdown.
