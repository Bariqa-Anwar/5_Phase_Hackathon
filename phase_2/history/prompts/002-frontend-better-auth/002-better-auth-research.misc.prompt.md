---
id: 002
title: Better Auth Integration Research for Next.js 16 with FastAPI Backend
stage: misc
date: 2026-02-05
surface: agent
model: claude-sonnet-4-5-20250929
feature: 002-frontend-better-auth
branch: 002-frontend-better-auth
user: Bariqa-Anwar
command: research
labels: ["research", "authentication", "better-auth", "nextjs-16", "fastapi", "jwt", "security"]
links:
  spec: E:\phase_2\specs\002-frontend-better-auth\spec.md
  ticket: null
  adr: null
  pr: null
files:
  - E:\phase_2\specs\002-frontend-better-auth\research.md
tests:
  - None (research phase)
---

## Prompt

Research Better Auth integration for Next.js 16 frontend with FastAPI backend using JWT tokens.

Context: We're building a Next.js 16 application that needs to integrate with Better Auth for authentication, while the FastAPI backend handles JWT token verification independently.

Research requirements:
1. Better Auth setup and configuration for Next.js 16 (App Router)
2. How Better Auth generates and manages JWT tokens
3. Best practices for storing JWT tokens client-side (localStorage vs sessionStorage vs cookies)
4. How to configure Better Auth to use a shared secret (BETTER_AUTH_SECRET) for JWT signing
5. Patterns for handling token expiration and refresh
6. How to create signup and login pages with Better Auth
7. Protected route patterns in Next.js 16 App Router
8. Session persistence across browser tab refreshes

Output required:
- Recommended Better Auth configuration approach
- JWT token storage strategy with rationale
- Code patterns for auth pages and protected routes
- Best practices for error handling (expired tokens, network failures)
- Alternatives considered and why Better Auth was chosen

## Response snapshot

**Research Complete**: Created comprehensive research document covering all aspects of Better Auth integration with Next.js 16 and FastAPI backend.

### Key Findings

1. **Better Auth Configuration**:
   - Fully compatible with Next.js 16 App Router
   - Uses "proxy" instead of "middleware" terminology
   - Supports JWT plugin with EdDSA/Ed25519 cryptography
   - Provides JWKS endpoint for public key distribution

2. **JWT Token Storage Strategy**:
   - **Recommended**: HttpOnly cookies for production (XSS protection)
   - **Hybrid Approach**: Short-lived access tokens in memory, long-lived refresh tokens in HttpOnly cookies
   - **Rejected**: localStorage and sessionStorage due to XSS vulnerabilities

3. **Token Management**:
   - Standard lifetimes: 15-60 min access tokens, 7-14 day refresh tokens
   - Implements automatic token refresh with request queue to prevent race conditions
   - Supports token rotation for enhanced security (single-use refresh tokens)
   - Proactive refresh: Refresh tokens 1 minute before expiry

4. **Protected Routes**:
   - Server Component protection via `auth.api.getSession()`
   - Client Component protection via `useRequireAuth` hook
   - Middleware (proxy) protection with database validation
   - Layout-level protection for nested routes

5. **Better Auth vs Alternatives**:
   - **Better Auth**: Full data ownership, plugin architecture, no vendor lock-in, $0 cost
   - **Clerk**: Rapid setup (30 min), pre-built UI, $25-$99+/month, vendor lock-in
   - **NextAuth**: Mature solution, OAuth focus, database sessions, free
   - **Chosen**: Better Auth for full control, FastAPI integration, cost-effectiveness

### Implementation Approach

**Phased Plan** (10-14 hours total):
- Phase 1: Core Authentication Setup (2-3 hours)
- Phase 2: Auth Pages (2-3 hours)
- Phase 3: API Client Integration (2-4 hours)
- Phase 4: Protected Routes (1-2 hours)
- Phase 5: Session Management (1-2 hours)

### Code Patterns Provided

1. Better Auth server configuration with shared secret
2. API route handler for Next.js App Router
3. Client configuration with SessionProvider
4. Signup/login pages with validation and error handling
5. Centralized API client with token refresh interceptors
6. Protected route patterns (server, client, middleware)
7. FastAPI JWT verification with shared secret and JWKS
8. Error handling components and utilities

### Security Best Practices

- ✅ HttpOnly cookies with Secure and SameSite flags
- ✅ Token rotation with single-use refresh tokens
- ✅ Rate limiting on auth endpoints
- ✅ CORS configuration for frontend origin only
- ✅ CSP headers for XSS prevention
- ✅ Audit logging for authentication events
- ✅ Proactive token refresh to avoid 401 errors

### Documentation Structure

The research document (14 sections, 28,000+ words) covers:
1. Better Auth setup and configuration
2. JWT token generation and management
3. Token storage strategy with security analysis
4. Token expiration and refresh patterns
5. Signup/login page implementation
6. Protected route patterns
7. Session persistence mechanisms
8. Error handling best practices
9. Alternative solutions comparison
10. Recommended implementation approach
11. FastAPI backend integration
12. Production deployment considerations
13. Comprehensive references and sources
14. Conclusion and next steps

## Outcome

- ✅ Impact: Comprehensive research document created with production-ready patterns for Better Auth integration. Provides clear implementation roadmap with security best practices.
- 🧪 Tests: No tests (research phase). Testing checklist provided in research document for implementation phase.
- 📁 Files: Created E:\phase_2\specs\002-frontend-better-auth\research.md (28,000+ words, 14 sections, 50+ code examples)
- 🔁 Next prompts:
  - "Create plan.md based on research findings"
  - "Generate tasks.md for phased implementation"
  - "Implement Phase 1: Core Authentication Setup"
- 🧠 Reflection: Research successfully consolidated 9 web searches into actionable guidance. HttpOnly cookies emerged as clear winner for token storage. Better Auth chosen over Clerk/NextAuth for data ownership and FastAPI integration. Implementation complexity estimated at 10-14 hours across 5 phases.

## Evaluation notes (flywheel)

- Failure modes observed: None. All web searches returned relevant, up-to-date information for 2026.
- Graders run and results (PASS/FAIL): N/A (research phase)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Validate Better Auth JWT plugin configuration with actual FastAPI backend to confirm shared secret approach works correctly
