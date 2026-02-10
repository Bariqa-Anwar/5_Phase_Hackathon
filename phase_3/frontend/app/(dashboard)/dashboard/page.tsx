"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTasks } from "@/lib/hooks/useTasks";
import { useToast } from "@/lib/hooks/useToast";
import TaskList from "@/components/dashboard/TaskList";
import TaskFilters from "@/components/dashboard/TaskFilters";
import CreateTaskDialog from "@/components/dashboard/CreateTaskDialog";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Toast, { ToastContainer } from "@/components/ui/Toast";
import { AlertCircle, ListTodo, Plus, RefreshCw } from "lucide-react";
import { CreateTaskRequest, UpdateTaskRequest } from "@/types/task";

export default function DashboardPage() {
  const { user } = useAuth();
  const {
    filteredTasks,
    isLoading,
    error,
    refetch,
    createTask,
    updateTask,
    deleteTask,
    filterByStatus,
    activeFilter,
  } = useTasks();
  const { toasts, toast, removeToast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreateTask = useCallback(
    async (data: CreateTaskRequest) => {
      await createTask(data);
      setIsDialogOpen(false);
      toast.success("Task created successfully");
    },
    [createTask, toast]
  );

  const handleUpdateTask = useCallback(
    async (id: number, data: UpdateTaskRequest) => {
      try {
        await updateTask(id, data);
        toast.success("Task updated");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to update task"
        );
      }
    },
    [updateTask, toast]
  );

  const handleDeleteTask = useCallback(
    async (id: number) => {
      try {
        await deleteTask(id);
        toast.success("Task deleted");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to delete task"
        );
      }
    },
    [deleteTask, toast]
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Dashboard</h1>
          <p className="text-sm text-slate-400">
            Welcome back, {user?.name || user?.email || "User"}
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Filters */}
      <TaskFilters activeFilter={activeFilter} onFilterChange={filterByStatus} />

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <AlertCircle className="h-12 w-12 text-red-400" />
          <div>
            <p className="text-lg font-medium text-slate-100">
              Failed to load tasks
            </p>
            <p className="mt-1 text-sm text-slate-400">{error}</p>
          </div>
          <Button variant="outline" onClick={refetch}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && filteredTasks.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800">
            <ListTodo className="h-8 w-8 text-slate-500" />
          </div>
          <div>
            <p className="text-lg font-medium text-slate-100">No tasks yet</p>
            <p className="mt-1 text-sm text-slate-400">
              {activeFilter === "all"
                ? "Create your first task to get started."
                : `No ${activeFilter.replace("_", " ")} tasks found.`}
            </p>
          </div>
          {activeFilter === "all" && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Create your first task
            </Button>
          )}
        </div>
      )}

      {/* Task list */}
      {!isLoading && !error && filteredTasks.length > 0 && (
        <TaskList
          tasks={filteredTasks}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
        />
      )}

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleCreateTask}
      />

      {/* Toast notifications */}
      <ToastContainer>
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onClose={removeToast} />
        ))}
      </ToastContainer>
    </div>
  );
}
