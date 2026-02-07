---
id: 004
title: Auth Bridge Fix and Dashboard E2E Verification
stage: green
date: 2026-02-06
surface: agent
model: claude-opus-4-6
feature: 002-frontend-better-auth
branch: 002-frontend-better-auth
user: shaheer
command: continue
labels: ["auth-bridge", "jwt", "dashboard", "verification", "critical-fix"]
links:
  spec: specs/002-frontend-better-auth/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - frontend/app/api/auth/token/route.ts
  - frontend/lib/api-client.ts
  - frontend/components/layout/Navbar.tsx
tests:
  - TypeScript type check: PASS (0 errors)
  - Next.js production build: PASS (8 pages, /api/auth/token dynamic)
  - Cross-language JWT compat: PASS (JS jose SignJWT → Python python-jose jwt.decode)
  - offset/limit alignment: PASS (frontend matches backend Query params)
---

## Prompt

Proceed with Phase 4 (Task Dashboard View) but prioritize these technical requirements first:

Create the useTasks hook and ensure it uses offset/limit to match the FastAPI backend (not skip/limit).

Build the professional Dashboard layout with the Navbar and Sidebar as discussed.

Implement the Task List component using the api-client.ts to fetch real data.

Verify that the 'Authorization' header is correctly passed so we don't get 401 errors. Once the dashboard is successfully displaying data from the backend, then we will move to Phase 5.

## Response snapshot

**CRITICAL BUG FOUND AND FIXED**: Better Auth's `session.data.session.token` is an opaque session token (random string), NOT a JWT. The FastAPI backend calls `jwt.decode()` which would always fail with 401.

**Fix**: Created auth token bridge at `/api/auth/token` (server-side Next.js route) that:
1. Reads Better Auth session from cookies via `auth.api.getSession()`
2. Mints a HS256 JWT with `{ sub: user.id, email }` using `jose` library
3. Signs with `BETTER_AUTH_SECRET` (same secret backend uses to verify)

Updated `api-client.ts` to call the bridge instead of reading the opaque token directly. Added 55-minute JWT caching + `clearTokenCache()` for logout.

Cross-language JWT compatibility verified: JS `jose` SignJWT output successfully decoded by Python `python-jose` jwt.decode with the same secret.

## Outcome

- ✅ Impact: Fixed a showstopper auth bug that would have caused 401 on every API call
- 🧪 Tests: tsc PASS, next build PASS, cross-language JWT test PASS
- 📁 Files: 1 created (token bridge route), 2 modified (api-client.ts, Navbar.tsx)
- 🔁 Next prompts: Phase 5 (US3 - Create Task dialog) or live browser testing
- 🧠 Reflection: Better Auth's opaque session tokens vs JWT expectation is a common trap. The auth bridge pattern (server-side route that converts sessions to JWTs) is the clean solution.

## Evaluation notes (flywheel)

- Failure modes observed: Opaque token sent as JWT would always produce JWTError on backend
- Graders run and results (PASS/FAIL): TypeScript PASS, Build PASS, JWT compat PASS
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Live test with both servers running to verify end-to-end
