# Better Auth Integration Research for Next.js 16 Frontend with FastAPI Backend

**Feature**: 002-frontend-better-auth
**Created**: 2026-02-05
**Status**: Research Complete

---

## Executive Summary

This research document provides comprehensive guidance for integrating Better Auth with a Next.js 16 App Router frontend that communicates with a FastAPI backend using JWT tokens. The research covers Better Auth setup, JWT token management, storage strategies, session persistence, and best practices for production-ready authentication.

**Key Recommendation**: Use Better Auth with HttpOnly cookies for JWT storage, implement automatic token refresh with interceptor patterns, and leverage Next.js 16's proxy (formerly middleware) for route protection.

---

## 1. Better Auth Setup and Configuration for Next.js 16

### 1.1 Installation

```bash
npm install better-auth
npm install better-auth-react  # For React hooks and client utilities
```

### 1.2 Core Configuration

Better Auth is fully compatible with Next.js 16. The main architectural change is that "middleware" is now called "proxy" in Next.js 16.

#### Backend Configuration (`lib/auth.ts`)

```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql" // or your database type
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  secret: process.env.BETTER_AUTH_SECRET, // Shared secret with FastAPI
});
```

#### API Route Setup (`app/api/auth/[...all]/route.ts`)

For Next.js App Router, create the Better Auth handler:

```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

#### Client Configuration (`lib/auth-client.ts`)

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});
```

#### Provider Setup (`app/providers.tsx`)

```typescript
"use client";

import { SessionProvider } from "better-auth/react";
import { useRouter } from "next/navigation";

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <SessionProvider
      onSessionChange={() => {
        // CRITICAL: Force Next.js to clear router cache and reload middleware
        router.refresh();
      }}
    >
      {children}
    </SessionProvider>
  );
}
```

### 1.3 Next.js 16 Proxy Configuration (Middleware)

Next.js 16 replaces "middleware" with "proxy". The Node.js runtime is now stable for full session validation.

**middleware.ts (Proxy Configuration)**

```typescript
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  // Redirect unauthenticated users to login
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/tasks/:path*"],
};
```

**Best Practice Note**: Better Auth recommends handling auth checks in each page/route for optimal security rather than relying solely on middleware for an optimistic redirect approach.

---

## 2. JWT Token Generation and Management

### 2.1 Better Auth JWT Plugin

Better Auth offers a dedicated JWT plugin for token generation and verification. This is essential for backend integration with FastAPI.

#### Installation and Configuration

```typescript
import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";

export const auth = betterAuth({
  // ... other config
  plugins: [
    jwt({
      // Default algorithm: EdDSA with Ed25519 curve
      algorithm: "EdDSA",

      // Private key encryption (recommended to keep enabled)
      disablePrivateKeyEncryption: false,

      // Key rotation interval (optional)
      rotationInterval: "7d", // Rotate keys every 7 days
    }),
  ],
});
```

### 2.2 JWT Token Structure

Better Auth generates JWT tokens with standard claims:

```json
{
  "sub": "user-id-123",           // Subject (user identifier)
  "iat": 1738742400,              // Issued at timestamp
  "exp": 1738828800,              // Expiration timestamp
  "email": "user@example.com",    // User email
  "name": "John Doe"              // User name
}
```

### 2.3 Shared Secret Configuration

For FastAPI backend verification, both systems must use the same secret:

**Frontend (.env)**
```
BETTER_AUTH_SECRET=tJVIyE6s7rHapXEHlYDtkT6sP57Tqfvk
```

**Backend (.env)**
```
BETTER_AUTH_SECRET=tJVIyE6s7rHapXEHlYDtkT6sP57Tqfvk
```

**Important**: The secret should be at least 32 characters and randomly generated. Use a strong, cryptographically secure random string.

### 2.4 JWKS Endpoint for Public Key Verification

Better Auth provides a JWKS (JSON Web Key Set) endpoint for public key distribution:

```
GET /api/auth/jwks
```

The public key can be cached indefinitely since it doesn't change frequently. This allows FastAPI to verify tokens without storing sensitive private keys.

---

## 3. JWT Token Storage Strategy

### 3.1 Storage Options Comparison

| Storage Method | XSS Vulnerable | CSRF Vulnerable | Server-Side Accessible | Best For |
|---------------|----------------|-----------------|------------------------|----------|
| localStorage | ✅ Yes | ❌ No | ❌ No | Simple SPAs (not recommended) |
| sessionStorage | ✅ Yes | ❌ No | ❌ No | Tab-scoped sessions (not recommended) |
| HttpOnly Cookie | ❌ No | ✅ Yes (mitigated with SameSite) | ✅ Yes | **Production apps (recommended)** |
| Memory (React State) | ⚠️ Limited | ❌ No | ❌ No | Short-lived access tokens |

### 3.2 Recommended Strategy: HttpOnly Cookies with Hybrid Approach

**Why HttpOnly Cookies Are Superior**:

1. **XSS Protection**: HttpOnly cookies cannot be accessed by JavaScript, preventing attackers from stealing tokens via XSS attacks
2. **Automatic Transmission**: Cookies are sent automatically with every request
3. **CSRF Mitigation**: SameSite attribute prevents cross-site request forgery
4. **Third-Party Script Protection**: Browser extensions and third-party scripts cannot access HttpOnly cookies

**Security Configuration**:

```typescript
// Server-side cookie configuration
{
  httpOnly: true,        // Prevents JavaScript access
  secure: true,          // HTTPS only (production)
  sameSite: "strict",    // Prevents CSRF attacks
  maxAge: 60 * 60 * 24,  // 24 hours
  path: "/",
}
```

### 3.3 Hybrid Approach (Best Practice)

Store different token types in different locations:

1. **Access Token** (short-lived, 15-60 minutes): Store in **memory** (React Context/State)
2. **Refresh Token** (long-lived, 7-14 days): Store in **HttpOnly cookie**

**Implementation**:

```typescript
// Auth context for access token in memory
"use client";

import { createContext, useContext, useState } from "react";

type AuthContextType = {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);

  return (
    <AuthContext.Provider value={{ accessToken, setAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
```

### 3.4 Storage Strategy Rationale

**Why NOT localStorage**:
- ✗ Vulnerable to XSS attacks (any injected JavaScript can read tokens)
- ✗ Accessible to third-party scripts and browser extensions
- ✗ Tokens persist across browser sessions, increasing exposure window
- ✗ No automatic expiration mechanism

**Why HttpOnly Cookies**:
- ✓ Immune to XSS attacks (JavaScript cannot read)
- ✓ SameSite protection prevents CSRF attacks
- ✓ Automatic transmission with every request
- ✓ Server-controlled expiration and security attributes
- ✓ Industry best practice for production applications

---

## 4. Token Expiration and Refresh Patterns

### 4.1 Standard Token Lifetimes

**Recommended Configuration**:
- **Access Token**: 15-60 minutes (short-lived)
- **Refresh Token**: 7-14 days (long-lived, single-use with rotation)

### 4.2 Token Refresh Implementation

#### Centralized Token Management with Request Queue

This prevents race conditions when multiple requests fail simultaneously:

```typescript
// lib/api-client.ts
import axios from "axios";
import { authClient } from "./auth-client";

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  // Prevent multiple simultaneous refresh requests
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await authClient.refresh();
      return response.accessToken;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
});

// Request interceptor: Add JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = /* get from context or cookie */;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh token expired or invalid - redirect to login
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

### 4.3 Proactive Token Refresh

Track token expiration and refresh before it expires:

```typescript
import { useEffect } from "react";
import { authClient } from "./auth-client";

export function useTokenRefresh() {
  useEffect(() => {
    const session = authClient.getSession();
    if (!session) return;

    const expiresAt = session.expiresAt;
    const refreshBefore = 60 * 1000; // Refresh 1 minute before expiry
    const timeUntilRefresh = expiresAt - Date.now() - refreshBefore;

    if (timeUntilRefresh > 0) {
      const timer = setTimeout(() => {
        authClient.refresh();
      }, timeUntilRefresh);

      return () => clearTimeout(timer);
    }
  }, []);
}
```

### 4.4 Token Rotation for Enhanced Security

Implement refresh token rotation (single-use tokens):

```typescript
// Better Auth configuration with token rotation
export const auth = betterAuth({
  // ... other config
  session: {
    refreshTokenRotation: {
      enabled: true,
      // Invalidate old refresh token after use
      revokeOldToken: true,
    },
  },
});
```

**Benefits of Token Rotation**:
- Each refresh generates a new refresh token
- Old refresh tokens are immediately invalidated
- Reduces window of exposure if a token is compromised
- Detects token theft (reuse of old token triggers security alert)

---

## 5. Signup and Login Page Implementation

### 5.1 Signup Page

**File**: `app/(auth)/signup/page.tsx`

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time validation
  const passwordStrength = password.length >= 8;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordsMatch = password === confirmPassword && confirmPassword !== "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validation
    if (!emailValid) {
      setError("Please enter a valid email address");
      return;
    }
    if (!passwordStrength) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await authClient.signUp.email({
        email,
        password,
        name: email.split("@")[0], // Optional: derive name from email
      });

      // Automatically sign in after signup
      await authClient.signIn.email({
        email,
        password,
      });

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign up to get started with task management
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="mt-1"
              />
              {email && !emailValid && (
                <p className="mt-1 text-sm text-red-600">Invalid email format</p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                required
                className="mt-1"
              />
              {password && !passwordStrength && (
                <p className="mt-1 text-sm text-red-600">
                  Password must be at least 8 characters
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                className="mt-1"
              />
              {confirmPassword && !passwordsMatch && (
                <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || !emailValid || !passwordStrength || !passwordsMatch}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Sign up"
            )}
          </Button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
```

### 5.2 Login Page

**File**: `app/(auth)/login/page.tsx`

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await authClient.signIn.email({
        email,
        password,
      });

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      // Generic error message to prevent email enumeration
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Welcome back! Please enter your credentials
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="mt-1"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>

          <p className="text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <a href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
              Sign up
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
```

### 5.3 Form Validation Best Practices

1. **Real-time Validation**: Show validation errors as users type
2. **Clear Error Messages**: Use specific, actionable error messages
3. **Prevent Email Enumeration**: Use generic error messages on login (don't reveal if email exists)
4. **Disable Submit on Invalid**: Prevent form submission until validation passes
5. **Loading States**: Show spinners and disable buttons during async operations
6. **Keyboard Accessibility**: Ensure all form elements are keyboard navigable
7. **Auto-complete Support**: Use proper `autocomplete` attributes for browser password managers

---

## 6. Protected Route Patterns in Next.js 16 App Router

### 6.1 Server Component Protection

**File**: `app/dashboard/page.tsx`

```typescript
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      <h1>Welcome, {session.user.name}!</h1>
      {/* Dashboard content */}
    </div>
  );
}
```

### 6.2 Client Component Protection with Hook

**File**: `hooks/use-require-auth.ts`

```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function useRequireAuth() {
  const router = useRouter();
  const session = authClient.useSession();

  useEffect(() => {
    if (!session.data) {
      router.push("/login");
    }
  }, [session.data, router]);

  return session;
}
```

**Usage**:

```typescript
"use client";

import { useRequireAuth } from "@/hooks/use-require-auth";

export default function ProtectedPage() {
  const session = useRequireAuth();

  if (!session.data) {
    return <div>Loading...</div>;
  }

  return <div>Protected content for {session.data.user.email}</div>;
}
```

### 6.3 Layout-Level Protection

**File**: `app/dashboard/layout.tsx`

```typescript
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-900 text-white">
        {/* Sidebar navigation */}
      </aside>
      <main className="flex-1 bg-gray-50">{children}</main>
    </div>
  );
}
```

### 6.4 Middleware (Proxy) Protection (Next.js 16)

**File**: `middleware.ts`

```typescript
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const isAuthPage = request.nextUrl.pathname.startsWith("/login") ||
                     request.nextUrl.pathname.startsWith("/signup");

  // Redirect authenticated users away from auth pages
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users to login
  if (!session && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tasks/:path*",
    "/login",
    "/signup",
  ],
};
```

### 6.5 Cookie-Based Fast Checks (Lower Security, Better Performance)

For faster but less secure checks (no database validation):

```typescript
import { getSessionCookie } from "better-auth/next-js";

export async function middleware(request: NextRequest) {
  const session = getSessionCookie({
    // Must match your auth.ts config
    cookieName: "session",
    prefix: "better-auth",
  });

  // ... protection logic
}
```

**Note**: `getSessionCookie()` does not validate against the database, so compromised cookies won't be detected until database validation occurs.

---

## 7. Session Persistence Across Browser Refresh

### 7.1 Cookie-Based Persistence (Recommended)

Better Auth uses cookies by default, which automatically persist across browser refreshes:

**Configuration**:

```typescript
export const auth = betterAuth({
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24, // 24 hours
      strategy: "jwt", // or "jwe" for encrypted
      refreshCache: false, // Set to true for automatic refresh
    },
  },
});
```

### 7.2 Next.js Cookie Plugin (Automatic Cookie Sync)

Use the `nextCookies` plugin to automatically sync cookies:

```typescript
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  plugins: [nextCookies()],
  // ... other config
});
```

**Benefits**:
- Automatically sets cookies when `Set-Cookie` header is present
- Works with Server Actions and Route Handlers
- Ensures cookie state is always synchronized

### 7.3 Client-Side Session Persistence

Better Auth client uses nano-store for reactive state management:

```typescript
import { authClient } from "@/lib/auth-client";

// Get current session (persisted in cookies)
const session = authClient.getSession();

// Subscribe to session changes
authClient.onSessionChange((session) => {
  console.log("Session updated:", session);
});
```

### 7.4 Handling Session Refresh

Ensure session state is refreshed when returning to the app:

```typescript
"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";

export function SessionRefresh() {
  useEffect(() => {
    // Refresh session on mount
    authClient.refresh().catch(() => {
      // Handle refresh failure (token expired)
    });

    // Refresh session when window regains focus
    const handleFocus = () => {
      authClient.refresh().catch(() => {});
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  return null;
}
```

### 7.5 Common Persistence Issues

**Issue**: Session disappears on page refresh
**Solution**: Ensure `BETTER_AUTH_SECRET` is set in production environment variables

**Issue**: Session not syncing across tabs
**Solution**: Use `nextCookies` plugin and ensure `router.refresh()` is called in `onSessionChange`

**Issue**: Session expires too quickly
**Solution**: Increase `cookieCache.maxAge` and implement token refresh

---

## 8. Error Handling Best Practices

### 8.1 Error Types and Responses

| HTTP Status | Error Type | Meaning | Client Action |
|-------------|------------|---------|---------------|
| 401 | Unauthorized | Token expired or invalid | Refresh token or redirect to login |
| 403 | Forbidden | Valid token but insufficient permissions | Show permission denied message |
| 404 | Not Found | Resource doesn't exist | Show not found message |
| 422 | Unprocessable Entity | Validation error | Display validation errors inline |
| 429 | Too Many Requests | Rate limit exceeded | Show rate limit message with retry timer |
| 500 | Internal Server Error | Backend error | Show generic error, log for debugging |

### 8.2 Centralized Error Handler

```typescript
// lib/error-handler.ts
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function handleApiError(error: any): never {
  if (error.response) {
    const { status, data } = error.response;

    switch (status) {
      case 401:
        throw new ApiError(401, "Your session has expired. Please sign in again.");
      case 403:
        throw new ApiError(403, "You don't have permission to perform this action.");
      case 404:
        throw new ApiError(404, "The requested resource was not found.");
      case 422:
        throw new ApiError(422, "Validation failed", data.errors);
      case 429:
        throw new ApiError(429, "Too many requests. Please try again later.");
      default:
        throw new ApiError(status, data.message || "An unexpected error occurred.");
    }
  }

  // Network error (no response)
  if (error.request) {
    throw new ApiError(0, "Network error. Please check your internet connection.");
  }

  // Unknown error
  throw new ApiError(0, "An unexpected error occurred.");
}
```

### 8.3 Error Display Component

```typescript
// components/error-alert.tsx
"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Wifi, Lock, FileQuestion } from "lucide-react";

type ErrorAlertProps = {
  error: Error | null;
  onRetry?: () => void;
};

export function ErrorAlert({ error, onRetry }: ErrorAlertProps) {
  if (!error) return null;

  const getErrorIcon = (status: number) => {
    switch (status) {
      case 0: return Wifi;
      case 401:
      case 403: return Lock;
      case 404: return FileQuestion;
      default: return AlertCircle;
    }
  };

  const status = (error as any).status || 0;
  const Icon = getErrorIcon(status);

  return (
    <Alert variant="destructive">
      <Icon className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{error.message}</span>
        {onRetry && status !== 401 && (
          <button
            onClick={onRetry}
            className="ml-4 text-sm underline hover:no-underline"
          >
            Retry
          </button>
        )}
      </AlertDescription>
    </Alert>
  );
}
```

### 8.4 Form Validation Error Display

```typescript
// components/form-error.tsx
type FormErrorProps = {
  errors: Record<string, string[]> | undefined;
  field: string;
};

export function FormError({ errors, field }: FormErrorProps) {
  if (!errors || !errors[field]) return null;

  return (
    <div className="mt-1 text-sm text-red-600">
      {errors[field].map((error, index) => (
        <p key={index}>{error}</p>
      ))}
    </div>
  );
}
```

### 8.5 Global Error Boundary

```typescript
// app/error.tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="max-w-md space-y-4 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h2 className="text-2xl font-bold">Something went wrong</h2>
        <p className="text-gray-600">
          We encountered an unexpected error. Please try again.
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
```

---

## 9. Alternative Authentication Solutions Considered

### 9.1 Comparison Matrix

| Feature | Better Auth | NextAuth (Auth.js v5) | Clerk | Supabase Auth |
|---------|-------------|----------------------|-------|---------------|
| **Self-Hosted** | ✅ Yes | ✅ Yes | ❌ No (SaaS only) | ⚠️ Partial (managed DB) |
| **Data Ownership** | ✅ Full | ✅ Full | ❌ Limited | ⚠️ Limited |
| **JWT Support** | ✅ Native | ✅ Native | ✅ Yes | ✅ Yes |
| **Plugin Architecture** | ✅ Excellent | ⚠️ Limited | ❌ No | ⚠️ Limited |
| **Setup Time** | ⚠️ 2-4 hours | ⚠️ 2-4 hours | ✅ 30 minutes | ⚠️ 1-2 hours |
| **Pre-built UI** | ❌ No | ⚠️ Basic | ✅ Excellent | ⚠️ Basic |
| **Pricing** | ✅ Free | ✅ Free | ❌ $25-$99+/month | ⚠️ Free tier limited |
| **FastAPI Integration** | ✅ Excellent | ✅ Good | ⚠️ Complex | ✅ Good |
| **Vendor Lock-in** | ✅ None | ✅ None | ❌ High | ⚠️ Moderate |
| **Custom Auth Flows** | ✅ Excellent | ✅ Good | ❌ Limited | ⚠️ Moderate |
| **Performance** | ✅ Fast | ✅ Fast | ✅ Very fast (12.5ms) | ✅ Fast |

### 9.2 Why Better Auth Was Chosen

**Primary Reasons**:

1. **Full Data Ownership**: All user data lives in your own database with complete control
2. **Plugin-First Architecture**: Core features like 2FA, magic links, passkeys are optional plugins, keeping the library lightweight
3. **FastAPI Integration**: Excellent support for JWT verification with shared secrets or JWKS endpoints
4. **No Vendor Lock-in**: Self-hosted solution with no external dependencies or subscription costs
5. **TypeScript-First**: Built with full type safety and seamless integration with modern TypeScript tooling
6. **Flexible Session Management**: Supports both JWT and database sessions with automatic token rotation
7. **Modern Database Support**: Native adapters for Prisma, Drizzle, Kysely with auto-generated schemas
8. **Cost-Effective**: Zero ongoing costs compared to Clerk ($25-$99+/month) or Supabase (paid tiers)

**Trade-offs Accepted**:

- ❌ No pre-built UI components (must build custom signup/login pages)
- ❌ Longer initial setup time (2-4 hours vs. Clerk's 30 minutes)
- ❌ No managed dashboard for user management (must build own admin tools)

### 9.3 When to Consider Alternatives

**Choose Clerk if**:
- You need extremely rapid development (production-ready in 30 minutes)
- Pre-built UI components and dashboard are essential
- Budget allows for $25-$99+/month subscription
- You don't need custom authentication flows

**Choose NextAuth (Auth.js) if**:
- You need OAuth providers (Google, GitHub, etc.) with minimal setup
- You want a mature, battle-tested solution with large community
- You prefer database-session approach over JWT
- You need extensive documentation and examples

**Choose Supabase Auth if**:
- You're already using Supabase for database and real-time features
- You want managed authentication with PostgreSQL backend
- You need row-level security (RLS) integration
- You're comfortable with moderate vendor lock-in

---

## 10. Recommended Implementation Approach

### 10.1 Phased Implementation Plan

#### Phase 1: Core Authentication Setup (2-3 hours)

1. Install Better Auth and dependencies
2. Configure Better Auth server instance with shared secret
3. Set up API route handler (`/api/auth/[...all]/route.ts`)
4. Configure Better Auth client and providers
5. Implement middleware (proxy) for route protection

**Acceptance**: Users can signup, login, and middleware redirects work

#### Phase 2: Auth Pages (2-3 hours)

1. Build signup page with form validation
2. Build login page with error handling
3. Implement loading states and visual feedback
4. Add keyboard navigation and accessibility
5. Test edge cases (invalid credentials, network failures)

**Acceptance**: Users can successfully create accounts and authenticate with clear feedback

#### Phase 3: API Client Integration (2-4 hours)

1. Create centralized API client with Axios
2. Implement request interceptor for JWT injection
3. Implement response interceptor for token refresh
4. Add error handling for all HTTP status codes
5. Test token expiration and automatic refresh flow

**Acceptance**: All API requests include JWT, expired tokens are automatically refreshed

#### Phase 4: Protected Routes (1-2 hours)

1. Implement server component protection pattern
2. Create `useRequireAuth` hook for client components
3. Test middleware protection on all protected routes
4. Verify session persistence across browser refreshes

**Acceptance**: Unauthenticated users cannot access protected routes, sessions persist correctly

#### Phase 5: Session Management (1-2 hours)

1. Implement logout functionality
2. Add session refresh on window focus
3. Configure cookie settings for production
4. Test session across multiple browser tabs
5. Verify token rotation and security features

**Acceptance**: Users can logout, sessions sync across tabs, tokens rotate correctly

### 10.2 Configuration Checklist

#### Environment Variables

**Frontend (.env.local)**:
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
BETTER_AUTH_SECRET=tJVIyE6s7rHapXEHlYDtkT6sP57Tqfvk
DATABASE_URL=postgresql://...
```

**Backend (.env)**:
```bash
BETTER_AUTH_SECRET=tJVIyE6s7rHapXEHlYDtkT6sP57Tqfvk
```

#### Security Settings

- ✅ Use HTTPS in production (`secure: true` for cookies)
- ✅ Set `SameSite=Strict` or `Lax` for CSRF protection
- ✅ Enable HttpOnly cookies for JWT storage
- ✅ Implement token rotation with single-use refresh tokens
- ✅ Set appropriate token expiration times (15-60 min access, 7-14 days refresh)
- ✅ Use strong, randomly generated 32+ character secret
- ✅ Implement rate limiting on auth endpoints
- ✅ Add CORS configuration to allow only frontend origin

#### Testing Checklist

- ✅ Signup with valid credentials
- ✅ Signup with invalid email format
- ✅ Signup with weak password (< 8 characters)
- ✅ Signup with mismatched passwords
- ✅ Login with valid credentials
- ✅ Login with invalid credentials
- ✅ Login with non-existent email
- ✅ Access protected route while unauthenticated
- ✅ Access protected route while authenticated
- ✅ Token refresh on expiration
- ✅ Token refresh failure (redirect to login)
- ✅ Session persistence across browser refresh
- ✅ Session sync across multiple tabs
- ✅ Logout and verify token cleared
- ✅ Network failure during authentication
- ✅ API error handling (401, 403, 404, 422, 500)

---

## 11. FastAPI Backend Integration

### 11.1 JWT Verification with Shared Secret

**FastAPI Configuration**:

```python
# backend/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    BETTER_AUTH_SECRET: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    class Config:
        env_file = ".env"

settings = Settings()
```

**JWT Verification Middleware**:

```python
# backend/core/security.py
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from datetime import datetime
from .config import settings

security = HTTPBearer()

async def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    """
    Verify JWT token from Better Auth.

    Raises:
        HTTPException: If token is invalid, expired, or missing required claims.

    Returns:
        dict: Decoded token payload with user information.
    """
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            settings.BETTER_AUTH_SECRET,
            algorithms=[settings.ALGORITHM]
        )

        # Verify expiration
        exp = payload.get("exp")
        if not exp or datetime.fromtimestamp(exp) < datetime.now():
            raise HTTPException(
                status_code=401,
                detail="Token has expired"
            )

        # Extract user ID from "sub" claim
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid token: missing user identifier"
            )

        return {
            "user_id": user_id,
            "email": payload.get("email"),
            "name": payload.get("name"),
        }

    except JWTError as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid token: {str(e)}"
        )
```

**Protected Endpoint Example**:

```python
# backend/api/tasks.py
from fastapi import APIRouter, Depends
from ..core.security import verify_token

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

@router.get("/")
async def get_tasks(current_user: dict = Depends(verify_token)):
    """
    Get all tasks for the authenticated user.

    The user_id is automatically extracted from the JWT token.
    """
    user_id = current_user["user_id"]
    # Fetch tasks from database for this user_id
    return {"tasks": [], "user_id": user_id}
```

### 11.2 Alternative: JWKS Endpoint Verification

For enhanced security with public/private key cryptography:

**Frontend Better Auth Configuration**:

```typescript
import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    jwt({
      algorithm: "EdDSA", // Ed25519 curve
      rotationInterval: "7d",
    }),
  ],
});
```

**FastAPI JWKS Verification**:

```python
# backend/core/jwks.py
import requests
from jose import jwt, jwk
from functools import lru_cache

@lru_cache(maxsize=1)
def get_jwks():
    """Fetch and cache JWKS from Better Auth endpoint."""
    response = requests.get("http://localhost:3000/api/auth/jwks")
    return response.json()

async def verify_token_with_jwks(token: str) -> dict:
    """Verify JWT using JWKS public key."""
    jwks = get_jwks()

    # Get key ID from token header
    unverified_header = jwt.get_unverified_header(token)
    key_id = unverified_header.get("kid")

    # Find matching key in JWKS
    key = next((k for k in jwks["keys"] if k["kid"] == key_id), None)
    if not key:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Verify token with public key
    payload = jwt.decode(
        token,
        key,
        algorithms=["EdDSA"]
    )

    return payload
```

**Benefits of JWKS**:
- ✅ No shared secret in backend (only public keys)
- ✅ Supports key rotation without backend changes
- ✅ Enhanced security with asymmetric cryptography
- ✅ Public key can be cached indefinitely

---

## 12. Production Deployment Considerations

### 12.1 Environment Variables

**Production .env.production**:
```bash
# Better Auth
BETTER_AUTH_SECRET=<cryptographically-secure-32+-char-secret>
BETTER_AUTH_URL=https://yourdomain.com

# Database
DATABASE_URL=postgresql://...

# API
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Security
NODE_ENV=production
```

### 12.2 Security Hardening

1. **HTTPS Only**: Enforce HTTPS for all authentication requests
2. **Cookie Flags**: Set `secure: true`, `httpOnly: true`, `sameSite: "strict"`
3. **Rate Limiting**: Implement rate limiting on auth endpoints (e.g., 5 attempts per 15 minutes)
4. **CORS Configuration**: Restrict allowed origins to your frontend domain only
5. **CSP Headers**: Configure Content Security Policy to prevent XSS
6. **Token Rotation**: Enable automatic refresh token rotation
7. **Audit Logging**: Log all authentication events (signup, login, logout, token refresh)

### 12.3 Performance Optimization

1. **Cookie Caching**: Enable `cookieCache` with appropriate `maxAge`
2. **Proactive Refresh**: Refresh tokens before expiration to avoid 401 errors
3. **JWKS Caching**: Cache JWKS public keys indefinitely (use `lru_cache`)
4. **Database Indexes**: Add indexes on user lookup fields (email, user_id)
5. **Session Validation**: Use cookie-based checks in middleware, full validation in API routes

### 12.4 Monitoring and Observability

**Key Metrics to Track**:
- Authentication success/failure rate
- Token refresh frequency and failure rate
- Average session duration
- 401 error rate (token expiration issues)
- Login/signup latency
- Database query performance on auth endpoints

**Recommended Tools**:
- **Logging**: Winston, Pino (Node.js) / Loguru (Python)
- **Error Tracking**: Sentry, Rollbar
- **APM**: New Relic, Datadog, Vercel Analytics
- **Database Monitoring**: Prisma Studio, PgAdmin

---

## 13. References and Sources

### Official Documentation

- [Better Auth - Next.js Integration](https://www.better-auth.com/docs/integrations/next)
- [Better Auth - JWT Plugin](https://www.better-auth.com/docs/plugins/jwt)
- [Better Auth - Session Management](https://www.better-auth.com/docs/concepts/session-management)
- [Next.js - Authentication Guide](https://nextjs.org/docs/app/guides/authentication)
- [Next.js 16 Release Notes](https://nextjs.org/blog/next-16)

### Security Best Practices

- [JWT Storage: Local Storage vs HttpOnly Cookies](https://cybersierra.co/blog/react-jwt-storage-guide/)
- [How to Store JWT Token Securely](https://www.c-sharpcorner.com/article/how-to-store-jwt-token-securely-in-localstorage-vs-cookies/)
- [Next.js HTTP-Only Cookie Authentication](https://maxschmitt.me/posts/next-js-http-only-cookie-auth-tokens)
- [Token Storage: Local Storage vs HttpOnly Cookies](https://www.wisp.blog/blog/understanding-token-storage-local-storage-vs-httponly-cookies)

### Token Refresh Patterns

- [Best Practice for Token Refresh in Frontend Apps](https://github.com/orgs/community/discussions/184563)
- [Token Management: Access and Refresh Tokens](https://medium.com/@eric_abell/refactoring-token-management-a-cleaner-approach-to-handling-access-and-refresh-tokens-542c38212162)
- [Auth.js - Refresh Token Rotation](https://authjs.dev/guides/refresh-token-rotation)
- [OAuth 2.0 Refresh Token Best Practices](https://stateful.com/blog/oauth-refresh-token-best-practices)

### Better Auth Comparisons

- [Better Auth vs Clerk: Complete Comparison](https://clerk.com/articles/better-auth-clerk-complete-authentication-comparison-react-nextjs)
- [Better Auth vs NextAuth vs Auth0](https://betterstack.com/community/guides/scaling-nodejs/better-auth-vs-nextauth-authjs-vs-autho/)
- [NextAuth.js vs Clerk vs Auth.js Comparison 2025](https://chhimpashubham.medium.com/nextauth-js-vs-clerk-vs-auth-js-which-is-best-for-your-next-js-app-in-2025-fc715c2ccbfd)
- [Why Better Auth Over NextAuth, Clerk, and Auth0](https://medium.com/@galihputroaji.gh/why-i-chose-better-auth-over-nextauth-clerk-and-auth0-and-why-you-might-too-abf7b2b4b8ce)

### FastAPI Integration

- [Securing FastAPI with JWT Authentication](https://testdriven.io/blog/fastapi-jwt-auth/)
- [FastAPI - OAuth2 with JWT Tokens](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/)
- [Authentication and Authorization with FastAPI](https://betterstack.com/community/guides/scaling-python/authentication-fastapi/)
- [Better Auth JWT JWKS Skill](https://skills.rest/skill/better-auth-jwt-jwks)

### Next.js Implementation Examples

- [Better Auth with Next.js - Complete Guide](https://medium.com/@amitupadhyay878/better-auth-with-next-js-a-complete-guide-for-modern-authentication-06eec09d6a64)
- [Next.js with Better Auth](https://medium.com/@lior_amsalem/nextjs-with-better-auth-72197f699b37)
- [User Authentication with Auth.js in Next.js App Router](https://dev.to/jamescroissant/user-authentication-with-authjs-in-nextjs-app-router-424k)
- [Next.js App Router: Adding Authentication](https://nextjs.org/learn/dashboard-app/adding-authentication)

### Session Management

- [Next.js Session Management: Solving Persistence Issues](https://clerk.com/articles/nextjs-session-management-solving-nextauth-persistence-issues)
- [Better Auth UI - Next.js Integration](https://better-auth-ui.com/integrations/next-js)

---

## 14. Conclusion and Next Steps

### Key Takeaways

1. **Better Auth is well-suited** for Next.js 16 with FastAPI backend integration
2. **HttpOnly cookies** are the recommended storage mechanism for production
3. **Token refresh with interceptor pattern** prevents 401 errors and improves UX
4. **Next.js 16 proxy (middleware)** provides route-level protection with database validation
5. **Shared secret configuration** enables seamless JWT verification across frontend and backend

### Recommended Next Steps

1. **Review this research document** with the team to align on the approach
2. **Set up development environment** with required dependencies and environment variables
3. **Implement Phase 1** (Core Authentication Setup) as outlined in Section 10.1
4. **Build and test auth pages** with comprehensive error handling
5. **Integrate API client** with automatic token refresh
6. **Implement protected routes** using middleware and component-level guards
7. **Test session persistence** across browser refreshes and multiple tabs
8. **Document any deviations** from this research in the implementation plan

### Risk Mitigation

**Identified Risks**:

1. **Token expiration during active use**: Mitigated by proactive token refresh
2. **XSS attacks stealing tokens**: Mitigated by HttpOnly cookies
3. **CSRF attacks**: Mitigated by SameSite cookie attribute
4. **Backend secret mismatch**: Mitigated by shared .env configuration
5. **Session loss on refresh**: Mitigated by Better Auth cookie persistence

**Open Questions**:

- Should we implement 2FA using Better Auth plugins? (Future enhancement)
- What is the desired session duration (currently recommending 24 hours)?
- Do we need audit logging for authentication events? (Recommended for production)
- Should we implement rate limiting at the application level or infrastructure level?

---

**Document Status**: Research Complete ✅
**Reviewed By**: Pending
**Last Updated**: 2026-02-05
**Next Review**: After implementation Phase 1
