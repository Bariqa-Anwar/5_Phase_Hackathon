"use client";

import { useSession } from "@/lib/auth-client";

/**
 * Custom hook wrapping Better Auth useSession with enhanced typing
 * Provides convenient access to session data, loading, and error states
 */
export function useAuth() {
  const session = useSession();

  return {
    user: session.data?.user || null,
    session: session.data || null,
    isLoading: session.isPending,
    isAuthenticated: !!session.data?.user,
    error: session.error || null,
  };
}
