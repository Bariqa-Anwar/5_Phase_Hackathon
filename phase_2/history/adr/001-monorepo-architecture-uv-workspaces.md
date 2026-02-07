# ADR-001: Monorepo Architecture and UV Workspace Strategy

> **Scope**: Document decision clusters, not individual technology choices. Group related decisions that work together.

- **Status:** Accepted
- **Date:** 2026-02-05
- **Feature:** 001-secure-backend-foundation
- **Context:** Need to transform the existing single-project repository into a monorepo structure that supports both backend (FastAPI) and frontend (Next.js) applications while maintaining independent development workflows, shared tooling, and coordinated releases.

<!-- Significance checklist (ALL must be true to justify this ADR)
     1) Impact: Long-term consequence for architecture/platform/security? ✅ YES - Defines project structure for entire application
     2) Alternatives: Multiple viable options considered with tradeoffs? ✅ YES - UV workspaces vs complete separation vs symlinks
     3) Scope: Cross-cutting concern (not an isolated detail)? ✅ YES - Affects all developers, build processes, deployment
-->

## Decision

We will use **UV Workspaces** as the monorepo strategy with the following structure:

- **Root pyproject.toml**: Workspace coordinator with `[tool.uv.workspace]` section listing members
- **Backend Subproject**: `/backend` directory with independent `pyproject.toml`, `uv.lock`, and Python dependencies
- **Frontend Subproject** (future): `/frontend` directory with npm/bun for Node.js ecosystem
- **Shared Configuration**: Root-level `.env`, linting configs, CI/CD definitions
- **Project Structure**: Layer-based architecture within backend (models/, routes/, services/)

**Key Components**:
- **Package Manager**: UV 0.1.0+ for Python workspace coordination
- **Directory Layout**: `/backend`, `/frontend` (future), `/specs`, `/.specify`
- **Dependency Isolation**: Each subproject manages its own dependencies independently
- **Workspace Coordination**: Root pyproject.toml declares workspace members but doesn't dictate dependencies

**Migration Approach**:
1. Create `/backend` directory
2. Move/restructure root `pyproject.toml` → `backend/pyproject.toml`
3. Update root `pyproject.toml` to workspace coordinator
4. Backend runs independently via `cd backend && uv run`

## Consequences

### Positive

- **Independent Execution**: Backend and frontend can be developed, tested, and deployed independently
- **Shared Tooling**: Root-level configuration (linters, formatters, CI/CD) applies to all subprojects
- **Official Pattern**: UV workspaces is the recommended approach for Python monorepos (since UV 0.1.0)
- **Scalability**: Easy to add more subprojects (e.g., `/cli`, `/workers`) without restructuring
- **Constitution Compliance**: Aligns with Principle I (Monorepo Structure) requiring `/backend` and `/frontend` directories
- **Dependency Clarity**: No confusion about which dependencies belong to which project
- **Build Isolation**: Backend builds don't interfere with frontend builds and vice versa

### Negative

- **Workspace Learning Curve**: Team must understand UV workspace semantics (members, coordination)
- **Tooling Requirements**: Requires UV 0.1.0+ (newer version than might be installed)
- **Configuration Duplication**: Some configs (e.g., Python version) must be specified in both root and backend
- **Initial Migration Effort**: Requires restructuring existing root-level files into backend subdirectory
- **Cross-Project Dependencies**: Sharing code between backend and frontend requires careful packaging
- **CI/CD Complexity**: Build pipelines must handle multiple subprojects (though modern CI tools handle this well)

## Alternatives Considered

### Alternative 1: Complete Separation (No Workspace)

**Approach**: Make `/backend` and `/frontend` completely independent repositories with no shared root coordination.

**Pros**:
- Maximum isolation between projects
- Simplest mental model (two separate repos)
- No workspace tooling dependency

**Cons**:
- Loses monorepo benefits (atomic commits across frontend/backend, shared CI/CD, coordinated releases)
- Harder to share tooling configuration (linters, formatters, pre-commit hooks)
- Spec-Kit Plus framework expects monorepo structure per constitution
- Version coordination between projects becomes manual

**Why Rejected**: Violates constitution principle I (Monorepo Structure) and loses the benefits of coordinated development that Spec-Kit Plus relies on.

### Alternative 2: Symlink Approach

**Approach**: Keep root UV project as primary, symlink backend dependencies and configs into `/backend`.

**Pros**:
- Avoids duplication of dependency declarations
- Simpler initial setup

**Cons**:
- Fragile on Windows (symlink support inconsistent)
- Confusing mental model (which pyproject.toml is source of truth?)
- Complicates CI/CD (symlinks don't always work in containers)
- Harder to understand for new developers

**Why Rejected**: Poor Windows support, confusing semantics, not the official UV pattern, harder to debug issues.

### Alternative 3: Turborepo/Nx Monorepo Tools

**Approach**: Use Turborepo or Nx for monorepo orchestration across Python and Node.js.

**Pros**:
- Polyglot support (Python + Node.js in one tool)
- Advanced caching and task orchestration
- Mature ecosystem

**Cons**:
- Additional tooling dependency (Node.js required even for backend-only work)
- Overkill for two-project monorepo
- UV workspaces sufficient for current needs
- Constitution specifies UV as Python manager (adding Turbo/Nx adds complexity)

**Why Rejected**: Unnecessary complexity for current scope. UV workspaces natively handles Python monorepo needs. Can revisit if cross-language orchestration becomes critical.

## References

- Feature Spec: [specs/001-secure-backend-foundation/spec.md](../../specs/001-secure-backend-foundation/spec.md)
- Implementation Plan: [specs/001-secure-backend-foundation/plan.md](../../specs/001-secure-backend-foundation/plan.md) (lines 59-99: Project Structure)
- Research: [specs/001-secure-backend-foundation/research.md](../../specs/001-secure-backend-foundation/research.md) (lines 8-58: UV Monorepo Migration Strategy)
- Constitution: [.specify/memory/constitution.md](../../.specify/memory/constitution.md) (Principle I: Environment & Tooling Context)
- Related ADRs: None (this is the foundational architecture decision)
