import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, generateId } from "@/lib/auth";
import { registerSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";
import { eq } from "drizzle-orm";

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
      createdAt: new Date(),
    });

    const res = NextResponse.json({ success: true }, { status: 201 });
    return res;
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
