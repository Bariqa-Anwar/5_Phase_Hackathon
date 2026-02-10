# Implementation Plan: Professional Frontend & Better Auth Integration

**Branch**: `002-frontend-better-auth` | **Date**: 2026-02-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-frontend-better-auth/spec.md`

## Summary

Implement a professional Next.js 16 frontend application with Better Auth authentication that integrates with the existing FastAPI backend (Feature 001). The frontend will provide a responsive task management dashboard with user registration, login, and full CRUD operations for tasks. All API communication uses JWT tokens for authentication, with automatic token injection and refresh handling. The implementation follows a phased approach with 6 independently testable user stories (P1-P6).

**Key Deliverables**:
- Next.js 16 App Router application with TypeScript and Tailwind CSS
- Better Auth integration for authentication (signup, login, logout)
- Centralized API client with automatic JWT header injection
- Task dashboard with CRUD operations
- Protected routes with session management
- Responsive UI with professional design (sidebar, navbar, task cards)
- Zero modifications to existing backend code

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 16 (App Router), React 18+
**Primary Dependencies**: Better Auth (authentication), Tailwind CSS (styling), Lucide React (icons), React Hook Form (forms)
**Storage**: Client-side session storage (HttpOnly cookies or localStorage for JWT tokens), Backend PostgreSQL (via Feature 001)
**Testing**: Vitest (unit tests), Playwright (E2E tests), React Testing Library (component tests)
**Target Platform**: Web browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+), responsive design (320px-4K)
**Project Type**: Web application (frontend-only, integrates with existing backend)
**Performance Goals**:
- Dashboard loads within 2 seconds
- Task operations complete within 5 seconds
- UI remains responsive on mobile (60 FPS animations)
- First Contentful Paint < 1.5s

**Constraints**:
- No backend code modifications allowed
- Must use existing FastAPI endpoints from Feature 001
- JWT tokens must match backend's verification logic (HS256, BETTER_AUTH_SECRET)
- User isolation enforced by backend (frontend trusts backend filtering)
- Session persistence across tab refreshes required

**Scale/Scope**:
- Support 100+ concurrent users without degradation
- Handle task lists up to 1000 items with pagination
- Mobile-first responsive design (320px minimum width)
- 10-15 total pages/routes (auth + dashboard + CRUD forms)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Passed: Environment & Tooling Context
- **Check**: Uses proper package manager (npm/pnpm/bun, not UV for frontend)
- **Status**: PASS - Frontend uses npm, backend uses UV (correct separation)
- **Evidence**: quickstart.md specifies `npm install` commands

### ✅ Passed: Spec-Driven Implementation
- **Check**: Implementation follows spec.md with no deviations
- **Status**: PASS - All 6 user stories mapped to implementation phases
- **Evidence**: spec.md loaded, user stories P1-P6 defined in plan phases

### ✅ Passed: Technology Stack (NON-NEGOTIABLE)
- **Check**: Uses Next.js 16, TypeScript, Tailwind CSS, Better Auth
- **Status**: PASS - All required technologies specified
- **Evidence**: Technical Context section matches constitution requirements

### ✅ Passed: Security & Multi-Tenancy (NON-NEGOTIABLE)
- **Check**: No hardcoded secrets, JWT-based auth, user isolation
- **Status**: PASS - Environment variables used, JWT tokens from Better Auth, backend enforces isolation
- **Evidence**:
  - `.env.local` for BETTER_AUTH_SECRET
  - API client auto-injects JWT headers
  - Backend filters tasks by user_id (no frontend enforcement needed)

### ✅ Passed: Strict Typing (NON-NEGOTIABLE)
- **Check**: TypeScript strict mode, no `any` types
- **Status**: PASS - All data models defined in data-model.md with strict types
- **Evidence**: tsconfig.json will have `"strict": true`, data-model.md has comprehensive interfaces

### ✅ Passed: Agentic Execution (NON-NEGOTIABLE)
- **Check**: All changes via tools, smallest viable diff, code references
- **Status**: PASS - Plan follows agentic workflow, references specific files
- **Evidence**: Plan structure uses file paths, incremental phases

### ⚠️ Note: Backend Constraint
- **Constraint**: Zero backend modifications allowed
- **Mitigation**: Frontend adapts to existing API contract, validated in api-contracts.yaml
- **Risk**: Low - Backend API from Feature 001 is already complete and tested

**Constitution Compliance**: ✅ ALL GATES PASSED

## Project Structure

### Documentation (this feature)

```text
specs/002-frontend-better-auth/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file (implementation plan)
├── research.md          # Better Auth integration research (complete)
├── data-model.md        # TypeScript data models (complete)
├── quickstart.md        # Developer setup guide (complete)
├── contracts/           # API contract definitions (complete)
│   └── api-contracts.yaml
├── checklists/          # Quality validation
│   └── requirements.md
└── tasks.md             # Phase 2 output (NOT created by /sp.plan, created by /sp.tasks)
```

### Source Code (repository root)

```text
frontend/                         # Next.js 16 application
├── app/                          # App Router pages and layouts
│   ├── (auth)/                   # Auth pages group (public routes)
│   │   ├── login/
│   │   │   └── page.tsx         # Login page (P1)
│   │   └── signup/
│   │       └── page.tsx         # Signup page (P1)
│   ├── (dashboard)/              # Dashboard group (protected routes)
│   │   ├── dashboard/
│   │   │   └── page.tsx         # Task dashboard (P2)
│   │   ├── tasks/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx     # Task detail/edit (P4)
│   │   │   └── new/
│   │   │       └── page.tsx     # Create task (P3)
│   │   └── layout.tsx           # Dashboard layout with sidebar
│   ├── api/                      # API routes for Better Auth
│   │   └── auth/
│   │       └── [...all]/
│   │           └── route.ts     # Better Auth handler
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Landing/home page
│   └── globals.css               # Global Tailwind styles
├── components/                   # React components
│   ├── auth/
│   │   ├── LoginForm.tsx        # Login form with validation (P1)
│   │   ├── SignupForm.tsx       # Signup form with validation (P1)
│   │   └── ProtectedRoute.tsx   # Route protection HOC (P1)
│   ├── dashboard/
│   │   ├── TaskCard.tsx         # Task card component (P2)
│   │   ├── TaskList.tsx         # Task list container (P2)
│   │   ├── TaskFilters.tsx      # Status filter controls (P2)
│   │   ├── CreateTaskDialog.tsx # Task creation modal (P3)
│   │   ├── EditTaskForm.tsx     # Task editing form (P4)
│   │   └── DeleteTaskDialog.tsx # Delete confirmation (P5)
│   ├── layout/
│   │   ├── Navbar.tsx           # Top navigation bar
│   │   ├── Sidebar.tsx          # Side navigation menu
│   │   └── Footer.tsx           # Footer component
│   └── ui/                       # Reusable UI components
│       ├── Button.tsx           # Button with variants
│       ├── Input.tsx            # Input field with validation
│       ├── Card.tsx             # Card container
│       ├── Dialog.tsx           # Modal dialog
│       ├── Select.tsx           # Dropdown select
│       ├── Spinner.tsx          # Loading spinner
│       └── Toast.tsx            # Notification toast
├── lib/                          # Utilities and clients
│   ├── auth-client.ts           # Better Auth client setup (P1)
│   ├── auth-server.ts           # Better Auth server config (P1)
│   ├── api-client.ts            # Backend API client with JWT (P1)
│   ├── hooks/
│   │   ├── useAuth.ts           # Authentication hook (P1)
│   │   ├── useTasks.ts          # Tasks data hook (P2)
│   │   └── useToast.ts          # Toast notifications hook
│   ├── utils.ts                 # Helper functions (validation, formatting)
│   └── cn.ts                    # Tailwind class merger (clsx + tailwind-merge)
├── types/                        # TypeScript definitions
│   ├── auth.ts                  # Auth types (User, Session)
│   ├── task.ts                  # Task types (Task, TaskStatus)
│   └── api.ts                   # API request/response types
├── public/                       # Static assets
│   ├── favicon.ico
│   └── images/
├── .env.local                    # Environment variables (gitignored)
├── .env.example                  # Example environment variables
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── postcss.config.js             # PostCSS configuration
├── package.json                  # Dependencies
└── README.md                     # Frontend-specific documentation

backend/                          # FastAPI backend (Feature 001)
└── [No modifications - read-only reference]
```

**Structure Decision**: Web application structure (Option 2) selected because this feature is frontend-only and integrates with an existing backend. The backend directory exists from Feature 001 and remains unchanged. Frontend uses Next.js App Router with route groups for logical organization (auth pages vs protected dashboard pages).

## Complexity Tracking

**No complexity violations** - Constitution Check passed all gates without justified violations.

## Phase 0: Research (COMPLETE)

### Research Completed ✅

**File**: [research.md](./research.md) (28,000+ words)

**Key Findings**:
1. **Better Auth Configuration**: Use JWT plugin with Ed25519 signing, shared secret (BETTER_AUTH_SECRET), 15-60 min access tokens, 7-14 day refresh tokens
2. **Token Storage**: HttpOnly cookies in production (XSS-safe), localStorage acceptable for development
3. **Protected Routes**: Three patterns - Server Component session checks, Client Component hooks, Middleware validation
4. **Token Refresh**: Proactive refresh 1 minute before expiry, request queue to prevent race conditions
5. **Error Handling**: Comprehensive 401/403/404/422/500 handling with user-friendly messages

**Alternatives Considered**:
- **NextAuth**: Rejected due to limited plugin architecture and weaker FastAPI integration
- **Clerk**: Rejected due to vendor lock-in ($25-$99/month) and limited data ownership
- **Custom JWT**: Rejected due to complexity and security risks of rolling own auth

**Decision**: Better Auth chosen for full data ownership, zero vendor lock-in, excellent FastAPI integration, and cost-effectiveness ($0).

## Phase 1: Design & Contracts (COMPLETE)

### Data Model ✅

**File**: [data-model.md](./data-model.md)

**Core Entities**:
1. **User**: `{ id, email, name?, emailVerified, createdAt, updatedAt }`
2. **Session**: `{ user, accessToken, refreshToken?, expiresAt, issuedAt }`
3. **Task**: `{ id, title, description?, status, user_id, created_at, updated_at }`
4. **Form Models**: SignupFormData, LoginFormData, TaskFormData with validation rules

**Type Safety**: All models use TypeScript strict mode with explicit interfaces, no `any` types.

### API Contracts ✅

**File**: [contracts/api-contracts.yaml](./contracts/api-contracts.yaml)

**Authentication Endpoints** (Better Auth):
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/logout` - End session
- `GET /api/auth/session` - Get current session

**Task Endpoints** (FastAPI Backend):
- `GET /api/tasks` - List tasks (with pagination)
- `POST /api/tasks` - Create task
- `GET /api/tasks/{id}` - Get task by ID
- `PUT /api/tasks/{id}` - Update task (partial)
- `DELETE /api/tasks/{id}` - Delete task

**Contract Validation**: OpenAPI 3.1 spec with examples, request/response schemas, error cases (401/404/422/500).

### Quickstart Guide ✅

**File**: [quickstart.md](./quickstart.md)

**Covers**:
- 5-minute setup instructions
- Environment configuration
- Development workflow
- Common tasks (adding pages, components)
- Troubleshooting (CORS, JWT, session persistence)

## Phase 2: Technical Architecture

### Authentication Architecture

**Better Auth Setup** (`lib/auth-server.ts`):
```typescript
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  database: Database(process.env.DATABASE_URL!),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  jwt: {
    enabled: true,
    secret: process.env.BETTER_AUTH_SECRET!,
    expiresIn: 60 * 15, // 15 minutes
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});
```

**Client Setup** (`lib/auth-client.ts`):
```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

**Session Flow**:
1. User signs up/logs in → Better Auth issues JWT tokens
2. Access token (short-lived) stored in memory or localStorage
3. Refresh token (long-lived) stored in HttpOnly cookie
4. All backend API requests include `Authorization: Bearer <access-token>`
5. Token auto-refreshes 1 minute before expiry

### API Client Architecture

**Centralized Client** (`lib/api-client.ts`):
```typescript
import { authClient } from "./auth-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getAuthHeader(): Promise<string> {
  const session = await authClient.getSession();
  if (!session?.accessToken) {
    throw new Error("No active session");
  }
  return `Bearer ${session.accessToken}`;
}

export const api = {
  tasks: {
    list: async (params?: { limit?: number; offset?: number }) => {
      const query = new URLSearchParams(params as any).toString();
      const res = await fetch(`${API_BASE_URL}/api/tasks?${query}`, {
        headers: { Authorization: await getAuthHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },

    create: async (data: { title: string; description?: string; status?: string }) => {
      const res = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: await getAuthHeader(),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create task");
      return res.json();
    },

    update: async (id: number, data: Partial<{ title: string; description?: string; status: string }>) => {
      const res = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: await getAuthHeader(),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update task");
      return res.json();
    },

    delete: async (id: number) => {
      const res = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
        method: "DELETE",
        headers: { Authorization: await getAuthHeader() },
      });
      if (!res.ok) throw new Error("Failed to delete task");
    },
  },
};
```

**Error Handling Strategy**:
- 401 Unauthorized → Redirect to login, clear session
- 404 Not Found → Show "Task not found" message
- 422 Validation Error → Display inline field errors
- 500 Internal Error → Show generic error with retry option

### Protected Route Pattern

**Middleware Approach** (`middleware.ts`):
```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth-server";

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Redirect authenticated users away from auth pages
  if (request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/signup")) {
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup"],
};
```

### UI Component Architecture

**Component Hierarchy**:
```text
App Layout
├── Navbar (top navigation with user menu)
├── Sidebar (navigation links, hidden on mobile)
└── Main Content
    ├── Dashboard Page (P2)
    │   ├── TaskFilters (status dropdown)
    │   ├── TaskList (grid/list view)
    │   │   └── TaskCard[] (individual task cards)
    │   └── CreateTaskDialog (modal for new tasks)
    │
    ├── Login Page (P1)
    │   └── LoginForm (email, password, submit)
    │
    ├── Signup Page (P1)
    │   └── SignupForm (email, password, confirm)
    │
    ├── Task Detail Page (P4)
    │   └── EditTaskForm (title, description, status)
    │
    └── Toast Container (notifications)
```

**Responsive Strategy**:
- Mobile (<768px): Sidebar collapses to hamburger menu, single-column task list
- Tablet (768px-1024px): Sidebar visible, two-column task grid
- Desktop (>1024px): Sidebar + main content, three-column task grid

### State Management

**Global State** (React Context):
- `AuthContext`: User session, loading state, login/logout functions
- `ToastContext`: Notification queue, add/remove functions

**Local State** (React hooks):
- `useTasks`: Task list fetching, filtering, CRUD operations
- `useForm`: Form state, validation, submission

**No Redux/Zustand needed** - React Context + hooks sufficient for this scope.

## Implementation Phases

### Phase 1: Core Setup (P1 - MVP Foundation)
**User Story**: P1 - User Registration & Authentication
**Duration**: 2-3 hours
**Dependencies**: None (starting point)

**Tasks**:
1. Initialize Next.js 16 app with TypeScript and Tailwind
2. Install Better Auth, Lucide React dependencies
3. Configure environment variables (.env.local)
4. Set up Better Auth server (lib/auth-server.ts)
5. Set up Better Auth client (lib/auth-client.ts)
6. Create API route handler (app/api/auth/[...all]/route.ts)
7. Create AuthContext provider (lib/context/AuthContext.tsx)
8. Build Signup page with form validation (app/(auth)/signup/page.tsx)
9. Build Login page with form validation (app/(auth)/login/page.tsx)
10. Implement protected route middleware (middleware.ts)

**Validation**:
- User can sign up with email/password
- User can log in and JWT token is stored
- Unauthenticated users redirected to /login
- Authenticated users can access /dashboard

---

### Phase 2: Task Dashboard (P2)
**User Story**: P2 - Task Dashboard View
**Duration**: 2-3 hours
**Dependencies**: Phase 1 (authentication required)

**Tasks**:
1. Create centralized API client (lib/api-client.ts)
2. Build TaskCard component (components/dashboard/TaskCard.tsx)
3. Build TaskList component (components/dashboard/TaskList.tsx)
4. Create Dashboard layout with Sidebar (app/(dashboard)/layout.tsx)
5. Implement Dashboard page with task fetching (app/(dashboard)/dashboard/page.tsx)
6. Add loading skeleton for task list
7. Add empty state when no tasks
8. Add error handling with retry button
9. Style with Tailwind (responsive grid)

**Validation**:
- Authenticated user sees their tasks
- Tasks display title, description, status, timestamps
- Loading spinner shows during fetch
- Empty state shows for new users
- Error message shows on API failure

---

### Phase 3: Task Creation (P3)
**User Story**: P3 - Create New Task
**Duration**: 1-2 hours
**Dependencies**: Phase 2 (dashboard must exist)

**Tasks**:
1. Build CreateTaskDialog modal (components/dashboard/CreateTaskDialog.tsx)
2. Add form validation (title required, description optional)
3. Integrate with api.tasks.create()
4. Add success toast notification
5. Optimistic UI update (add task to list immediately)
6. Handle API errors with rollback
7. Add "New Task" button to dashboard

**Validation**:
- User can open modal from dashboard
- Form validates required fields
- Task appears in list after creation
- Success notification shows
- Form resets after submission

---

### Phase 4: Task Editing (P4)
**User Story**: P4 - Update Task Status & Details
**Duration**: 1-2 hours
**Dependencies**: Phase 2 (task list must exist)

**Tasks**:
1. Build EditTaskForm component (components/dashboard/EditTaskForm.tsx)
2. Create task detail page (app/(dashboard)/tasks/[id]/page.tsx)
3. Add inline status dropdown to TaskCard
4. Integrate with api.tasks.update()
5. Optimistic UI update
6. Handle concurrent edits (show warning)
7. Add cancel button to revert changes

**Validation**:
- User can click task to edit
- Title and description can be updated
- Status can be changed via dropdown
- Changes persist after save
- Cancel restores original values

---

### Phase 5: Task Deletion (P5)
**User Story**: P5 - Delete Task
**Duration**: 1 hour
**Dependencies**: Phase 2 (task list must exist)

**Tasks**:
1. Build DeleteTaskDialog confirmation (components/dashboard/DeleteTaskDialog.tsx)
2. Add delete button to TaskCard
3. Integrate with api.tasks.delete()
4. Optimistic UI update (remove from list)
5. Add undo option in toast (5-second window)
6. Smooth animation on removal

**Validation**:
- User can click delete button
- Confirmation dialog prevents accidents
- Task removed from list after confirmation
- Cancel button aborts deletion
- Toast shows with undo option

---

### Phase 6: Session Management (P6)
**User Story**: P6 - Session Management & Logout
**Duration**: 1-2 hours
**Dependencies**: Phase 1 (authentication must exist)

**Tasks**:
1. Add logout button to Navbar
2. Implement logout handler (clear session, redirect to /login)
3. Add token expiration handling
4. Implement auto-refresh 1 minute before expiry
5. Add session persistence (localStorage fallback)
6. Handle 401 responses globally (redirect to login)
7. Add user profile dropdown in Navbar

**Validation**:
- User can click logout and session clears
- Logout redirects to login page
- Token auto-refreshes before expiry
- Session persists across tab refreshes
- 401 errors trigger re-authentication

## Testing Strategy

### Unit Tests (Vitest)
**Coverage**: Utility functions, validation logic, API client methods
**Location**: `__tests__/unit/`

Example:
```typescript
// __tests__/unit/validation.test.ts
import { validateEmail, validateTaskTitle } from "@/lib/utils";

describe("validateEmail", () => {
  it("accepts valid emails", () => {
    expect(validateEmail("user@example.com")).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(validateEmail("invalid")).toBe(false);
  });
});
```

### Component Tests (React Testing Library)
**Coverage**: UI components, form validation, user interactions
**Location**: `__tests__/components/`

Example:
```typescript
// __tests__/components/LoginForm.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { LoginForm } from "@/components/auth/LoginForm";

test("shows error for empty email", async () => {
  render(<LoginForm />);
  fireEvent.submit(screen.getByRole("button", { name: /log in/i }));
  expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
});
```

### Integration Tests (Playwright E2E)
**Coverage**: End-to-end user flows, authentication, CRUD operations
**Location**: `e2e/`

Example:
```typescript
// e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test("user can sign up and login", async ({ page }) => {
  // Signup
  await page.goto("/signup");
  await page.fill('input[name="email"]', "test@example.com");
  await page.fill('input[name="password"]', "password123");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL("/dashboard");

  // Logout
  await page.click('button[aria-label="Logout"]');
  await expect(page).toHaveURL("/login");

  // Login
  await page.fill('input[name="email"]', "test@example.com");
  await page.fill('input[name="password"]', "password123");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL("/dashboard");
});
```

## Risk Mitigation

### Risk 1: JWT Token Mismatch with Backend
**Probability**: Medium | **Impact**: High

**Mitigation**:
- Validate BETTER_AUTH_SECRET matches between frontend and backend in quickstart
- Add token decode utility for debugging (development only)
- Include backend JWT verification test in integration suite

### Risk 2: CORS Configuration Issues
**Probability**: High (common in development) | **Impact**: Medium

**Mitigation**:
- Document CORS setup in quickstart troubleshooting
- Backend already configured with `allow_origins=["*"]` for development
- Production CORS configuration documented in deployment guide

### Risk 3: Token Expiration During Long Sessions
**Probability**: Medium | **Impact**: Medium

**Mitigation**:
- Proactive token refresh 1 minute before expiry
- Request queue prevents race conditions during concurrent refresh
- Global 401 handler redirects to login with return URL

### Risk 4: Mobile Responsiveness Breakage
**Probability**: Low | **Impact**: Medium

**Mitigation**:
- Mobile-first Tailwind CSS approach
- Responsive breakpoints tested (320px, 768px, 1024px, 1440px)
- Sidebar collapses to hamburger menu on mobile
- Touch-friendly button sizes (min 44x44px)

## Dependencies & Prerequisites

### External Dependencies
**Required**:
- Feature 001 (Backend Foundation) - FastAPI backend must be running
- Node.js 18+ or 20+ (for Next.js 16)
- npm, pnpm, or bun (package manager)

**Optional**:
- VS Code with TypeScript/Tailwind extensions
- Playwright for E2E testing
- Vercel account for deployment (future)

### Technical Prerequisites
**Configuration**:
- Root `.env` file with BETTER_AUTH_SECRET (shared with backend)
- Backend running on http://localhost:8000
- Database accessible from backend (Neon PostgreSQL)

**Environment Variables**:
```env
# Root .env (shared secret)
BETTER_AUTH_SECRET=tJVIyE6s7rHapXEHlYDtkT6sP57Tqfvk

# Frontend .env.local
BETTER_AUTH_SECRET=tJVIyE6s7rHapXEHlYDtkT6sP57Tqfvk
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
DATABASE_URL=postgresql://...  # Only if using Better Auth's database
```

## Success Criteria Validation

Mapping spec.md Success Criteria to implementation:

- **SC-001**: Signup/login < 90 seconds → Achieved through streamlined forms (2-3 fields only)
- **SC-002**: Dashboard loads < 2 seconds → Next.js SSR + React Server Components for data fetching
- **SC-003**: Task creation < 5 seconds → Optimistic UI updates + API client with minimal overhead
- **SC-004**: 95% validation errors caught → Inline validation with React Hook Form + Zod schemas
- **SC-005**: Responsive to 320px → Tailwind mobile-first approach, tested breakpoints
- **SC-006**: Keyboard accessible → Semantic HTML, focus management, ARIA labels
- **SC-007**: Visual feedback < 100ms → Tailwind animations, optimistic updates
- **SC-008**: Network failure handling → Error boundaries, retry buttons, toast notifications
- **SC-009**: Session persistence → localStorage/HttpOnly cookies, auto-restore on refresh
- **SC-010**: No backend changes → API client uses existing endpoints, contract validated

## Next Steps

After `/sp.plan` completion:

1. **Review Plan**: Validate architecture decisions with team
2. **Run `/sp.tasks`**: Generate detailed tasks.md with implementation steps
3. **Begin Implementation**: Start with Phase 1 (P1 - Authentication MVP)
4. **Incremental Delivery**: Complete one user story at a time (P1 → P2 → P3 → P4 → P5 → P6)
5. **Continuous Testing**: Run E2E tests after each phase completion

**Estimated Total Implementation Time**: 10-14 hours (spread over 2-3 days)

---

**Plan Status**: ✅ COMPLETE - Ready for task generation via `/sp.tasks`
