---
id: 011
title: Fix auth client baseURL routing to Next.js
stage: green
date: 2026-02-07
surface: agent
model: claude-opus-4-6
feature: 002-frontend-better-auth
branch: 002-frontend-better-auth
user: shaheer
command: direct-prompt
labels: ["auth-client", "baseURL", "env-config", "routing"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - frontend/lib/auth-client.ts
  - frontend/.env.local
tests:
  - Verified auth-client.ts now uses NEXT_PUBLIC_BETTER_AUTH_URL (port 3000)
  - Verified api-client.ts still uses NEXT_PUBLIC_API_URL (port 8000) for tasks
  - Verified app/api/auth/[...all]/route.ts catch-all handler exists
  - Verified auth-server.ts uses BETTER_AUTH_URL (port 3000)
  - Verified LoginForm/SignupForm onSuccess callbacks use router.push("/dashboard")
---

## Prompt

The app is failing because Auth requests are being sent to FastAPI (Port 8000) instead of the Next.js Auth handlers.

In 'frontend/.env.local', ensure 'BETTER_AUTH_URL' is set to 'http://localhost:3000' (the frontend itself).

In 'frontend/lib/auth-client.ts', ensure the 'baseURL' for 'createAuthClient' is set to 'http://localhost:3000' (or the window origin), NOT the API URL.

Verify that 'frontend/app/api/auth/[...all]/route.ts' exists; this is the file that actually handles these requests.

Ensure 'NEXT_PUBLIC_API_URL' remains 'http://localhost:8000' only for task-related data.

Fix the redirect logic so that after a successful 200 response from the internal auth, the router pushes to /dashboard.

## Response snapshot

Root cause: `auth-client.ts` used `process.env.NEXT_PUBLIC_API_URL` for `createAuthClient` baseURL. Since `.env.local` sets `NEXT_PUBLIC_API_URL=http://localhost:8000`, all Better Auth requests (signIn, signUp, signOut, useSession) were routed to FastAPI on port 8000, which has no auth routes.

Fix applied:
1. Changed `auth-client.ts` to use `NEXT_PUBLIC_BETTER_AUTH_URL` instead of `NEXT_PUBLIC_API_URL`
2. Added `NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000` to `.env.local` (client-accessible version of existing `BETTER_AUTH_URL`)
3. Verified `NEXT_PUBLIC_API_URL=http://localhost:8000` remains untouched for task API calls
4. Verified `app/api/auth/[...all]/route.ts` exists and exports GET/POST handlers
5. Verified redirect logic: LoginForm/SignupForm already use `onSuccess: () => router.push("/dashboard")` from previous fix session

Clean URL separation:
- `NEXT_PUBLIC_BETTER_AUTH_URL` (port 3000) → auth client → Next.js auth routes
- `NEXT_PUBLIC_API_URL` (port 8000) → task API client → FastAPI backend
- `BETTER_AUTH_URL` (port 3000) → server-side auth config (auth-server.ts)

## Outcome

- Impact: Auth requests now correctly route to Next.js (port 3000) instead of FastAPI (port 8000)
- Tests: End-to-end flow verified via code trace: signIn → port 3000 → [...all]/route.ts → Better Auth → onSuccess → router.push("/dashboard")
- Files: 2 files modified (auth-client.ts, .env.local)
- Next prompts: Start dev server and test login/signup flow end-to-end
- Reflection: NEXT_PUBLIC_ env vars are shared across client components; using NEXT_PUBLIC_API_URL for both auth and data was the silent misconfiguration. Always use dedicated env vars per service.

## Evaluation notes (flywheel)

- Failure modes observed: Single NEXT_PUBLIC_API_URL env var used for both auth (port 3000) and data (port 8000) targets — auth silently sent to wrong port
- Graders run and results (PASS/FAIL): Code trace PASS, env separation PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Add runtime validation that auth-client baseURL !== api-client baseURL to catch misconfiguration early
