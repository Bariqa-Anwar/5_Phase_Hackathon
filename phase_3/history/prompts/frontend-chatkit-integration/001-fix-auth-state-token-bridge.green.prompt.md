---
id: 001
title: Fix Auth State and Token Bridge
stage: green
date: 2026-02-09
surface: agent
model: claude-opus-4-6
feature: frontend-chatkit-integration
branch: 005-frontend-chatkit-integration
user: shaheer
command: direct-prompt
labels: ["auth", "bug-fix", "token-bridge", "middleware"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - frontend/middleware.ts
  - frontend/app/(dashboard)/layout.tsx
  - frontend/lib/hooks/useTasks.ts
  - frontend/lib/api-client.ts
  - frontend/components/auth/LoginForm.tsx
  - frontend/components/auth/SignupForm.tsx
  - frontend/\.env.example
tests:
  - TypeScript type-check passed (npx tsc --noEmit)
---

## Prompt

The frontend is failing with 'Failed to get auth token' and displaying a generic 'User' name. Please fix the authentication state:

1. **Check LocalStorage**: Ensure the frontend is correctly saving the 'token' and 'user' object to localStorage upon login.
2. **Auth Hook**: Update the 'useAuth' hook in 'frontend/hooks/useAuth.ts' (or similar) to properly initialize state from localStorage on page load.
3. **API Headers**: Verify the custom fetch client is adding the 'Authorization: Bearer <token>' header to all requests.
4. **Endpoint Match**: Ensure the frontend login/signup calls match the FastAPI endpoints (likely /api/auth/login).
5. **Dashboard Fix**: Ensure 'Dashboard.tsx' uses the 'user.name' from the auth context instead of a hardcoded 'User' string.

## Response snapshot

Diagnosed root causes: (1) No route protection allowed unauthenticated users to hit /dashboard, triggering token bridge before session exists; (2) useTasks hook fired before auth resolved; (3) Dashboard layout rendered children before useSession() completed. Fixed by: creating Next.js middleware for server-side route protection, adding client-side auth guard in dashboard layout, making useTasks depend on isAuthenticated, clearing token cache on login/signup, and adding retry logic to getAuthHeader.

## Outcome

- ✅ Impact: Fixed "Failed to get auth token" error and "User" name display by adding proper auth guards at middleware, layout, and hook levels
- 🧪 Tests: TypeScript type-check passed
- 📁 Files: 1 created (middleware.ts), 6 modified (layout, useTasks, api-client, LoginForm, SignupForm, .env.example)
- 🔁 Next prompts: Test login/signup flow end-to-end, verify token bridge works with Neon DB
- 🧠 Reflection: The app uses Better Auth (cookie-based) not localStorage. The real issue was missing auth guards causing premature API calls.

## Evaluation notes (flywheel)

- Failure modes observed: Race condition between useSession resolution and useTasks fetch; no server-side or client-side route protection
- Graders run and results (PASS/FAIL): tsc --noEmit PASS
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Add integration test for login → dashboard flow
