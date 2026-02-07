---
name: auth-bridge
description: The JWT handshake logic connecting Better Auth (Next.js) and FastAPI.
---

# Auth Bridge Strategy

## Instructions
1. **JWT Issuance**: Configure Better Auth to output JWTs on the frontend.
2. **Header Injection**: Ensure the frontend API client adds `Authorization: Bearer <token>`.
3. **Backend Verification**: Use `PyJWT` in the FastAPI middleware to verify the signature using `BETTER_AUTH_SECRET`.
4. **User Isolation**: Extract the `sub` (User ID) from the JWT and pass it to every DB query.

## Key Check
- Shared Secret: Both stacks MUST use the same `BETTER_AUTH_SECRET`.