import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, siteStatistics } from "@/db/schema";
import { hashPassword, generateId } from "@/features/auth/utils/auth";
import { registerSchema } from "@/features/core/utils/validations";
import { checkRateLimit } from "@/features/core/utils/rate-limit";
import { eq, sql } from "drizzle-orm";

export async function POST(request: Request) {
  if (process.env.ALLOW_REGISTRATION !== "true") {
    return NextResponse.json({ error: "Registration is disabled" }, { status: 403 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const limit = checkRateLimit(`register:${ip}`, 3, 60 * 60 * 1000);

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } }
    );
  }

  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { username, password } = parsed.data;

    const existing = await db.select().from(users).where(eq(users.username, username)).get();
    if (existing) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    await db.insert(users).values({
      id: generateId(),
      username,
      passwordHash,
      role: "USER",
      createdAt: new Date(),
      preferences: {
        appTheme: "theme-dark",
        snippetDensity: "compact",
        syntaxTheme: "github-dark",
        bgPattern: "flat",
      },
    });

    await db.update(siteStatistics)
      .set({ totalUsersCreated: sql`total_users_created + 1` })
      .where(eq(siteStatistics.id, 1));

    const res = NextResponse.json({ success: true }, { status: 201 });
    return res;
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
