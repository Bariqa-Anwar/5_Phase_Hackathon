"use client";

import {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskListResponse,
} from "@/types/task";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Cache the JWT to avoid calling the token bridge on every request
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Get a signed JWT from the auth token bridge.
 *
 * Better Auth issues opaque session tokens (not JWTs), but the FastAPI
 * backend expects a HS256-signed JWT with a "sub" claim. The token bridge
 * at /api/auth/token reads the Better Auth session (via cookies) and
 * mints a proper JWT.
 *
 * Results are cached for 55 minutes (token TTL is 1 hour).
 *
 * @throws Error if not authenticated or bridge fails
 */
async function getAuthHeader(): Promise<string> {
  const now = Date.now();

  // Return cached token if still valid (5-minute buffer before expiry)
  if (cachedToken && tokenExpiresAt > now) {
    return `Bearer ${cachedToken}`;
  }

  const res = await fetch("/api/auth/token", { credentials: "include" });

  if (!res.ok) {
    cachedToken = null;
    tokenExpiresAt = 0;
    if (res.status === 401) {
      throw new Error("No active session");
    }
    throw new Error("Failed to get auth token");
  }

  const { token } = await res.json();
  cachedToken = token;
  tokenExpiresAt = now + 55 * 60 * 1000; // Cache for 55 minutes
  return `Bearer ${token}`;
}

/**
 * Clear the cached JWT (call on logout)
 */
export function clearTokenCache() {
  cachedToken = null;
  tokenExpiresAt = 0;
}

/**
 * Centralized API client for backend integration
 * All requests automatically include JWT authorization header
 */
export const api = {
  tasks: {
    /**
     * List all tasks for the current user
     * @param page - Page number (default: 1)
     * @param pageSize - Items per page (default: 100)
     */
    list: async (
      page: number = 1,
      pageSize: number = 100
    ): Promise<TaskListResponse> => {
      const offset = (page - 1) * pageSize;
      const res = await fetch(
        `${API_BASE_URL}/api/tasks?offset=${offset}&limit=${pageSize}`,
        {
          headers: {
            Authorization: await getAuthHeader(),
          },
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to fetch tasks: ${res.status}`);
      }

      const data = await res.json();
      return {
        tasks: data,
        total: data.length, // Backend doesn't return total count yet
        page,
        page_size: pageSize,
      };
    },

    /**
     * Create a new task
     * @param data - Task creation data (title, description, status)
     */
    create: async (data: CreateTaskRequest): Promise<Task> => {
      const res = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: await getAuthHeader(),
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to create task: ${res.status}`);
      }

      return res.json();
    },

    /**
     * Update an existing task
     * @param id - Task ID
     * @param data - Partial task data to update
     */
    update: async (id: number, data: UpdateTaskRequest): Promise<Task> => {
      const res = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: await getAuthHeader(),
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to update task: ${res.status}`);
      }

      return res.json();
    },

    /**
     * Delete a task
     * @param id - Task ID
     */
    delete: async (id: number): Promise<void> => {
      const res = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: await getAuthHeader(),
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to delete task: ${res.status}`);
      }
    },

    /**
     * Get a single task by ID
     * @param id - Task ID
     */
    get: async (id: number): Promise<Task> => {
      const res = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
        headers: {
          Authorization: await getAuthHeader(),
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to fetch task: ${res.status}`);
      }

      return res.json();
    },
  },
};
