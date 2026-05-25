import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * NOTE: This file acts as the Next.js middleware.
 * In Next.js 16+, the "middleware.ts" convention is deprecated in favor of "proxy.ts".
 * DO NOT RENAME this back to middleware.ts, or the Next.js build will throw deprecation warnings
 * and potentially ignore it in future versions.
 */

const publicPaths = ["/login", "/register", "/public", "/impressum", "/privacy", "/stats", "/tools"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isApiAuth = pathname === "/api/auth" || pathname.startsWith("/api/auth/");
  const isPublicPrefix = pathname === "/public" || pathname.startsWith("/public/");
  const isApiHealth = pathname === "/api/health";

  if (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/" ||
    isApiAuth ||
    isPublicPrefix ||
    isApiHealth
  ) {
    return NextResponse.next();
  }

  if (pathname === "/register" && process.env.ALLOW_REGISTRATION !== "true") {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const sessionCookie = request.cookies.get("ks_session");

  // Basic edge check for presence. Full validation happens in API routes/Server components.
  if (!sessionCookie) {
    const isPublicPath = publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    
    if (isPublicPath) {
      return NextResponse.next();
    }

    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" || pathname === "/register") {
    if (request.nextUrl.searchParams.has("expired")) {
      const response = NextResponse.next();
      response.cookies.delete("ks_session");
      return response;
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
