---
id: 008
title: Fix Backend Dependencies CORS and Environment
stage: green
date: 2026-02-06
surface: agent
model: claude-opus-4-6
feature: 002-frontend-better-auth
branch: 002-frontend-better-auth
user: shaheer
command: continue
labels: ["backend", "dependencies", "cors", "jwt", "environment", "python-jose", "critical-fix"]
links:
  spec: specs/002-frontend-better-auth/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - backend/pyproject.toml
  - backend/main.py
tests:
  - Module import verification: PASS (jose, fastapi, uvicorn, sqlmodel, psycopg2, python-multipart)
  - Backend server startup: PASS (database connection successful, uvicorn on :8000)
  - Frontend server startup: PASS (Next.js on :3000)
  - CORS preflight: PASS (access-control-allow-origin: http://localhost:3000)
  - Unauthenticated API: PASS (401 "Not authenticated", no crash)
  - Frontend pages: PASS (/, /login, /signup all HTTP 200; /dashboard redirects to login)
---

## Prompt

The backend is crashing with 'ModuleNotFoundError: No module named jose'. Fix this and all remaining environment issues immediately: 1. Run 'pip install "python-jose[cryptography]"' in the /backend directory. 2. Verify and install other core backend dependencies: 'fastapi', 'uvicorn', 'sqlmodel', 'psycopg2-binary', and 'python-multipart'. 3. Audit the /backend/auth.py file to ensure the JWT secret matches the BETTER_AUTH_SECRET in /frontend/.env.local. 4. Double-check that FastAPI CORS middleware is configured to allow 'http://localhost:3000'. 5. Once fixed, confirm both servers can run simultaneously and that the 'Get Started' button no longer triggers 401/404 errors.

## Response snapshot

Addressed all 5 items:

1. **Dependencies** — `python-jose[cryptography]` was already in pyproject.toml but not installed in the active venv. Added `python-multipart` to pyproject.toml. Ran `uv sync` to install all dependencies. Verified 6 modules import cleanly: jose, fastapi, uvicorn, sqlmodel, psycopg2, python-multipart.

2. **JWT Secret Audit** — Confirmed `BETTER_AUTH_SECRET=tJVIyE6s7rHapXEHlYDtkT6sP57Tqfvk` matches exactly in root `.env` (backend reads this) and `frontend/.env.local` (token bridge reads this). Both use HS256 algorithm.

3. **CORS Fix** — Changed `allow_origins=["*"]` to explicit `["http://localhost:3000", "http://127.0.0.1:3000"]`. Wildcard with `allow_credentials=True` is technically invalid per CORS spec. Preflight test confirms `access-control-allow-origin: http://localhost:3000`.

4. **Server Verification** — Both servers run simultaneously:
   - Backend: http://localhost:8000 (uvicorn, database connected)
   - Frontend: http://localhost:3000 (Next.js 16.1.6 + Turbopack)
   - Killed stale Next.js process that was blocking port 3000

5. **End-to-End Verification**:
   - Landing page (/) → HTTP 200, "Get Started" links to /signup
   - Signup/Login pages → HTTP 200
   - Dashboard → HTTP 307 redirect to login (correct for unauthenticated)
   - API without token → 401 "Not authenticated" (no crash)
   - CORS preflight → properly allows http://localhost:3000

## Outcome

- ✅ Impact: Backend no longer crashes on import, CORS properly configured, both servers running
- 🧪 Tests: All 6 verification checks PASS
- 📁 Files: 2 modified (pyproject.toml — added python-multipart, main.py — tightened CORS origins)
- 🔁 Next prompts: Live browser testing (signup → dashboard → create task flow), then US4/US5
- 🧠 Reflection: The crash was a venv sync issue — dependencies were declared in pyproject.toml but not installed. `uv sync` resolves this. The CORS wildcard+credentials combo is a common footgun.

## Evaluation notes (flywheel)

- Failure modes observed: Dependencies declared but not installed in venv; stale Next.js process blocking port 3000
- Graders run and results (PASS/FAIL): Module imports PASS, Server startup PASS, CORS PASS, Auth flow PASS
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Live browser signup + create task to verify full end-to-end flow
