# Quickstart: Frontend ChatKit Backend Integration

**Feature**: 005-frontend-chatkit-integration
**Date**: 2026-02-08

## Prerequisites

1. Backend is running at `http://localhost:8000` with the chat endpoint active
2. Frontend is running at `http://localhost:3000`
3. A user account exists in Better Auth (sign up via the frontend)

## Environment Setup

### Frontend (`frontend/.env.local`)

No new environment variables are needed. The existing config is sufficient:

```env
# Already in .env.local — no changes required
NEXT_PUBLIC_API_URL=http://localhost:8000
BETTER_AUTH_SECRET=<your-secret>
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=<your-neon-connection-string>
```

### Backend (`backend/.env`)

No changes required. The backend chat endpoint is already configured:

```env
# Already in backend/.env — no changes required
OPENROUTER_API_KEY=<your-key>
OPENROUTER_MODEL=google/gemini-2.0-flash-001
DATABASE_URL=<your-neon-connection-string>
BETTER_AUTH_SECRET=<your-secret>
```

## Running Locally

1. Start the backend:
   ```bash
   cd backend
   uv run uvicorn main:app --reload
   ```

2. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Open `http://localhost:3000` in your browser
4. Log in with your credentials
5. Click "Chat" in the sidebar navigation
6. Type a message (e.g., "Add a task called 'Buy groceries'") and send

## Verification Checklist

- [ ] Chat page loads at `/chat` within the dashboard layout
- [ ] Sidebar shows "Chat" navigation item
- [ ] Typing a message and pressing send shows the message in the thread
- [ ] Assistant response appears within 10 seconds
- [ ] Sending a follow-up message maintains conversation context
- [ ] Tool actions (e.g., task creation) show visual indicators
- [ ] Error states display friendly messages
- [ ] Empty message submission is blocked
- [ ] "New Chat" button resets the conversation

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| "Failed to send message" | Backend not running | Start backend with `uv run uvicorn main:app --reload` |
| Chat page 404 | Route not created | Verify `app/(dashboard)/chat/page.tsx` exists |
| No response from assistant | OpenRouter API key missing | Check `OPENROUTER_API_KEY` in `backend/.env` |
| CORS errors in console | Origin mismatch | Verify `NEXT_PUBLIC_API_URL` matches backend URL |
| User ID undefined | Not logged in | Log in via the auth flow first |
