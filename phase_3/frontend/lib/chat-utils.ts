import { ToolCallAction } from "@/types/chat";

/**
 * Parse known tool-call action patterns from the assistant's response text.
 * Returns an array of detected actions for visual display as chips/badges.
 *
 * Detection is best-effort using keyword matching. Can be upgraded to
 * structured metadata when the backend adds a tool_calls field.
 */
export function parseToolCalls(text: string): ToolCallAction[] {
  const lower = text.toLowerCase();
  const actions: ToolCallAction[] = [];

  // Task created / added
  if (
    (lower.includes("created") && lower.includes("task")) ||
    (lower.includes("added") && lower.includes("task"))
  ) {
    actions.push({ action: "task_created", label: "Task Created" });
  }

  // Tasks listed
  if (
    lower.includes("here are") ||
    lower.includes("your tasks") ||
    /tasks\s*:/i.test(text)
  ) {
    actions.push({ action: "tasks_listed", label: "Tasks Listed" });
  }

  // Task completed
  if (
    (lower.includes("completed") && lower.includes("task")) ||
    (lower.includes("marked") && lower.includes("complete"))
  ) {
    actions.push({ action: "task_completed", label: "Task Completed" });
  }

  // Task deleted / removed
  if (
    (lower.includes("deleted") && lower.includes("task")) ||
    (lower.includes("removed") && lower.includes("task"))
  ) {
    actions.push({ action: "task_deleted", label: "Task Deleted" });
  }

  // Task updated / changed
  if (
    (lower.includes("updated") && lower.includes("task")) ||
    (lower.includes("changed") && lower.includes("task"))
  ) {
    actions.push({ action: "task_updated", label: "Task Updated" });
  }

  return actions;
}
