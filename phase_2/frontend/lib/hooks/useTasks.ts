"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api-client";
import { Task, TaskStatus, CreateTaskRequest, UpdateTaskRequest } from "@/types/task";

interface UseTasksReturn {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createTask: (data: CreateTaskRequest) => Promise<Task>;
  updateTask: (id: number, data: UpdateTaskRequest) => Promise<Task>;
  deleteTask: (id: number) => Promise<void>;
  filterByStatus: (status: TaskStatus | "all") => void;
  activeFilter: TaskStatus | "all";
  filteredTasks: Task[];
}

export function useTasks(): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<TaskStatus | "all">("all");

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.tasks.list();
      setTasks(response.tasks);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch tasks";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = useCallback(
    async (data: CreateTaskRequest): Promise<Task> => {
      const newTask = await api.tasks.create(data);
      await fetchTasks();
      return newTask;
    },
    [fetchTasks]
  );

  const updateTask = useCallback(
    async (id: number, data: UpdateTaskRequest): Promise<Task> => {
      const updated = await api.tasks.update(id, data);
      await fetchTasks();
      return updated;
    },
    [fetchTasks]
  );

  const deleteTask = useCallback(
    async (id: number): Promise<void> => {
      await api.tasks.delete(id);
      await fetchTasks();
    },
    [fetchTasks]
  );

  const filterByStatus = useCallback((status: TaskStatus | "all") => {
    setActiveFilter(status);
  }, []);

  const filteredTasks =
    activeFilter === "all"
      ? tasks
      : tasks.filter((task) => task.status === activeFilter);

  return {
    tasks,
    isLoading,
    error,
    refetch: fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    filterByStatus,
    activeFilter,
    filteredTasks,
  };
}
