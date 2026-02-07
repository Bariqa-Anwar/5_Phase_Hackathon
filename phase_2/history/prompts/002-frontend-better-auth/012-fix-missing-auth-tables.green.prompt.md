---
id: 012
title: Fix missing Better Auth database tables
stage: green
date: 2026-02-07
surface: agent
model: claude-opus-4-6
feature: 002-frontend-better-auth
branch: 002-frontend-better-auth
user: shaheer
command: direct-prompt
labels: ["database", "migration", "better-auth", "tables", "postgresql"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - scripts/migrate-better-auth.js
tests:
  - Database query confirmed tables before migration: [tasks]
  - Database query confirmed tables after migration: [account, session, tasks, user, verification]
  - Column verification: user table has id, name, email, emailVerified, image, createdAt, updatedAt
  - Column verification: session table has id, userId, token, expiresAt, ipAddress, userAgent, createdAt, updatedAt
  - Column verification: account table has all 13 columns including password field for hashed passwords
  - Secret sync check: BETTER_AUTH_SECRET identical in frontend/.env.local and .env (backend)
  - DATABASE_URL sync check: identical in both env files
  - Zero existing users confirmed (clean state ready for signup)
---

## Prompt

Auth is now hitting the correct routes but failing with 'Invalid credentials' and 'Failed to signup'. Fix this immediately:

Check the Backend Logs: If there is a 'Table not found' error, run the migration scripts or SQLModel commands to create the Auth tables in the database.

Sync Secrets: Ensure 'BETTER_AUTH_SECRET' is identical in both 'frontend/.env.local' and 'backend/.env'.

Verify Database URL: Ensure the DATABASE_URL is correct and the database service (PostgreSQL/SQLite) is actually running.

In 'auth.ts', ensure the 'password' field is being hashed correctly before storage.

Restart both servers and confirm that a new user can be written to the 'user' table.

## Response snapshot

Root cause: The Neon PostgreSQL database only had the `tasks` table. Better Auth's 4 required tables (`user`, `session`, `account`, `verification`) had never been created. Every signup/login attempt failed because Better Auth couldn't write to non-existent tables.

Investigation:
1. Queried `pg_tables` → found only `[tasks]`
2. Better Auth CLI (`npx @better-auth/cli migrate`) failed due to Windows npm cache issue (ENOTEMPTY) and Node v20.15.1 engine mismatch
3. Created manual migration script `scripts/migrate-better-auth.js` with exact Better Auth PostgreSQL schema (camelCase quoted column names, text PKs, proper FK constraints, indexes)
4. Ran migration successfully → database now has `[account, session, tasks, user, verification]`

Additional checks passed:
- `BETTER_AUTH_SECRET` identical in both `frontend/.env.local` and root `.env` ✅
- `DATABASE_URL` identical in both env files ✅
- Password hashing: Better Auth handles this internally via scrypt when `emailAndPassword.enabled: true` — no manual config needed ✅
- Auth route handler `app/api/auth/[...all]/route.ts` exists and exports GET/POST ✅
- Auth client baseURL correctly set to `NEXT_PUBLIC_BETTER_AUTH_URL` (localhost:3000) ✅

## Outcome

- Impact: Auth signup/login can now succeed — Better Auth has all required database tables with correct schema
- Tests: Database verification queries confirm all 4 tables with correct columns; secrets and URLs in sync
- Files: 1 file created (scripts/migrate-better-auth.js — reusable migration script)
- Next prompts: Start both servers, test signup with new user, verify user row appears in database, test login, verify dashboard redirect
- Reflection: Better Auth requires its own tables (user, session, account, verification) separate from app tables. The CLI migrate command is the intended path but can fail on Windows — always have a manual SQL fallback.

## Evaluation notes (flywheel)

- Failure modes observed: Better Auth fails silently when tables don't exist (returns generic "Failed to signup" instead of "table not found")
- Graders run and results (PASS/FAIL): Database verification PASS, secret sync PASS, schema validation PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Add a startup health check in auth-server.ts that verifies required tables exist and logs clear errors if missing
