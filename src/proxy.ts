// NOTE: This file acts as the Next.js middleware.
// It was renamed from middleware.ts to proxy.ts for specific environment/compatibility reasons.
// All route protection and public path definitions are handled here.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/login", "/register", "/public", "/impressum", "/privacy", "/stats", "/settings/appearance", "/api/settings/appearance"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/public") ||
    pathname === "/" ||
    pathname === "/api/health"
  ) {
    return NextResponse.next();
  }

  if (pathname === "/register" && process.env.ALLOW_REGISTRATION !== "true") {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const sessionCookie = request.cookies.get("ks_session");

  if (!sessionCookie) {
    if (publicPaths.some((p) => pathname.startsWith(p))) {
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
