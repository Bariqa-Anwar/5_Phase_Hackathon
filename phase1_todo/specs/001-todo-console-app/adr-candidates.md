# Architectural Decision Record Candidates

**Feature**: In-Memory Python Todo Console Application
**Date**: 2026-01-01
**Status**: Awaiting user consent for ADR creation

This document summarizes the 3 architecturally significant decisions identified during planning. These decisions meet the ADR significance criteria (Impact + Alternatives + Scope) and should be documented for long-term reference.

---

## ADR Candidate 1: Auto-Incrementing Integer IDs vs UUIDs

**Decision Title**: `auto-increment-id-strategy`

**Significance Test**:
- ✅ **Impact**: Long-term consequences - ID strategy affects all CRUD operations and future persistence layers
- ✅ **Alternatives**: Multiple viable options considered (integers, UUIDs, hash-based)
- ✅ **Scope**: Cross-cutting - touches data model, business logic, and user interface

**Summary**:
Chose auto-incrementing integers (1, 2, 3...) over UUIDs for task identification.

**Key Rationale**:
- CLI usability: Users type "1" instead of "550e8400-e29b-41d4-a716-446655440000"
- Spec compliance: Explicit requirement for "auto-incrementing integer ID" (FR-003)
- Implementation simplicity: Counter increment vs UUID generation

**Trade-offs**:
- Creates ID gaps after deletion (acceptable for single-session usage)
- Not suitable for distributed systems (but Phase I is single-user/single-process)
- Must never reuse IDs to maintain referential integrity

**Command to Document**:
```
/sp.adr auto-increment-id-strategy
```

---

## ADR Candidate 2: Console Input Loop vs TUI Library

**Decision Title**: `console-input-loop-ui`

**Significance Test**:
- ✅ **Impact**: Affects extensibility to Phase II (persistent storage + enhanced UI)
- ✅ **Alternatives**: Multiple UI approaches considered (simple loop, TUI library, curses)
- ✅ **Scope**: Cross-cutting - influences user experience, testing, and dependencies

**Summary**:
Chose simple `input()` loop with `print()` output over rich TUI libraries (textual, urwid, prompt_toolkit).

**Key Rationale**:
- Zero dependencies: Standard library only (Phase I constraint)
- Spec compliance: "Simple text-based console menu" explicitly requested
- Cross-platform: Works on Windows/Mac/Linux without configuration

**Trade-offs**:
- No real-time updates or interactive navigation
- Limited formatting (ASCII art for status indicators vs rich colors/boxes)
- Must re-display menu after each operation

**Future Impact**:
Phase II may revisit if adding features requiring richer UI (e.g., task filtering, real-time search).

**Command to Document**:
```
/sp.adr console-input-loop-ui
```

---

## ADR Candidate 3: Flat src/ Structure vs Package Hierarchy

**Decision Title**: `flat-source-structure`

**Significance Test**:
- ✅ **Impact**: Influences maintainability and scalability of codebase
- ✅ **Alternatives**: Multiple organization patterns considered (flat, package, single-file)
- ✅ **Scope**: Architectural - determines import structure and file organization

**Summary**:
Chose flat `src/` directory with 2 files (`todo.py`, `main.py`) over package hierarchy (`src/models/`, `src/services/`, `src/cli/`).

**Key Rationale**:
- Phase I simplicity: Only ~400-500 lines of code expected
- Clear separation still achieved: Model+Logic in one file, Interface in another
- Constitution alignment: "Smallest viable change" principle

**Trade-offs**:
- Less scalable for large feature additions (but Phase I scope is fixed)
- No deep import structure (but only 2 modules to import)

**Future Impact**:
Can refactor to package structure in Phase II if complexity increases (e.g., adding categories, tags, multiple data sources).

**Command to Document**:
```
/sp.adr flat-source-structure
```

---

## Decisions NOT Requiring ADRs

These decisions are **implementation details** that don't meet ADR significance criteria:

### Status Representation: Boolean vs Enum
- **Why Not ADR**: Only 2 states (Pending/Completed); boolean is standard Python practice
- **Reversibility**: Easy to change to enum if more states added later
- **Impact**: Low - localized to Task dataclass

### Error Handling: Return None/False vs Exceptions
- **Why Not ADR**: Standard Python convention (return None for "not found")
- **Scope**: Limited to TodoManager internal implementation
- **Impact**: Low - doesn't affect external API contracts

### Storage Structure: list[Task] vs dict[int, Task]
- **Why Not ADR**: Performance is adequate for spec requirements (<1,000 tasks)
- **Reversibility**: Internal implementation detail; easy to swap
- **Impact**: Low - hidden behind TodoManager interface

---

## Summary Table

| Decision | ADR Needed? | Primary Concern | Recommended Command |
|----------|-------------|-----------------|---------------------|
| ID Strategy (integers) | **YES** | Long-term impact + spec compliance | `/sp.adr auto-increment-id-strategy` |
| UI Pattern (input loop) | **YES** | Phase II extensibility + dependencies | `/sp.adr console-input-loop-ui` |
| Project Structure (flat) | **YES** | Maintainability + scalability | `/sp.adr flat-source-structure` |
| Status Boolean | NO | Implementation detail | N/A |
| Error Handling | NO | Standard practice | N/A |
| Storage List | NO | Internal optimization | N/A |

---

## Next Steps

**User Decision Required**: Would you like to document these 3 architectural decisions as ADRs?

**Options**:
1. **Document All 3**: Run `/sp.adr auto-increment-id-strategy`, `/sp.adr console-input-loop-ui`, `/sp.adr flat-source-structure`
2. **Document Later**: Proceed to `/sp.tasks` and create ADRs after implementation
3. **Skip ADRs**: Architectural rationale is already captured in plan.md

**Recommendation**: Document ADRs **now** (before implementation) to establish design rationale for future phases and team members.
