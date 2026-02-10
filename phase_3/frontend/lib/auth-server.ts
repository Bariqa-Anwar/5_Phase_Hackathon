import { betterAuth } from "better-auth";
import { Pool } from "pg";

// Create PostgreSQL connection pool for Better Auth
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const auth = betterAuth({
  database: pool,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: false, // Disabled for MVP, can enable later
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
  },
  advanced: {
    cookiePrefix: "better-auth",
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
});
