---
id: 015
title: Audit and clean backend requirements.txt
stage: misc
date: 2026-02-07
surface: agent
model: claude-opus-4-6
feature: 002-frontend-better-auth
branch: 002-frontend-better-auth
user: shaheer
command: direct-prompt
labels: ["requirements", "dependencies", "cleanup", "backend"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - backend/requirements.txt
tests:
  - No file:/// paths present (none found in original)
  - Core deps verified present: fastapi, uvicorn, sqlmodel, python-jose[cryptography]
  - All versions match actual venv installation (pip list --format=freeze)
  - Comment header added
  - 100+ unrelated packages removed (langchain, streamlit, pandas, numpy, etc.)
---

## Prompt

I have generated a requirements.txt using pip freeze. Please audit the file in the /backend directory: Remove any local file paths. Ensure core dependencies are present with current versions. Add a comment header. Save the cleaned file.

## Response snapshot

The pip freeze had dumped ~133 packages from a broader Python environment, including langchain, streamlit, huggingface_hub, pandas, numpy, pillow, cohere, qdrant-client, etc. — none of which are used by the backend.

Cross-referenced pyproject.toml (source of truth for declared deps) with actual `pip list --format=freeze` from the project venv. Rewrote requirements.txt with only the 28 packages actually installed in the backend venv, organized by category with comments. No file:/// paths were found.

Critical fix: `python-jose[cryptography]` was completely missing from the original file despite being imported in `auth.py`. Now included.

## Outcome

- Impact: requirements.txt reduced from 133 to 28 packages, all pinned to exact venv versions
- Tests: All versions verified against actual venv
- Files: 1 file modified (backend/requirements.txt)
- Next prompts: null
- Reflection: pip freeze from a shared/global environment captures everything — always cross-reference with pyproject.toml and project venv

## Evaluation notes (flywheel)

- Failure modes observed: pip freeze captured unrelated ML/AI packages from a broader environment
- Graders run and results (PASS/FAIL): Dep audit PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
