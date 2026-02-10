import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_ROUTES = ["/login", "/signup"];
const PROTECTED_ROUTES = ["/dashboard"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if user has session cookie (Better Auth uses "better-auth.session_token")
  const sessionToken = request.cookies.get("better-auth.session_token");
  const isAuthenticated = !!sessionToken;

  // Redirect authenticated users from auth pages to dashboard
  if (isAuthenticated && AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users from protected routes to login
  if (!isAuthenticated && PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
