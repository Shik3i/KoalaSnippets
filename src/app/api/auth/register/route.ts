import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, siteStatistics, siteSettings } from "@/db/schema";
import { hashPassword, generateId } from "@/features/auth/utils/auth";
import { registerSchema } from "@/features/core/utils/validations";
import { checkRateLimit } from "@/features/core/utils/rate-limit";
import { eq, sql } from "drizzle-orm";
import { verifyCsrf } from "@/features/core/utils/security";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!verifyCsrf(request)) {
    return NextResponse.json({ error: "Invalid CSRF token or Origin" }, { status: 403 });
  }

  const settings = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).get();
  if (!settings?.registrationEnabled) {
    return NextResponse.json({ error: "Registration is disabled" }, { status: 403 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ips = forwardedFor ? forwardedFor.split(",") : [];
  const ip = ips.length > 0 ? ips[0].trim() : "unknown";
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

    const passwordHash = await hashPassword(password);

    try {
      db.transaction((tx) => {
        tx.insert(users).values({
          id: generateId(),
          username,
          passwordHash,
          role: "USER",
          createdAt: new Date(),
          preferences: {
            appTheme: "theme-midnight",
            snippetDensity: "preview",
            syntaxTheme: "github-dark",
            bgPattern: "matrix",
          },
        }).run();

        tx.update(siteStatistics)
          .set({ totalUsersCreated: sql`total_users_created + 1` })
          .where(eq(siteStatistics.id, 1)).run();
      });
    } catch (dbError: any) {
      if (dbError.code === "SQLITE_CONSTRAINT_UNIQUE") {
        return NextResponse.json({ error: "Username already taken" }, { status: 409 });
      }
      throw dbError;
    }

    const res = NextResponse.json({ success: true }, { status: 201 });
    return res;
  } catch (error) {
    console.error("[Register API Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
