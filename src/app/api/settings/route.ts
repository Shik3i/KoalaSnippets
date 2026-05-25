import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, sessions } from "@/db/schema";
import { getSession } from "@/features/auth/utils/session";
import { verifyPassword, hashPassword } from "@/features/auth/utils/auth";
import { passwordChangeSchema } from "@/features/core/utils/validations";
import { eq, ne, and } from "drizzle-orm";
import { verifyCsrf } from "@/features/core/utils/security";
import { logCrash } from "@/features/core/utils/crash-reporter";
import { logErrorToFile } from "@/features/core/utils/file-logger";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  if (!verifyCsrf(request)) {
    return NextResponse.json({ error: "Invalid CSRF token or Origin" }, { status: 403 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = passwordChangeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { currentPassword, newPassword } = parsed.data;

    const user = await db.select().from(users).where(eq(users.id, session.user.id)).get();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });
    }

    const newHash = await hashPassword(newPassword);
    await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, session.user.id));

    await db.delete(sessions).where(
      and(eq(sessions.userId, session.user.id), ne(sessions.id, session.id))
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Settings API PUT Error]", error);
    await logCrash(error instanceof Error ? error : new Error(String(error)), request.url);
    logErrorToFile(error, "PUT /api/settings");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
