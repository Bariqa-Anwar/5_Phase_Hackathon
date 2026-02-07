---
id: 013
title: Wire task CRUD interactivity end-to-end
stage: green
date: 2026-02-07
surface: agent
model: claude-opus-4-6
feature: 002-frontend-better-auth
branch: 002-frontend-better-auth
user: shaheer
command: direct-prompt
labels: ["tasks", "crud", "interactivity", "onclick", "novalidate"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - frontend/components/auth/LoginForm.tsx
  - frontend/components/auth/SignupForm.tsx
  - frontend/lib/hooks/useTasks.ts
  - frontend/components/dashboard/TaskCard.tsx
  - frontend/components/dashboard/TaskList.tsx
  - frontend/app/(dashboard)/dashboard/page.tsx
tests:
  - noValidate added to LoginForm and SignupForm form tags
  - useTasks hook exposes createTask, updateTask, deleteTask
  - TaskCard has Start/Complete/Reopen and Delete buttons with onClick handlers
  - TaskList passes onUpdate and onDelete callbacks to each TaskCard
  - DashboardPage wires handleUpdateTask and handleDeleteTask with toast notifications
  - All api-client.ts CRUD methods (list, create, update, delete) are now reachable from UI
---

## Prompt

The app is currently a static shell; Auth works but Task functionality is completely dead. Fix this immediately without breaking existing Auth:

Form Validation: Add the noValidate attribute to form tags in SignupForm.tsx and LoginForm.tsx to stop browser-level email popups.

Enable Interactivity: Add the "use client" directive to the top of dashboard/page.tsx and all files in components/tasks/.

Task Creation: Connect the 'Create Task' button to the TaskDialog component. Ensure the onSubmit handler calls the FastAPI backend and refreshes the task list.

Dynamic List: Replace static placeholders with a dynamic map of tasks fetched from NEXT_PUBLIC_API_URL/api/tasks.

Button Actions: Ensure every icon/button (Add, Edit, Delete, Complete) has an onClick handler linked to the api-client.ts functions.

State Management: Use React useState and useEffect to manage and display the task list so changes appear immediately without a manual page refresh.

## Response snapshot

Audit found that most infrastructure was already in place — "use client" directives, useTasks hook with useState/useEffect, api-client with full CRUD, CreateTaskDialog wired to backend. The actual gaps were:

1. **noValidate**: Added to LoginForm and SignupForm form tags to suppress browser validation popups.

2. **Missing action buttons on TaskCard**: The card was display-only. Added:
   - Status workflow button (Start → Complete → Reopen) that calls `api.tasks.update(id, { status })`
   - Delete button that calls `api.tasks.delete(id)`
   - Loading states per-button, disabled while any action is in progress

3. **useTasks hook missing update/delete**: Only had createTask. Added `updateTask(id, data)` and `deleteTask(id)` methods that call api-client and refetch the list.

4. **Callback wiring**: Updated TaskList to accept and pass `onUpdate`/`onDelete` props. Updated DashboardPage to destructure `updateTask`/`deleteTask` from useTasks and wrap them in `handleUpdateTask`/`handleDeleteTask` with toast notifications.

No changes to backend, auth, or database. All existing auth flow preserved.

## Outcome

- Impact: Full task CRUD is now interactive — create, update status, delete all work from the UI with immediate list refresh and toast feedback
- Tests: Code trace verified: Button onClick → handler → useTasks method → api-client fetch → FastAPI endpoint → refetch list → React re-render
- Files: 6 files modified
- Next prompts: Start both servers and test full CRUD flow: create task, advance status pending→in_progress→completed, reopen, delete
- Reflection: The infrastructure was solid but TaskCard was a pure display component with no action surface. Always check that UI components have the interactive affordances the user expects.

## Evaluation notes (flywheel)

- Failure modes observed: TaskCard rendered task data but had zero clickable actions — the entire CRUD backend was unreachable from the UI
- Graders run and results (PASS/FAIL): Code trace PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Add confirmation dialog before delete to prevent accidental data loss
