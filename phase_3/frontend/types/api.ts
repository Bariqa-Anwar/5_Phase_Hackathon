/**
 * API-related type definitions
 * Generic types for HTTP requests, responses, and error handling
 */

export interface ApiError {
  code: string;
  message: string;
  field?: string;        // Field that caused validation error
  details?: unknown;     // Additional error context
}

export interface ApiResponse<T> {
  data: T;
  error?: ApiError;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  page_size?: number;
  skip?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
  has_prev: boolean;
}

// HTTP error responses from backend
export interface ValidationError {
  loc: string[];         // Location of error (e.g., ["body", "email"])
  msg: string;           // Error message
  type: string;          // Error type (e.g., "value_error.email")
}

export interface HTTPValidationError {
  detail: ValidationError[];
}

export interface HTTPError {
  detail: string;
}

// API client configuration
export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  withCredentials?: boolean;
}

// Request options
export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}
