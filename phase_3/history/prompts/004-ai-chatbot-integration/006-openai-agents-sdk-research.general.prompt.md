---
id: 006
title: OpenAI Agents SDK Research for MCP Chatbot
stage: general
date: 2026-02-08
surface: agent
model: claude-opus-4-6
feature: 004-ai-chatbot-integration
branch: master
user: user
command: research
labels: ["openai-agents", "mcp", "sdk-research", "chatbot", "MCPServerStdio"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
tests:
---

## Prompt

Research the OpenAI Agents SDK (package: openai-agents) for building an AI chatbot that uses MCP tools. I need specific, current information about:

1. **Agent + Runner pattern**: How to create an Agent with a system prompt and run it with Runner.run(). What are the exact imports and API? Specifically look for `from agents import Agent, Runner` vs `from openai_agents import ...`

2. **MCPServerStdio integration**: How to connect the Agent to an MCP server running as a subprocess via stdio. The pattern `MCPServerStdio(name=..., params={"command": "python", "args": ["mcp_server.py"]})`. How does the agent discover tools?

3. **Conversation history / message input**: How to pass prior conversation history to `Runner.run()`. Does it accept a list of messages? What format?

4. **OpenRouter / custom base_url**: How does the Agents SDK pick up `OPENAI_BASE_URL` and `OPENAI_API_KEY` env vars? Or does it need explicit `OpenAI(base_url=...)` client configuration? How to set a specific model name?

5. **Async vs sync**: Is `Runner.run()` async? How to call it from a sync FastAPI endpoint (or should the endpoint be async)?

6. **Response format**: What does `Runner.run()` return? How to extract the final text response from the result?

7. **Error handling**: What exceptions can Runner.run() raise? Timeouts?

Search the web for "openai agents sdk python MCPServerStdio" and "openai agents sdk Runner.run example 2025 2026" to get the latest documentation and examples. Also check https://openai.github.io/openai-agents-python/ if possible.

## Response snapshot

Comprehensive research delivered covering all 7 topics. Key findings: package is `openai-agents` (v0.8.1), imports from `agents` module, Runner.run() is async, MCPServerStdio uses async context manager, conversation history via to_input_list() or SQLiteSession, OpenRouter requires set_default_openai_api("chat_completions") + set_tracing_disabled(True) + AsyncOpenAI(base_url=...).

## Outcome

- Impact: Research complete; enables implementation of AI chatbot with MCP tool integration
- Tests: N/A (research task)
- Files: N/A (no code files modified)
- Next prompts: Implement chatbot using findings; wire up MCPServerStdio to existing MCP server
- Reflection: SDK is well-documented; OpenRouter integration requires specific configuration steps

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): N/A
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
