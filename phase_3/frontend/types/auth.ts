/**
 * Authentication-related type definitions
 * Aligned with Better Auth and backend JWT structure
 */

export interface User {
  id: string;              // Unique user identifier (matches JWT "sub" claim)
  email: string;           // User's email address
  name?: string;           // Optional display name
  emailVerified: boolean;  // Email verification status
  createdAt: Date;        // Account creation timestamp
  updatedAt: Date;        // Last profile update timestamp
}

export interface Session {
  user: User;              // User information
  accessToken: string;     // JWT access token (short-lived: 15-60 min)
  refreshToken?: string;   // JWT refresh token (long-lived: 7-14 days)
  expiresAt: Date;        // Access token expiration timestamp
  issuedAt: Date;         // Token issue timestamp
}

export interface AuthState {
  session: Session | null; // Current session or null if unauthenticated
  isLoading: boolean;     // Loading state during auth operations
  error: string | null;   // Error message from failed auth operations
}

// Form types for authentication
export interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Auth API responses
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;  // ISO timestamp
}

export interface AuthError {
  code: string;
  message: string;
  field?: string;  // Field that caused the error (for validation)
}
