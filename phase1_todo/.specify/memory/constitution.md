# Phase I - Todo In-Memory Python Console App Constitution

## Core Principles

### I. Strict Spec-Driven Development (SDD)
**All code generation must be derived from specification files.** No manual coding is permitted outside the defined SDD workflow. Every feature must flow through: Constitution → Specification → Plan → Tasks → Implementation.

### II. Modularity and Separation of Concerns
The application architecture enforces clear boundaries:
- **UI Layer (Console)**: User interaction and display only
- **Logic Layer (Manager)**: Business rules and task management operations
- **Data Layer (Storage)**: In-memory data structures and state management

No layer may bypass or directly access another layer's internals.

### III. Clean Code Standards
- **PEP 8 Compliance**: All Python code follows PEP 8 style guidelines
- **Type Hinting**: Full type annotations using Python 3.13+ features
- **Documentation**: Clear docstrings for all modules, classes, and functions
- **Readability**: Code must be self-documenting with meaningful names

### IV. Environment and Tooling Standards
- **Dependency Management**: UV exclusively for virtual environments and dependencies
- **Project Structure**: Source code resides in `/src` directory
- **Documentation**: README.md for users, CLAUDE.md for AI agent instructions
- **Python Version**: 3.13+ features and syntax required

### V. ID-Based Task Management
All CRUD operations on tasks must use unique integer IDs:
- **Create**: Auto-generate sequential IDs
- **Read**: Reference tasks by ID
- **Update**: Modify tasks via ID lookup
- **Delete**: Remove tasks by ID
- **Mark Complete**: Toggle completion status by ID

### VI. Zero External Dependencies (Phase I)
- **No Databases**: No SQLite, PostgreSQL, or other database systems
- **No File Persistence**: No JSON, CSV, YAML, or other file-based storage
- **No Network**: No API calls, HTTP requests, or external services
- **In-Memory Only**: All data stored in Python data structures (lists, dicts)

## Critical Constraints

### Tool Restriction: ABSOLUTELY NO Git/GitHub Operations
**MANDATORY GUARDRAIL**: The AI agent is FORBIDDEN from using any version control tools:

❌ **PROHIBITED OPERATIONS**:
- `git init`, `git add`, `git commit`, `git push`, `git pull`
- `gh repo create`, `gh pr create`, `gh issue create`
- `.git` directory creation or manipulation
- GitHub Actions workflow creation
- Any automated repository initialization

✅ **USER RESPONSIBILITY**:
The human user will manually handle all:
- Repository initialization
- Commits and version control
- GitHub repository creation and management
- Pull requests and code reviews

**Rationale**: This constraint ensures the AI operates purely on code generation and architectural guidance, leaving version control decisions to the human operator.

## Success Criteria

### Functional Requirements (Must Pass)
The application must successfully execute all 5 test scenarios:
1. ✅ **Add Task**: Create new task with description
2. ✅ **Delete Task**: Remove task by ID
3. ✅ **Update Task**: Modify task description by ID
4. ✅ **View Tasks**: Display all tasks with status
5. ✅ **Mark Complete**: Toggle task completion by ID

### Process Requirements
- ✅ All code generated via `/sp.plan` and `/sp.tasks` workflows
- ✅ No manual coding outside SDD process
- ✅ PHR (Prompt History Record) created for every interaction
- ✅ ADR suggestions made for architectural decisions

### Quality Gates
- ✅ Type hints on all functions and methods
- ✅ PEP 8 compliance verified
- ✅ Docstrings on all public interfaces
- ✅ Clean separation between UI/Logic/Data layers

## Non-Functional Requirements

### Performance
- **Response Time**: Instant for in-memory operations (<10ms)
- **Memory**: Minimal footprint (suitable for 100-1000 tasks)

### Reliability
- **Error Handling**: Graceful handling of invalid IDs, empty lists
- **Data Integrity**: No data corruption in in-memory structures

### Security
- **Input Validation**: Sanitize user console input
- **No Injection**: Prevent code injection via task descriptions

### Maintainability
- **Testability**: Code structured for easy unit testing
- **Extensibility**: Architecture supports Phase II persistence additions

## Architecture Decision Records (ADR)

Architecturally significant decisions requiring ADRs:
1. **In-Memory vs Persistent Storage** (Phase I decision)
2. **Console UI vs GUI/Web** (interface choice)
3. **ID-Based vs UUID-Based Task Management**
4. **Monolithic vs Modular Structure**

ADRs will be created in `history/adr/` when requested by user.

## Governance

### Constitution Authority
This constitution supersedes all other development practices. Any deviation requires:
1. Documented justification
2. User approval
3. Amendment to this constitution

### Compliance Verification
Every pull request and code generation must:
- ✅ Verify alignment with Core Principles
- ✅ Check Tool Restrictions (especially Git/GitHub prohibition)
- ✅ Validate Success Criteria
- ✅ Confirm adherence to Quality Gates

### Amendment Process
Constitution changes require:
1. Clear rationale for amendment
2. Impact analysis on existing specs/code
3. User approval
4. Version increment and timestamp update

---

**Version**: 1.0.0
**Ratified**: 2026-01-01
**Last Amended**: 2026-01-01
**Project**: Phase I - Todo In-Memory Python Console App (Agentic Dev Stack)
