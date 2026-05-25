import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword } from "@/features/auth/utils/auth";
import { createSession, setSessionCookie } from "@/features/auth/utils/session";
import { loginSchema } from "@/features/core/utils/validations";
import { checkRateLimit } from "@/features/core/utils/rate-limit";
import { eq } from "drizzle-orm";
import { verifyCsrf } from "@/features/core/utils/security";

import { logUserAction } from "@/features/admin/utils/audit";
import { logCrash } from "@/features/core/utils/crash-reporter";
import { logErrorToFile } from "@/features/core/utils/file-logger";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!verifyCsrf(request)) {
    return NextResponse.json({ error: "Invalid CSRF token or Origin" }, { status: 403 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ips = forwardedFor ? forwardedFor.split(",") : [];
  const ip = ips.length > 0 ? ips[0].trim() : "unknown";
  const limit = checkRateLimit(`login:${ip}`, 5, 15 * 60 * 1000);

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } }
    );
  }

  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { username, password } = parsed.data;

    const user = await db.select().from(users).where(eq(users.username, username)).get();
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await createSession(user.id);

    await setSessionCookie(token);
    await logUserAction(user.id, "LOGIN", "USER", user.id, `User "${user.username}" logged in`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Login API Error]", error);
    await logCrash(error instanceof Error ? error : new Error(String(error)), request.url);
    logErrorToFile(error, "POST /api/auth/login");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
