/**
 * Task-related type definitions
 * Aligned with backend API from Feature 001
 */

export enum TaskStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed"
}

export interface Task {
  id: number;                    // Unique task identifier
  title: string;                 // Task title (max 200 chars)
  description: string | null;    // Optional description (max 2000 chars)
  status: TaskStatus;            // Current task status
  user_id: string;               // Owner user ID (for isolation)
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
}

// Display-oriented interface for UI components
export interface TaskDisplay extends Task {
  isOptimistic?: boolean;        // True if optimistically added (not yet confirmed by backend)
  isPending?: boolean;           // True if operation in progress
}

// Form types for task operations
export interface CreateTaskFormData {
  title: string;
  description?: string;
  status?: TaskStatus;           // Optional, defaults to PENDING
}

export interface UpdateTaskFormData {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
}

// API request/response types
export interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: TaskStatus;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
  page: number;
  page_size: number;
}

// Validation constraints
export const TASK_CONSTRAINTS = {
  TITLE_MAX_LENGTH: 200,
  TITLE_MIN_LENGTH: 1,
  DESCRIPTION_MAX_LENGTH: 2000,
} as const;
