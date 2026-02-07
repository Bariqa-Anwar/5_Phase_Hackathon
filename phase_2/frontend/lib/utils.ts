/**
 * Validation utilities for forms and user input
 */

/**
 * Validate email format using standard regex
 * @param email - Email address to validate
 * @returns true if valid email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * Requirements: minimum 8 characters
 * @param password - Password to validate
 * @returns true if password meets requirements
 */
export function validatePassword(password: string): boolean {
  return password.length >= 8;
}

/**
 * Validate task title
 * Requirements: 1-200 characters, not empty
 * @param title - Task title to validate
 * @returns true if title is valid
 */
export function validateTaskTitle(title: string): boolean {
  const trimmed = title.trim();
  return trimmed.length > 0 && trimmed.length <= 200;
}

/**
 * Format date to human-readable string
 * @param date - Date to format (ISO string or Date object)
 * @returns Formatted date string (e.g., "Jan 15, 2026")
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format datetime to human-readable string with time
 * @param date - Date to format (ISO string or Date object)
 * @returns Formatted datetime string (e.g., "Jan 15, 2026 at 3:45 PM")
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Truncate text to specified length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}
