import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-server";
import { SignJWT } from "jose";
import { headers } from "next/headers";

const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET!;
const JWT_EXPIRY = "1h"; // Short-lived JWT for backend API calls

/**
 * GET /api/auth/token
 *
 * Auth bridge: reads the Better Auth session from cookies (server-side),
 * then mints a HS256 JWT with { sub: user.id } that the FastAPI backend
 * can verify using the shared BETTER_AUTH_SECRET.
 *
 * This is needed because Better Auth issues opaque session tokens,
 * but the FastAPI backend expects a signed JWT.
 */
export async function GET() {
  try {
    // Get session from Better Auth using the incoming request headers (cookies)
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Mint a HS256 JWT for the FastAPI backend
    const secret = new TextEncoder().encode(BETTER_AUTH_SECRET);
    const token = await new SignJWT({
      sub: session.user.id,
      email: session.user.email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRY)
      .sign(secret);

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Token bridge error:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
