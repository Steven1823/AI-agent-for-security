/**
 * Route-level auth gate.
 *
 * - Protected routes (everything under PROTECTED_PREFIXES) require a user.
 *   Unauthenticated visitors are redirected to /login.
 * - Auth pages (/login, /signup) bounce signed-in users back to /dashboard.
 * - When Supabase env vars are missing the gate is a no-op so the demo
 *   environment keeps working without any configuration.
 */
import { NextResponse, type NextRequest } from "next/server";
import { authEnabled, updateSession } from "@/lib/supabase/middleware";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/analyzer",
  "/chaos",
  "/reports",
  "/security",
  "/settings",
  "/incidents",
  "/recovery",
  "/replay",
  "/intelligence",
  "/autonomous",
  "/copilot",
  "/executive",
];

const AUTH_PATHS = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { response, user } = await updateSession(request);

  if (!authEnabled) return response;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PATHS.some((p) => pathname === p);

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, *.svg, *.png, *.jpg, *.jpeg, *.gif, *.webp
     * - /api/* — those routes self-protect via requireAuth() helpers
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)",
  ],
};
