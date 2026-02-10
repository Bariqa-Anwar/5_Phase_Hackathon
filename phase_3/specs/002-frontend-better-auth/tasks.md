# Implementation Tasks: Professional Frontend & Better Auth Integration

**Feature**: 002-frontend-better-auth
**Branch**: `002-frontend-better-auth`
**Created**: 2026-02-05
**Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

## Overview

This document provides step-by-step implementation tasks for building a Next.js 16 frontend with Better Auth authentication integrated with the existing FastAPI backend. Tasks are organized by user story priority to enable incremental, independently testable delivery.

**Implementation Strategy**:
- MVP First: Complete User Story 1 (P1) for authentication foundation
- Incremental Delivery: Each user story is independently testable
- Parallel Opportunities: Tasks marked [P] can run in parallel
- Test Coverage: Manual testing via browser and API validation

**Total Estimated Time**: 10-14 hours across 6 user stories

---

## Phase 1: Setup & Project Initialization

**Purpose**: Initialize Next.js project with required dependencies and configuration

**Prerequisites**: Node.js 18+, backend from Feature 001 running

### Implementation for Setup

- [ ] T001 Create Next.js 16 application: `npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir --import-alias "@/*"` in repository root
- [ ] T002 Navigate to frontend directory and install Better Auth: `npm install better-auth`
- [ ] T003 Install Lucide React icons: `npm install lucide-react`
- [ ] T004 Install form handling dependencies: `npm install react-hook-form @hookform/resolvers zod`
- [ ] T005 Install utility libraries: `npm install clsx tailwind-merge`
- [ ] T006 Create frontend/.env.example with template variables: BETTER_AUTH_SECRET, BETTER_AUTH_URL, NEXT_PUBLIC_API_URL, DATABASE_URL
- [ ] T007 Create frontend/.env.local with actual values from root .env (BETTER_AUTH_SECRET must match backend)
- [ ] T008 Update frontend/tsconfig.json to enable strict mode: `"strict": true`
- [ ] T009 Create frontend/.gitignore additions: .env.local, .next, node_modules, .vercel
- [ ] T010 [P] Create frontend/lib/cn.ts utility for Tailwind class merging (clsx + tailwind-merge)
- [ ] T011 [P] Create frontend/lib/utils.ts with validation helpers (validateEmail, validatePassword, validateTaskTitle)

**Checkpoint**: Frontend project initialized with all dependencies installed and configuration files created

---

## Phase 2: Foundational - Type Definitions & Base Components

**Purpose**: Establish TypeScript types and reusable UI components used across all user stories

**Prerequisites**: Phase 1 complete

### Implementation for Foundational

- [ ] T012 [P] Create frontend/types/auth.ts with User, Session, AuthState interfaces from data-model.md
- [ ] T013 [P] Create frontend/types/task.ts with Task, TaskStatus enum, TaskDisplay interfaces from data-model.md
- [ ] T014 [P] Create frontend/types/api.ts with API request/response types from data-model.md
- [ ] T015 [P] Create frontend/components/ui/Button.tsx with variants (primary, secondary, outline, ghost) using Tailwind
- [ ] T016 [P] Create frontend/components/ui/Input.tsx with label, error state, and validation display using Tailwind
- [ ] T017 [P] Create frontend/components/ui/Card.tsx as container component with Tailwind styling
- [ ] T018 [P] Create frontend/components/ui/Spinner.tsx loading indicator component
- [ ] T019 [P] Create frontend/components/ui/Dialog.tsx modal dialog component with overlay
- [ ] T020 [P] Create frontend/components/ui/Select.tsx dropdown component for status selection
- [ ] T021 [P] Create frontend/components/ui/Toast.tsx notification component with success/error/warning variants
- [ ] T022 [P] Create frontend/lib/hooks/useToast.ts hook for managing toast notifications with add/remove functions
- [ ] T023 Update frontend/app/globals.css with Tailwind base styles, custom CSS variables for colors/spacing
- [ ] T024 Update frontend/tailwind.config.ts with custom theme colors, responsive breakpoints (320px, 768px, 1024px)

**Checkpoint**: All base components and type definitions created, ready for feature implementation

---

## Phase 3: User Story 1 - User Registration & Authentication (Priority: P1) 🎯 MVP

**Goal**: Establish authentication foundation with signup, login, and protected route handling

**Independent Test**: Visit /signup, create account with valid credentials, verify auto-login and redirect to /dashboard. Login with existing credentials, verify JWT token stored and protected routes accessible.

### Implementation for User Story 1

- [ ] T025 [US1] Create frontend/lib/auth-server.ts with Better Auth server configuration (JWT plugin, emailAndPassword, session settings)
- [ ] T026 [US1] Create frontend/lib/auth-client.ts with Better Auth client using createAuthClient, export signIn/signUp/signOut/useSession
- [ ] T027 [US1] Create frontend/app/api/auth/[...all]/route.ts as Better Auth API route handler
- [ ] T028 [US1] Create frontend/lib/api-client.ts with centralized API client, getAuthHeader function, api.tasks object (list/create/update/delete methods)
- [ ] T029 [US1] Create frontend/lib/hooks/useAuth.ts hook wrapping Better Auth useSession with loading/error states
- [ ] T030 [US1] Create frontend/components/auth/SignupForm.tsx with email/password/confirmPassword fields, validation (min 8 chars, email format), error display
- [ ] T031 [US1] Create frontend/components/auth/LoginForm.tsx with email/password fields, rememberMe checkbox, validation, error display
- [ ] T032 [US1] Create frontend/app/(auth)/signup/page.tsx using SignupForm component, handle submission with Better Auth signUp
- [ ] T033 [US1] Create frontend/app/(auth)/login/page.tsx using LoginForm component, handle submission with Better Auth signIn
- [ ] T034 [US1] Create frontend/middleware.ts with route protection logic: redirect unauthenticated users from /dashboard/* to /login, redirect authenticated users from /login|/signup to /dashboard
- [ ] T035 [US1] Create frontend/app/layout.tsx as root layout with Better Auth SessionProvider wrapper
- [ ] T036 [US1] Create frontend/app/page.tsx as landing page with links to /signup and /login
- [ ] T037 [US1] Test signup flow: visit http://localhost:3000/signup, create account, verify redirect to /dashboard
- [ ] T038 [US1] Test login flow: visit http://localhost:3000/login, enter credentials, verify redirect to /dashboard
- [ ] T039 [US1] Test protected routes: attempt to access /dashboard without auth, verify redirect to /login
- [ ] T040 [US1] Test token storage: inspect browser DevTools > Application > Cookies/LocalStorage, verify JWT token present

**Checkpoint**: At this point, User Story 1 should be fully functional - users can sign up, log in, and access protected routes. This is the MVP milestone.

---

## Phase 4: User Story 2 - Task Dashboard View (Priority: P2)

**Goal**: Display all user tasks in a responsive dashboard with loading/empty/error states

**Independent Test**: Log in, verify dashboard displays tasks from backend API with proper loading states. Verify empty state shows for new users. Verify error state with retry button if API fails.

### Implementation for User Story 2

- [ ] T041 [US2] Create frontend/lib/hooks/useTasks.ts hook for fetching tasks with api.tasks.list(), manage loading/error/data states
- [ ] T042 [US2] Create frontend/components/dashboard/TaskCard.tsx displaying task title, description, status badge, timestamps with Tailwind Card styling
- [ ] T043 [US2] Create frontend/components/dashboard/TaskList.tsx container with responsive grid (1 col mobile, 2 col tablet, 3 col desktop)
- [ ] T044 [US2] Create frontend/components/dashboard/TaskFilters.tsx with status dropdown filter (all, pending, in_progress, completed)
- [ ] T045 [US2] Create frontend/components/layout/Navbar.tsx with user menu dropdown, logout button (placeholder for P6)
- [ ] T046 [US2] Create frontend/components/layout/Sidebar.tsx with navigation links (Dashboard, Tasks), collapsible on mobile
- [ ] T047 [US2] Create frontend/app/(dashboard)/layout.tsx with Navbar + Sidebar + main content area layout
- [ ] T048 [US2] Create frontend/app/(dashboard)/dashboard/page.tsx fetching tasks with useTasks hook, display TaskList component
- [ ] T049 [US2] Add loading skeleton to frontend/app/(dashboard)/dashboard/page.tsx using Spinner component while tasks fetch
- [ ] T050 [US2] Add empty state to frontend/app/(dashboard)/dashboard/page.tsx when tasks.length === 0 with "Create your first task" CTA
- [ ] T051 [US2] Add error state to frontend/app/(dashboard)/dashboard/page.tsx when API fails with retry button calling refetch
- [ ] T052 [US2] Test dashboard with existing tasks: login, verify tasks display with title/description/status/timestamps
- [ ] T053 [US2] Test dashboard empty state: login as new user, verify empty state shows with CTA
- [ ] T054 [US2] Test dashboard loading state: add artificial delay, verify spinner shows during fetch
- [ ] T055 [US2] Test dashboard error state: stop backend API, verify error message and retry button show

**Checkpoint**: At this point, User Stories 1 AND 2 should work independently - authentication complete, dashboard displays tasks

---

## Phase 5: User Story 3 - Create New Task (Priority: P3)

**Goal**: Enable users to create new tasks via modal dialog with form validation

**Independent Test**: Click "New Task" button, fill form with title/description/status, submit, verify task appears in dashboard list and API responds 201 Created.

### Implementation for User Story 3

- [ ] T056 [US3] Create frontend/components/dashboard/CreateTaskDialog.tsx modal with Dialog component, form fields (title, description, status dropdown)
- [ ] T057 [US3] Add form validation to CreateTaskDialog: title required (1-200 chars), description optional (max 2000 chars), status defaults to "pending"
- [ ] T058 [US3] Integrate CreateTaskDialog with api.tasks.create(), handle success with toast notification
- [ ] T059 [US3] Add optimistic UI update to CreateTaskDialog: immediately add task to list, rollback on API error
- [ ] T060 [US3] Handle API errors in CreateTaskDialog: display error message, preserve form data, show retry option
- [ ] T061 [US3] Add "New Task" button to frontend/app/(dashboard)/dashboard/page.tsx opening CreateTaskDialog
- [ ] T062 [US3] Update useTasks hook with createTask function calling api.tasks.create() and refreshing list
- [ ] T063 [US3] Test task creation: click "New Task", fill required fields, submit, verify task appears in list
- [ ] T064 [US3] Test validation: submit empty form, verify inline error messages show for required fields
- [ ] T065 [US3] Test success notification: create task, verify toast shows "Task created successfully"
- [ ] T066 [US3] Test error handling: stop backend, create task, verify error message and form data preserved

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should work independently - can create tasks

---

## Phase 6: User Story 4 - Update Task Status & Details (Priority: P4)

**Goal**: Enable users to edit task details and update status via inline controls

**Independent Test**: Click existing task to edit, modify title/description/status, save, verify changes persist and reflect in dashboard immediately.

### Implementation for User Story 4

- [ ] T067 [US4] Create frontend/components/dashboard/EditTaskForm.tsx with form fields pre-populated from selected task
- [ ] T068 [US4] Add validation to EditTaskForm: same rules as create (title 1-200, description max 2000)
- [ ] T069 [US4] Integrate EditTaskForm with api.tasks.update(), handle partial updates (only changed fields)
- [ ] T070 [US4] Add optimistic UI update to EditTaskForm: immediately update task in list, rollback on error
- [ ] T071 [US4] Add cancel button to EditTaskForm restoring original values
- [ ] T072 [US4] Add inline status dropdown to TaskCard component calling api.tasks.update() on change
- [ ] T073 [US4] Create frontend/app/(dashboard)/tasks/[id]/page.tsx detail page using EditTaskForm
- [ ] T074 [US4] Update useTasks hook with updateTask function calling api.tasks.update() and refreshing list
- [ ] T075 [US4] Handle concurrent edits: show warning if task updated_at changed since load
- [ ] T076 [US4] Test task editing: click task, modify title/description, save, verify changes persist
- [ ] T077 [US4] Test inline status update: change status dropdown in TaskCard, verify immediate visual feedback
- [ ] T078 [US4] Test cancel: edit task, click cancel, verify original values restored
- [ ] T079 [US4] Test concurrent edit warning: modify task in two tabs, save both, verify warning shown

**Checkpoint**: At this point, User Stories 1, 2, 3, AND 4 should work independently - full CRUD except delete

---

## Phase 7: User Story 5 - Delete Task (Priority: P5)

**Goal**: Enable users to permanently delete tasks with confirmation dialog

**Independent Test**: Click delete button on task, confirm deletion, verify task removed from dashboard and backend (204 No Content). Cancel deletion, verify task remains.

### Implementation for User Story 5

- [ ] T080 [US5] Create frontend/components/dashboard/DeleteTaskDialog.tsx confirmation dialog with "Are you sure?" message
- [ ] T081 [US5] Add delete button to TaskCard component opening DeleteTaskDialog
- [ ] T082 [US5] Integrate DeleteTaskDialog with api.tasks.delete(), handle success with toast notification
- [ ] T083 [US5] Add optimistic UI update to DeleteTaskDialog: immediately remove task from list, rollback on error
- [ ] T084 [US5] Add undo option in success toast (5-second window) to restore deleted task
- [ ] T085 [US5] Add smooth animation to TaskCard removal using Tailwind transitions
- [ ] T086 [US5] Update useTasks hook with deleteTask function calling api.tasks.delete() and refreshing list
- [ ] T087 [US5] Test task deletion: click delete, confirm, verify task removed from list
- [ ] T088 [US5] Test cancel deletion: click delete, click cancel in dialog, verify task remains
- [ ] T089 [US5] Test undo: delete task, click undo in toast within 5 seconds, verify task restored
- [ ] T090 [US5] Test error handling: stop backend, delete task, verify error message and task remains in list

**Checkpoint**: At this point, User Stories 1-5 complete - full CRUD functionality operational

---

## Phase 8: User Story 6 - Session Management & Logout (Priority: P6)

**Goal**: Enable users to logout, handle token expiration, and persist sessions across refreshes

**Independent Test**: Click logout button, verify session cleared and redirect to /login. Close browser, reopen within timeout, verify still authenticated. Let token expire, verify prompted to re-authenticate.

### Implementation for User Story 6

- [ ] T091 [US6] Implement logout handler in Navbar component: call Better Auth signOut, clear session, redirect to /login
- [ ] T092 [US6] Add token expiration detection in api-client.ts: check session.expiresAt before each request
- [ ] T093 [US6] Implement proactive token refresh in auth-client.ts: refresh 1 minute before expiry
- [ ] T094 [US6] Add session persistence: save session to localStorage on successful auth, restore on app load
- [ ] T095 [US6] Add global 401 handler in api-client.ts: redirect to /login with returnUrl query param
- [ ] T096 [US6] Add user profile dropdown to Navbar showing email, account link, logout button
- [ ] T097 [US6] Handle 401 responses in useTasks hook: clear session, show "Session expired" toast, redirect to login
- [ ] T098 [US6] Test logout: click logout button, verify session cleared, redirected to /login, cannot access /dashboard
- [ ] T099 [US6] Test session persistence: login, close browser, reopen, verify still authenticated
- [ ] T100 [US6] Test token expiration: wait for token to expire (or manually modify expiry), verify prompted to re-authenticate
- [ ] T101 [US6] Test 401 handling: manually expire backend session, make API request, verify redirect to login

**Checkpoint**: All user stories complete - full authentication flow, CRUD operations, session management working

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final polish, documentation, and cross-cutting improvements

- [ ] T102 [P] Add loading skeletons to TaskCard component for smoother initial render
- [ ] T103 [P] Add Tailwind animations to task status changes (smooth color transitions)
- [ ] T104 [P] Add keyboard shortcuts: Ctrl+N for new task, Escape to close dialogs
- [ ] T105 [P] Add ARIA labels to all interactive elements for accessibility
- [ ] T106 [P] Add focus management: trap focus in dialogs, restore focus on close
- [ ] T107 [P] Create frontend/README.md with setup instructions, dev workflow, troubleshooting
- [ ] T108 [P] Create frontend/CLAUDE.md with component patterns, API client usage, state management conventions
- [ ] T109 Verify responsive design: test on 320px, 768px, 1024px, 1440px screen widths
- [ ] T110 Verify all HTTP status codes: 200 (success), 201 (created), 204 (deleted), 401 (unauthorized), 404 (not found), 422 (validation error)
- [ ] T111 Performance test: verify dashboard loads within 2 seconds with 100+ tasks
- [ ] T112 Performance test: verify task creation completes within 5 seconds
- [ ] T113 Verify session persistence: refresh page, verify session maintained, verify auto-restore after browser close
- [ ] T114 Final integration test: complete full user flow (signup → login → create → update → delete → logout)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - US1 (P1): No user story dependencies - starting point
  - US2 (P2): Depends on US1 (requires authentication)
  - US3 (P3): Depends on US2 (requires dashboard to display created tasks)
  - US4 (P4): Depends on US2 (requires task list to edit tasks)
  - US5 (P5): Depends on US2 (requires task list to delete tasks)
  - US6 (P6): Depends on US1 (requires authentication to logout)
- **Polish (Phase 9)**: Depends on all user stories completion

### User Story Independence

While there are logical dependencies (authentication before dashboard, dashboard before CRUD), each user story delivers independent value:

- **US1 alone**: Users can sign up and log in (authentication MVP)
- **US1 + US2**: Users can view their tasks (read-only dashboard)
- **US1 + US2 + US3**: Users can create tasks (read + create)
- **US1 + US2 + US3 + US4**: Users can edit tasks (read + create + update)
- **US1 + US2 + US3 + US4 + US5**: Full CRUD operations
- **US1-US6**: Full application with session management

### Parallel Execution Opportunities

**Within Setup Phase** (all can run in parallel after T001-T009):
- T010 (cn.ts) + T011 (utils.ts) - different files

**Within Foundational Phase** (all can run in parallel after Phase 1):
- T012-T014 (type definitions) - different files
- T015-T022 (UI components) - different files
- T023-T024 (styles/config) - different files

**Within Each User Story Phase**:
- Component creation tasks with [P] marker can run in parallel (different files)
- Test tasks (T037-T040, T052-T055, etc.) can run in parallel after implementation

**Example: US1 Parallel Tasks**:
```bash
# After Better Auth setup (T025-T029), these can run in parallel:
T030 (SignupForm) + T031 (LoginForm) + T036 (landing page) - different files
```

**Example: US2 Parallel Tasks**:
```bash
# After layout setup (T045-T047), these can run in parallel:
T042 (TaskCard) + T043 (TaskList) + T044 (TaskFilters) - different files
```

**Example: Polish Phase** (most tasks can run in parallel):
```bash
T102 + T103 + T104 + T105 + T106 + T107 + T108 - all independent
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

**Time**: 2-3 hours
**Scope**: Authentication foundation (T001-T040)
**Value**: Users can sign up, log in, and access protected routes
**Test**: Visit /signup, create account, verify redirect to /dashboard

### Incremental Delivery

1. **Phase 1**: US1 (Authentication) → Test independently
2. **Phase 2**: US1 + US2 (Dashboard View) → Test independently
3. **Phase 3**: US1 + US2 + US3 (Create Tasks) → Test independently
4. **Phase 4**: US1-4 (Edit Tasks) → Test independently
5. **Phase 5**: US1-5 (Delete Tasks) → Test independently
6. **Phase 6**: US1-6 (Session Management) → Full application test

### Testing Strategy

**Manual Testing** (Primary):
- Browser-based testing at http://localhost:3000
- DevTools inspection (Network tab, Console, Application/Storage)
- Backend API validation at http://localhost:8000

**Integration Testing**:
- Signup flow: New account creation and auto-login
- Login flow: Existing user authentication
- Protected routes: Access control verification
- Task CRUD: Create, read, update, delete operations
- Session persistence: Browser refresh and close/reopen
- Error handling: Network failures, validation errors, 401/404 responses

**No automated tests** in this phase - focus on rapid development and manual validation.

---

## Task Summary

**Total Tasks**: 114
**By Phase**:
- Setup: 11 tasks
- Foundational: 13 tasks
- US1 (P1 - Authentication): 16 tasks
- US2 (P2 - Dashboard): 15 tasks
- US3 (P3 - Create Task): 11 tasks
- US4 (P4 - Edit Task): 13 tasks
- US5 (P5 - Delete Task): 11 tasks
- US6 (P6 - Session Mgmt): 11 tasks
- Polish: 13 tasks

**Parallel Opportunities**: 40+ tasks marked [P] can run in parallel

**Checkpoints**: 8 major checkpoints align with phase completions

**Estimated Timeline**:
- Setup + Foundational: 1-2 hours
- US1 (MVP): 2-3 hours (checkpoint: authentication working)
- US2: 2-3 hours (checkpoint: dashboard working)
- US3: 1-2 hours (checkpoint: can create tasks)
- US4: 1-2 hours (checkpoint: can edit tasks)
- US5: 1 hour (checkpoint: can delete tasks)
- US6: 1-2 hours (checkpoint: session management working)
- Polish: 1-2 hours (checkpoint: production-ready)

**Total: 10-14 hours** across 2-3 days

---

**Implementation Status**: Ready to begin - all tasks defined with clear acceptance criteria and file paths
