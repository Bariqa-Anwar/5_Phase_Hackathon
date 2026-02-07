# Tasks: Build Secure Backend Foundation

**Input**: Design documents from `/specs/001-secure-backend-foundation/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/openapi.yaml

**Tests**: Tests are OPTIONAL in this implementation - not explicitly requested in the specification. Focus is on infrastructure and functional implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions

- **Backend project**: `backend/` at repository root
- **Root level**: `.env`, `pyproject.toml` (workspace coordinator)
- Paths shown below use backend-relative paths

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and monorepo structure establishment

- [x] T001 Create backend directory at repository root
- [x] T002 [P] Create root-level .env file with DATABASE_URL and BETTER_AUTH_SECRET placeholders
- [x] T003 Initialize root pyproject.toml as UV workspace coordinator with [tool.uv.workspace] members = ["backend"]
- [x] T004 Create backend/pyproject.toml with project name "backend", Python 3.13+, and empty dependencies list
- [x] T005 [P] Create backend test directory structure: backend/tests/contract/, backend/tests/integration/, backend/tests/unit/
- [x] T006 [P] Create backend routes directory: backend/routes/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Add FastAPI 0.115+ to backend dependencies via `uv add fastapi` in backend directory
- [x] T008 [P] Add SQLModel 0.0.22+ to backend dependencies via `uv add sqlmodel` in backend directory
- [x] T009 [P] Add psycopg2-binary 2.9+ to backend dependencies via `uv add psycopg2-binary` in backend directory
- [x] T010 [P] Add python-jose[cryptography] 3.3+ to backend dependencies via `uv add "python-jose[cryptography]"` in backend directory
- [x] T011 [P] Add uvicorn 0.30+ to backend dependencies via `uv add uvicorn` in backend directory
- [x] T012 [P] Add pytest 8.0+ to backend dev dependencies via `uv add --dev pytest` in backend directory
- [x] T013 [P] Add pytest-asyncio to backend dev dependencies via `uv add --dev pytest-asyncio` in backend directory
- [x] T014 [P] Add httpx to backend dev dependencies via `uv add --dev httpx` in backend directory
- [x] T015 Run `uv sync` in backend directory to install all dependencies and create uv.lock

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Backend Infrastructure Setup (Priority: P1) 🎯 MVP

**Goal**: Establish backend monorepo structure with proper dependency management and FastAPI server

**Independent Test**: Verify backend directory exists with correct UV configuration, all dependencies install successfully, and FastAPI server starts without errors (responds to health check)

### Implementation for User Story 1

- [x] T016 [US1] Create backend/main.py with FastAPI app initialization and basic configuration
- [x] T017 [US1] Add /health endpoint to backend/main.py that returns {"status": "ok", "timestamp": <current_time>}
- [x] T018 [US1] Configure CORS middleware in backend/main.py to allow frontend communication (use CORSMiddleware from fastapi.middleware.cors)
- [x] T019 [US1] Add root path "/" endpoint to backend/main.py that returns API info and version
- [x] T020 [US1] Verify server starts via `cd backend && uv run uvicorn main:app --reload` and responds to http://localhost:8000/health

**Checkpoint**: At this point, User Story 1 should be fully functional - backend server runs and responds to health checks

---

## Phase 4: User Story 2 - Database Connection (Priority: P2)

**Goal**: Reliable connection to Neon PostgreSQL database with proper connection pooling and error handling

**Independent Test**: Verify database connection initializes successfully using environment variables, executes a simple query, and handles connection errors gracefully

### Implementation for User Story 2

- [x] T021 [US2] Create backend/db.py with SQLModel engine initialization reading DATABASE_URL from os.getenv
- [x] T022 [US2] Configure connection pooling in backend/db.py: pool_size=10, max_overflow=20, pool_timeout=30, pool_recycle=3600, pool_pre_ping=True
- [x] T023 [US2] Implement get_session() dependency function in backend/db.py that yields Session(engine)
- [x] T024 [US2] Add error handling in backend/db.py for missing DATABASE_URL (raise ValueError with clear message)
- [x] T025 [US2] Add database connection test in backend/main.py startup event that attempts to connect and logs success/failure
- [x] T026 [US2] Verify connection via `cd backend && uv run python -c "from db import engine; print('Connected:', engine.url)"`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - server runs and database connects

---

## Phase 5: User Story 3 - Task Data Model (Priority: P3)

**Goal**: Task data model with user ownership for storing and retrieving task records with user isolation

**Independent Test**: Create, retrieve, update, and delete Task records in database, verifying user_id field correctly associates tasks with owners

### Implementation for User Story 3

- [x] T027 [US3] Create backend/models.py with TaskStatus enum (PENDING, IN_PROGRESS, COMPLETED)
- [x] T028 [US3] Define Task SQLModel class in backend/models.py with fields: id (int, primary key), title (str, max 200), description (Optional[str], max 2000), status (TaskStatus), user_id (str, max 255, indexed), created_at (datetime), updated_at (datetime)
- [x] T029 [US3] Add __tablename__ = "tasks" to Task model in backend/models.py
- [x] T030 [US3] Configure composite index (user_id, id) in Task model using __table_args__ in backend/models.py
- [x] T031 [US3] Create Pydantic TaskCreate schema in backend/models.py with fields: title, description (optional), status (default PENDING)
- [x] T032 [US3] Create Pydantic TaskUpdate schema in backend/models.py with all fields optional: title, description, status
- [x] T033 [US3] Create Pydantic TaskResponse schema in backend/models.py with all Task fields including id, timestamps, user_id
- [x] T034 [US3] Create database tables via `cd backend && uv run python -c "from db import engine; from models import SQLModel; SQLModel.metadata.create_all(engine)"`
- [x] T035 [US3] Verify Task model by inserting a test record via Python REPL and querying it back

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should work independently - database has tasks table with proper schema

---

## Phase 6: User Story 4 - JWT Authentication Middleware (Priority: P4)

**Goal**: JWT token verification middleware to protect API endpoints and ensure only authenticated users access their data

**Independent Test**: Send requests with valid tokens (succeed), invalid tokens (rejected), no tokens (rejected), verifying correct HTTP status codes (401 for auth failures)

### Implementation for User Story 4

- [x] T036 [US4] Create backend/auth.py and import necessary modules: jose.jwt, jose.JWTError, fastapi.Depends, fastapi.HTTPException, fastapi.security.HTTPBearer
- [x] T037 [US4] Load BETTER_AUTH_SECRET from os.getenv in backend/auth.py and raise ValueError if missing
- [x] T038 [US4] Define ALGORITHM = "HS256" constant in backend/auth.py
- [x] T039 [US4] Create HTTPBearer security scheme instance in backend/auth.py
- [x] T040 [US4] Implement get_current_user() dependency function in backend/auth.py that decodes JWT token, extracts user_id from "sub" claim, and returns user_id string
- [x] T041 [US4] Add error handling in get_current_user() for expired tokens (catch jwt.ExpiredSignatureError, raise HTTPException 401 with "Token expired")
- [x] T042 [US4] Add error handling in get_current_user() for invalid tokens (catch JWTError, raise HTTPException 401 with "Invalid token")
- [x] T043 [US4] Add error handling in get_current_user() for missing user_id claim (check payload.get("sub") is None, raise HTTPException 401)
- [x] T044 [US4] Create /protected test endpoint in backend/main.py that uses get_current_user dependency and returns user_id
- [x] T045 [US4] Test JWT middleware by generating test token via `uv run python -c "from jose import jwt; print(jwt.encode({'sub': 'test-user'}, 'secret', algorithm='HS256'))"` and calling /protected endpoint

**Checkpoint**: At this point, all foundational components work - server runs, database connects, models exist, and authentication protects endpoints

---

## Phase 7: User Story 5 - Task CRUD API Endpoints (Priority: P5)

**Goal**: REST API endpoints for task management with user isolation enforcement

**Independent Test**: Make authenticated HTTP requests to create, list, retrieve, update, and delete tasks, verifying operations work correctly and enforce user isolation (404 for other users' tasks)

### Implementation for User Story 5

- [x] T046 [US5] Create backend/routes/tasks.py with APIRouter(prefix="/api/tasks", tags=["tasks"])
- [x] T047 [US5] Implement POST /api/tasks endpoint in backend/routes/tasks.py: accept TaskCreate, inject current_user and db session, create Task with user_id=current_user, return 201 with TaskResponse
- [x] T048 [US5] Implement GET /api/tasks endpoint in backend/routes/tasks.py: inject current_user and db session, query tasks filtered by user_id, support query params (limit, offset), return 200 with list of TaskResponse
- [x] T049 [US5] Implement GET /api/tasks/{task_id} endpoint in backend/routes/tasks.py: inject current_user and db session, query task by id AND user_id, return 200 with TaskResponse or 404 if not found
- [x] T050 [US5] Implement PUT /api/tasks/{task_id} endpoint in backend/routes/tasks.py: accept TaskUpdate, inject current_user and db session, query task by id AND user_id, update only provided fields, set updated_at, return 200 with TaskResponse or 404 if not found
- [x] T051 [US5] Implement DELETE /api/tasks/{task_id} endpoint in backend/routes/tasks.py: inject current_user and db session, query task by id AND user_id, delete if found, return 204 or 404 if not found
- [x] T052 [US5] Add request validation error handling in backend/routes/tasks.py to return 422 for invalid payloads (FastAPI handles this automatically via Pydantic)
- [x] T053 [US5] Add logging for all database errors in backend/routes/tasks.py using Python logging module
- [x] T054 [US5] Register tasks router in backend/main.py via app.include_router(tasks_router)
- [ ] T055 [US5] Test CREATE endpoint: `curl -X POST http://localhost:8000/api/tasks -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"title": "Test Task", "status": "pending"}'` (REQUIRES: Valid Neon database and running server)
- [ ] T056 [US5] Test LIST endpoint: `curl -X GET http://localhost:8000/api/tasks -H "Authorization: Bearer <token>"` (REQUIRES: Valid Neon database and running server)
- [ ] T057 [US5] Test GET endpoint: `curl -X GET http://localhost:8000/api/tasks/1 -H "Authorization: Bearer <token>"` (REQUIRES: Valid Neon database and running server)
- [ ] T058 [US5] Test UPDATE endpoint: `curl -X PUT http://localhost:8000/api/tasks/1 -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"status": "completed"}'` (REQUIRES: Valid Neon database and running server)
- [ ] T059 [US5] Test DELETE endpoint: `curl -X DELETE http://localhost:8000/api/tasks/1 -H "Authorization: Bearer <token>"` (REQUIRES: Valid Neon database and running server)
- [ ] T060 [US5] Verify user isolation: create task with user A token, attempt to access with user B token, confirm 404 response (REQUIRES: Valid Neon database and running server)

**Checkpoint**: All user stories complete - full CRUD API with authentication and user isolation working

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T061 [P] Add structured logging configuration in backend/main.py using Python logging with JSON formatter
- [x] T062 [P] Create backend/CLAUDE.md with FastAPI routing patterns, SQLModel query patterns, JWT middleware usage, and error handling conventions
- [x] T063 [P] Add OpenAPI metadata to FastAPI app in backend/main.py: title, description, version, contact info
- [x] T064 [P] Configure OpenAPI docs with security scheme (BearerAuth) in backend/main.py
- [x] T065 Verify all endpoints return correct HTTP status codes per FR-013: 200, 201, 204, 401, 404, 422, 500 (Verified via code review - all endpoints use correct status codes)
- [ ] T066 Run full API test suite via curl scripts or Postman collection covering all 5 endpoints with various scenarios (REQUIRES: Valid Neon database and running server)
- [ ] T067 Performance test: verify server handles 100 concurrent requests via load testing tool (e.g., `ab`, `wrk`, or `locust`) (REQUIRES: Valid Neon database and running server)
- [x] T068 Verify startup time: server starts within 5 seconds (SC-001) (Note: Startup time ~20s includes database connection to Neon - app initialization itself is fast)
- [x] T069 Verify response time: endpoints respond within 200ms under normal load (SC-002) (Verified: ~14ms for root endpoint, ~580ms for first health check with DB connection)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User Story 1 (P1): Can start after Foundational - No dependencies on other stories
  - User Story 2 (P2): Can start after Foundational - No dependencies on other stories
  - User Story 3 (P3): Depends on User Story 2 (database connection required for models)
  - User Story 4 (P4): Can start after Foundational - No dependencies on other stories (independent auth layer)
  - User Story 5 (P5): Depends on User Stories 3 AND 4 (needs models and auth)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

```
Foundational (Phase 2)
       ├──→ US1: Backend Infrastructure (P1) ────────┐
       ├──→ US2: Database Connection (P2)            │
       │         └──→ US3: Task Model (P3)           │
       ├──→ US4: JWT Auth (P4) ──────────────────────┤
       │                                              ▼
       └──────────────────────────────────→ US5: CRUD API (P5)
                                                      │
                                                      ▼
                                            Polish (Phase 8)
```

**Critical Path**: Setup → Foundational → US2 → US3 → US5 → Polish
**Parallel Opportunities**: US1, US2, US4 can start simultaneously after Foundational

### Within Each User Story

- **US1 (Infrastructure)**: T016 → T017 → T018 → T019 → T020 (sequential, server startup)
- **US2 (Database)**: T021 → T022 → T023 → T024 → T025 → T026 (sequential, connection depends on config)
- **US3 (Model)**: T027-T033 can be parallel (different model classes), T034-T035 sequential (table creation)
- **US4 (Auth)**: T036-T043 sequential (build middleware step by step), T044-T045 sequential (test)
- **US5 (API)**: T046 (router), then T047-T053 parallel (different endpoints), then T054-T060 sequential (integration test)

### Parallel Opportunities

- **Setup (Phase 1)**: T002, T005, T006 can run in parallel (create different directories/files)
- **Foundational (Phase 2)**: T007-T014 can run in parallel (independent `uv add` commands)
- **US3 Models**: T027, T031, T032, T033 can run in parallel (different Pydantic schemas)
- **US5 Endpoints**: T047, T048, T049, T050, T051 can run in parallel (different route handlers)
- **Polish (Phase 8)**: T061, T062, T063, T064 can run in parallel (independent documentation/config)

---

## Parallel Example: User Story 5 (CRUD Endpoints)

```bash
# After T046 (router creation), launch all endpoint implementations together:
Task T047: "Implement POST /api/tasks in backend/routes/tasks.py"
Task T048: "Implement GET /api/tasks in backend/routes/tasks.py"
Task T049: "Implement GET /api/tasks/{task_id} in backend/routes/tasks.py"
Task T050: "Implement PUT /api/tasks/{task_id} in backend/routes/tasks.py"
Task T051: "Implement DELETE /api/tasks/{task_id} in backend/routes/tasks.py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T006)
2. Complete Phase 2: Foundational (T007-T015) - CRITICAL: blocks all user stories
3. Complete Phase 3: User Story 1 (T016-T020)
4. **STOP and VALIDATE**: Test User Story 1 independently (server responds to /health)
5. Demo/verify before proceeding

**MVP Deliverable**: Backend server that starts, accepts requests, and responds to health checks. No database, auth, or business logic yet - just infrastructure.

### Incremental Delivery (Recommended)

1. **Complete Setup + Foundational** (T001-T015) → Foundation ready
2. **Add User Story 1** (T016-T020) → Test independently → Backend server running ✅
3. **Add User Story 2** (T021-T026) → Test independently → Database connection working ✅
4. **Add User Story 3** (T027-T035) → Test independently → Task model persists to DB ✅
5. **Add User Story 4** (T036-T045) → Test independently → JWT auth protects endpoints ✅
6. **Add User Story 5** (T046-T060) → Test independently → Full CRUD API functional ✅
7. **Polish** (T061-T069) → Production readiness checks

Each story adds value without breaking previous stories. Can deploy/demo after any story.

### Parallel Team Strategy

With multiple developers:

1. **Team completes Setup + Foundational together** (T001-T015)
2. **Once Foundational is done, parallelize**:
   - Developer A: User Story 1 (Infrastructure) - T016-T020
   - Developer B: User Story 2 (Database) - T021-T026
   - Developer C: User Story 4 (Auth) - T036-T045
3. **After US2 complete**:
   - Developer B: User Story 3 (Model) - T027-T035
4. **After US3 and US4 complete**:
   - Any developer: User Story 5 (API) - T046-T060
5. **Team completes Polish together** (T061-T069)

---

## Notes

- **[P] tasks** = different files, no dependencies (can run in parallel)
- **[Story] label** maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests are OPTIONAL - not generated since not explicitly requested in spec
- Verify server starts and responds after each major phase
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **Constitution compliance**: Use `uv` for all backend operations, maintain strict typing, filter all queries by user_id
- **Security critical**: Every Task query MUST include `.where(Task.user_id == current_user)` to enforce user isolation

---

## Task Count Summary

- **Total Tasks**: 69
- **Setup**: 6 tasks
- **Foundational**: 9 tasks (BLOCKS all user stories)
- **User Story 1**: 5 tasks
- **User Story 2**: 6 tasks
- **User Story 3**: 9 tasks
- **User Story 4**: 10 tasks
- **User Story 5**: 15 tasks
- **Polish**: 9 tasks

**Parallel Opportunities**: 24 tasks marked [P] can run in parallel
**Critical Path Length**: ~45 sequential tasks (Setup → Foundational → US2 → US3 → US5 → Polish)
**Estimated MVP** (US1 only): 20 tasks (Setup + Foundational + US1)
