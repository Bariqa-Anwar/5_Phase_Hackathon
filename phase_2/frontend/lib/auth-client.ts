"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://5-phase-hackathon2.vercel.app",
});

// Export commonly used auth methods
export const { signIn, signUp, signOut, useSession } = authClient;
