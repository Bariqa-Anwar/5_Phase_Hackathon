# In-Memory Python Todo Console Application

A lightweight, command-line todo list manager built with Python 3.13+ that stores all data in memory. Perfect for quick task tracking during development sessions without any persistent storage overhead.

## Overview

This console application provides a simple, interactive menu-driven interface for managing todo tasks with five core operations: Add, View, Update, Delete, and Mark Complete. All data is stored in memory and will be lost when the application exits.

**Key Features**:
- Pure in-memory storage (no files, no databases)
- Auto-incrementing unique task IDs
- Interactive console menu interface
- Toggle task completion status
- Partial updates (change title OR description)
- ID preservation (deleted IDs never reused)
- Full type safety with Python 3.13+ type hints
- Zero external dependencies

## Requirements

- **Python**: 3.13 or higher
- **Package Manager**: [UV](https://github.com/astral-sh/uv) (recommended) or pip
- **Operating System**: Windows, macOS, or Linux

## Installation

### Option 1: Using UV (Recommended)

```bash
# Clone or download the project
cd phase1_todo

# UV will automatically detect Python 3.13+ from .python-version
# No manual virtual environment setup needed

# Run directly
uv run python -m src.main
```

### Option 2: Using UV with Entry Point

```bash
# Install the package in development mode
uv pip install -e .

# Run using the entry point
uv run todo
```

### Option 3: Using Standard Python

```bash
# Create virtual environment
python3.13 -m venv .venv

# Activate virtual environment
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Run the application
python -m src.main
```

## Usage

### Starting the Application

```bash
uv run todo
# or
uv run python -m src.main
```

You'll see the main menu:

```
==================================================
TODO APPLICATION - IN-MEMORY SESSION
==================================================
1. Add Task
2. View Tasks
3. Update Task
4. Delete Task
5. Mark Task Complete/Pending
6. Exit
==================================================

Enter your choice (1-6):
```

### Feature Guide

#### 1. Add Task
Creates a new task with a unique auto-incrementing ID starting from 1.

**Steps**:
1. Select option `1`
2. Enter task title (required)
3. Enter task description (required)
4. Task created with status "Pending"

**Example**:
```
Enter task title: Fix authentication bug
Enter task description: Users cannot log in with special characters
✓ Task 1 created: Fix authentication bug
```

#### 2. View Tasks
Displays all tasks in a formatted table showing ID, title, status, and description.

**Output Format**:
```
ID    | Title                          | Status
----------------------------------------------------------------
1     | Fix authentication bug         | [ ] Pending
       Description: Users cannot log in with special characters
2     | Write unit tests               | [X] Completed
       Description: Add tests for TodoManager class
```

**Empty List**:
```
No tasks found. Add a task to get started!
```

#### 3. Update Task
Modify the title and/or description of an existing task. Supports partial updates.

**Steps**:
1. Select option `3`
2. Enter task ID to update
3. Enter new title (press Enter to skip)
4. Enter new description (press Enter to skip)

**Example**:
```
Enter task ID to update: 1
Current: Fix authentication bug - Users cannot log in with special characters
New title (press Enter to skip): Fix critical auth bug
New description (press Enter to skip): [Enter]
✓ Task 1 updated successfully.
```

#### 4. Delete Task
Remove a task from the list. **Important**: Deleted task IDs are never reused.

**Steps**:
1. Select option `4`
2. Enter task ID to delete

**Example**:
```
Enter task ID to delete: 2
✓ Task 2 deleted successfully.

# If you add a new task after deleting ID 2, it will get ID 3, NOT ID 2
```

#### 5. Mark Task Complete/Pending
Toggle the completion status of a task between Pending and Completed.

**Steps**:
1. Select option `5`
2. Enter task ID to toggle

**Example**:
```
Enter task ID to toggle: 1
✓ Task 1 marked as Completed.

# Running again on the same task:
✓ Task 1 marked as Pending.
```

#### 6. Exit
Exits the application. **All data will be lost.**

```
Exiting application. All data will be lost.
```

## Features

### Core Operations
- **Add Task**: Create tasks with unique auto-incrementing IDs
- **View Tasks**: Display all tasks with formatted status indicators
- **Update Task**: Modify task title and/or description (partial updates supported)
- **Delete Task**: Remove tasks by ID (IDs never reused)
- **Mark Complete**: Toggle task status between Pending and Completed

### Technical Features
- **In-Memory Storage**: No persistent files or databases
- **ID Preservation**: Deleted IDs are never reassigned to new tasks
- **Input Validation**: Empty titles/descriptions rejected with clear error messages
- **Error Handling**: Invalid IDs and operations handled gracefully
- **Type Safety**: Full type hints on all functions (Python 3.13+ union types)
- **Unicode Support**: Handles emoji and accented characters correctly

## Limitations

### Data Persistence
This application uses **in-memory storage only**. All tasks are lost when the application exits. This design is intentional for:
- Development session task tracking
- Temporary todo lists
- Testing and demonstration purposes
- Zero-overhead task management

**What This Means**:
- No data survives between application sessions
- No backup or export functionality
- No multi-user or network capabilities
- Restarting the application starts with an empty task list

### Architecture Constraints
- **No External Dependencies**: Uses only Python standard library
- **No Persistence Layer**: No file I/O, database connections, or network operations
- **Single Session**: Cannot share tasks across multiple application instances
- **Console Only**: Text-based interface (no GUI)

## Project Structure

```
phase1_todo/
├── README.md                    # This file
├── CLAUDE.md                    # AI agent instructions
├── pyproject.toml               # UV project configuration
├── .python-version              # Python version requirement (3.13.2)
├── src/
│   ├── __init__.py              # Package marker
│   ├── todo.py                  # Task model and TodoManager (160 lines)
│   └── main.py                  # CLI interface and handlers (177 lines)
├── tests/
│   ├── manual_tests.md          # Manual test scenarios (271 lines)
│   └── run_validation.py        # Automated test suite (377 lines)
├── specs/
│   └── 001-todo-console-app/
│       ├── spec.md              # Feature specification
│       ├── plan.md              # Architecture plan
│       └── tasks.md             # Implementation tasks (24 tasks)
└── specs_history/
    └── test_report_v1.md        # Validation test report
```

## Development

### Running Tests

```bash
# Run automated validation tests
uv run python -m tests.run_validation

# Expected output:
# Total Tests: 6
# Passed: 6
# Failed: 0
# Status: ALL TESTS PASSED
```

### Code Quality
- **Type Hints**: 100% coverage (all functions/methods)
- **PEP 8**: Compliant formatting
- **Docstrings**: All public functions documented
- **Test Coverage**: Test-to-code ratio 1.92:1 (648 test lines / 337 code lines)

### Constitution Principles
This project follows strict Spec-Driven Development (SDD) principles:
1. All code derived from specification files
2. Type safety enforced (Python 3.13+ type hints)
3. Minimal and readable code (no unnecessary dependencies)
4. Console-first approach (standard input/output only)
5. In-memory storage (no persistent files)
6. No version control operations (git handled externally)

## Troubleshooting

### Application Won't Start

**Issue**: `ModuleNotFoundError: No module named 'src'`

**Solution**: Ensure you're running from the project root directory:
```bash
cd phase1_todo
uv run python -m src.main
```

### Python Version Error

**Issue**: `This package requires Python >=3.13`

**Solution**: Install Python 3.13+ and ensure UV detects it:
```bash
python --version  # Should show 3.13.x or higher
```

### Unicode Display Issues

**Issue**: Emoji or accented characters not displaying correctly

**Solution**: Ensure your terminal supports UTF-8 encoding. On Windows, use Windows Terminal or PowerShell with UTF-8 support.

## Examples

### Quick Session Example

```bash
$ uv run todo

# Add tasks
> 1
Enter task title: Review pull request #123
Enter task description: Check for security issues
✓ Task 1 created: Review pull request #123

> 1
Enter task title: Update documentation
Enter task description: Add API examples
✓ Task 2 created: Update documentation

# View tasks
> 2
ID    | Title                          | Status
----------------------------------------------------------------
1     | Review pull request #123       | [ ] Pending
       Description: Check for security issues
2     | Update documentation           | [ ] Pending
       Description: Add API examples

# Mark first task complete
> 5
Enter task ID to toggle: 1
✓ Task 1 marked as Completed.

# Exit (data lost)
> 6
Exiting application. All data will be lost.
```

## Contributing

This project follows a strict Spec-Driven Development (SDD) approach. All changes must:
1. Start with a specification in `specs/` directory
2. Follow the architecture defined in `plan.md`
3. Break down into atomic tasks in `tasks.md`
4. Maintain 100% type hint coverage
5. Pass all validation tests

## License

This project is provided as-is for educational and development purposes.

## Version History

- **v1.0** (2026-01-01): Initial release
  - 5 core CRUD operations
  - In-memory storage
  - Full type safety
  - Comprehensive test suite
  - Zero external dependencies

## Contact

For issues or questions about this project, please refer to the specification and implementation documentation in the `specs/` directory.

---

**Note**: This application intentionally does not persist data. If you need persistent storage, consider using a database-backed todo application instead.
