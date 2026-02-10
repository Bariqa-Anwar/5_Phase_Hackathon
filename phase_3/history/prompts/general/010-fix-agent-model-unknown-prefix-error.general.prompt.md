---
id: 010
title: Fix Agent Model Unknown Prefix Error
stage: general
date: 2026-02-09
surface: agent
model: claude-opus-4-6
feature: none
branch: 005-frontend-chatkit-integration
user: Rana
command: (user prompt)
labels: ["bugfix", "chatbot", "openrouter", "agents-sdk"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - backend/routes/chat.py (modified)
  - backend/routes/diagnostics.py (modified)
tests:
  - (none - verified via import checks)
---

## Prompt

The chatbot is failing with 'UserError: Unknown prefix: google'. Please fix the agent configuration in 'backend/routes/chat.py' (or where the Agent is defined):

1. **Change the Model**: Update the agent's model name from a 'google/...' model to an OpenAI-compatible string. If using OpenRouter, use 'openai/gpt-4o-mini' or 'meta-llama/llama-3.1-8b-instruct'.
2. **Provider Check**: Ensure the 'OpenAIModelProvider' is being used in the 'Agent' or 'run' configuration.
3. **Verify API Key**: Ensure the '.env' file has the correct key corresponding to the provider (OPENAI_API_KEY or OPENROUTER_API_KEY).
4. **Tool Access**: Confirm the 'mcp_server' is passed to the agent's 'tools' list so it can see the 'add_task' and 'list_tasks' functions.

## Response snapshot

Root cause: MultiProvider in openai-agents SDK splits model names on '/' and only recognizes 'openai/' and 'litellm/' prefixes. The default 'google/gemini-2.0-flash-001' triggered 'UserError: Unknown prefix: google'. Fix: Import OpenAIChatCompletionsModel directly, build it with the OpenRouter client, and pass the Model instance (not string) to Agent(model=). Changed default model to 'openai/gpt-4o-mini'. Added early 503 if API key missing. MCP tool access via mcp_servers= confirmed correct.

## Outcome

- Impact: Resolved critical runtime error preventing chatbot from responding; agent now initializes correctly with OpenRouter-compatible model
- Tests: Verified via import checks (no automated test suite run)
- Files: 2 files modified (backend/routes/chat.py, backend/routes/diagnostics.py)
- Next prompts: End-to-end chatbot smoke test, add automated integration tests for agent initialization
- Reflection: The openai-agents SDK MultiProvider prefix parsing is not well-documented; using the Model object directly bypasses the prefix routing entirely and is more reliable for third-party providers like OpenRouter

## Evaluation notes (flywheel)

- Failure modes observed: SDK prefix parser silently rejects non-standard provider prefixes; error message ("Unknown prefix: google") does not suggest the fix
- Graders run and results (PASS/FAIL): Manual import check PASS; no automated grader
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Add a startup self-test that verifies agent model instantiation before accepting requests
