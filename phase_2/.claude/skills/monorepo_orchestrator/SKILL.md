---
name: monorepo-orchestrator
description: High-level management of the /frontend and /backend folders and .env sync.
---

# Monorepo Management

## Instructions
1. **Package Safety**: Never run `npm` in the `/backend` or `uv` in the `/frontend`.
2. **Environment Sync**: Maintain a root `.env.example` file that combines all keys.
3. **Spec-Kit Alignment**: Ensure every code change maps back to a file in `/specs`.
4. **Command Hub**: Create a root `Makefile` or `justfile` to run both services simultaneously.