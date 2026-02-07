# ADR-002: Backend Technology Stack

> **Scope**: Document decision clusters, not individual technology choices. Group related decisions that work together.

- **Status:** Accepted
- **Date:** 2026-02-05
- **Feature:** 001-secure-backend-foundation
- **Context:** Need to select a cohesive backend technology stack for building a REST API with database persistence, type safety, and performance requirements (<200ms p95 latency, 100+ concurrent users). The stack must integrate seamlessly, provide end-to-end type safety, and align with constitutional requirements for strict typing and UV-managed dependencies.

<!-- Significance checklist (ALL must be true to justify this ADR)
     1) Impact: Long-term consequence for architecture/platform/security? ✅ YES - Defines entire backend tech foundation
     2) Alternatives: Multiple viable options considered with tradeoffs? ✅ YES - Multiple framework/ORM/database combinations evaluated
     3) Scope: Cross-cutting concern (not an isolated detail)? ✅ YES - Every backend developer must work with these technologies
-->

## Decision

We will use the following integrated backend technology stack:

**Core Framework & ORM**:
- **Web Framework**: FastAPI 0.115+ (async ASGI framework)
- **ORM**: SQLModel 0.0.22+ (combines SQLAlchemy + Pydantic)
- **Database Driver**: psycopg2-binary 2.9+ (PostgreSQL adapter)
- **JWT Library**: python-jose[cryptography] 3.3+ (token verification)

**Database**:
- **Primary Database**: Neon Serverless PostgreSQL (accessed via DATABASE_URL)
- **Connection Pattern**: Synchronous SQLModel with connection pooling (pool_size=10, max_overflow=20, pool_pre_ping=True)

**Server & Testing**:
- **ASGI Server**: uvicorn 0.30+ (development and production)
- **Testing**: pytest 8.0+ with pytest-asyncio, httpx for API testing

**Architecture Pattern**:
- **Structure**: Layer-based (models/, routes/, services/, shared modules at root)
- **Dependency Management**: UV for all Python packages
- **Type Safety**: Full Pydantic validation for request/response, SQLModel for database

## Consequences

### Positive

- **End-to-End Type Safety**: SQLModel → FastAPI → Pydantic creates seamless type flow from database to API
- **Single Source of Truth**: SQLModel defines both database schema and Pydantic models in one class
- **FastAPI Performance**: Async-capable, automatic OpenAPI generation, excellent validation
- **Neon Serverless**: Auto-scaling PostgreSQL, no infrastructure management, generous free tier
- **Constitution Compliance**: Meets Principle III (Technology Stack) and Principle VI (Strict Typing)
- **Developer Experience**: FastAPI auto-docs (/docs), type hints enable IDE autocomplete, SQLModel reduces boilerplate
- **Mature Ecosystem**: All components have large communities, extensive documentation, production-proven
- **Connection Resilience**: pool_pre_ping=True enables automatic reconnection (meets SC-005: <5s downtime)

### Negative

- **SQLModel Maturity**: SQLModel is newer (0.0.x versions) than pure SQLAlchemy, fewer advanced features
- **Async Complexity Avoided**: Using sync SQLModel (not async) means slightly lower theoretical max throughput
- **Neon Vendor Lock-In**: Serverless PostgreSQL specific to Neon (though standard Postgres API reduces lock-in)
- **Learning Curve**: Team must learn FastAPI dependency injection, SQLModel ORM patterns, async concepts
- **Psycopg2 Limitations**: psycopg2-binary doesn't support async (psycopg3 would, but SQLModel uses psycopg2)
- **Connection Pool Limits**: 10 connections + 20 overflow = 30 max concurrent DB operations (sufficient for 100 users but not infinite scale)

## Alternatives Considered

### Alternative 1: Django + Django ORM + PostgreSQL

**Stack**: Django 5.0, Django ORM, standard PostgreSQL, dj-rest-auth for JWT

**Pros**:
- Mature, batteries-included framework
- Django admin panel out of the box
- Extensive ecosystem and community

**Cons**:
- Heavier framework (more opinionated, slower startup)
- Django ORM lacks Pydantic integration (type safety gap)
- Worse performance for API-only use case (FastAPI ~2-3x faster)
- Django REST Framework adds complexity
- Doesn't align as well with Pydantic-based frontend typing

**Why Rejected**: FastAPI provides better performance, simpler architecture for API-only services, and superior type safety integration. Django's strengths (admin, templates, ORM migrations) are less valuable for stateless API backend.

### Alternative 2: FastAPI + Raw SQLAlchemy + PostgreSQL

**Stack**: FastAPI 0.115, SQLAlchemy 2.0 (without SQLModel), psycopg2, python-jose

**Pros**:
- More control over ORM behavior
- SQLAlchemy 2.0 is more mature than SQLModel
- Wider community knowledge of SQLAlchemy patterns

**Cons**:
- Requires separate Pydantic models and SQLAlchemy models (duplication)
- More boilerplate code (two class definitions per entity)
- Loses type safety benefits of SQLModel's unified approach
- Violates DRY principle (database schema defined twice)

**Why Rejected**: SQLModel provides significant developer experience improvement by merging SQLAlchemy and Pydantic into single class definition. The maturity trade-off is acceptable for the DX gains.

### Alternative 3: FastAPI + Async SQLModel + asyncpg + PostgreSQL

**Stack**: FastAPI 0.115, SQLModel async mode, asyncpg driver, standard PostgreSQL

**Pros**:
- True async end-to-end (FastAPI → SQLModel → asyncpg)
- Higher theoretical max throughput
- Better for I/O-heavy workloads

**Cons**:
- SQLModel async support is less mature (experimental in some areas)
- More complex code (async/await everywhere, connection lifecycle management)
- Harder to debug (async stack traces)
- Overkill for 100 concurrent users (sync is sufficient)
- Team must learn async patterns deeply

**Why Rejected**: Performance requirements (100 concurrent users, <200ms p95) are achievable with sync SQLModel + connection pooling. Async adds significant complexity without clear benefit for current scale. Can revisit if scale increases 10x.

### Alternative 4: Node.js (Express/Fastify) + Prisma + PostgreSQL

**Stack**: Fastify 4.x, Prisma ORM, PostgreSQL, jsonwebtoken

**Pros**:
- Full-stack JavaScript (same language as frontend)
- Prisma has excellent type generation
- Node.js has huge ecosystem

**Cons**:
- Violates constitution Principle III (Backend Stack must be FastAPI + SQLModel)
- Team must switch languages (Python → JavaScript for backend)
- Less type safety than Pydantic (TypeScript inference vs runtime validation)
- UV dependency management doesn't apply (need npm/pnpm)

**Why Rejected**: Constitution mandates FastAPI + SQLModel + Neon PostgreSQL stack. This alternative would require constitutional amendment. Python's type safety story (Pydantic runtime validation) is stronger than TypeScript's compile-time-only checks.

## References

- Feature Spec: [specs/001-secure-backend-foundation/spec.md](../../specs/001-secure-backend-foundation/spec.md) (FR-002: Dependencies, FR-003: Database)
- Implementation Plan: [specs/001-secure-backend-foundation/plan.md](../../specs/001-secure-backend-foundation/plan.md) (lines 11-19: Technical Context)
- Research: [specs/001-secure-backend-foundation/research.md](../../specs/001-secure-backend-foundation/research.md)
  - Lines 60-103: FastAPI Project Structure
  - Lines 105-152: Neon PostgreSQL Connection Patterns
- Constitution: [.specify/memory/constitution.md](../../.specify/memory/constitution.md)
  - Principle III: Technology Stack & Architecture (lines 44-65)
  - Principle VI: Strict Typing (lines 92-98)
- Related ADRs: [ADR-001](./001-monorepo-architecture-uv-workspaces.md) (monorepo structure)
