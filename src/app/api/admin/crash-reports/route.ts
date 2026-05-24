import { NextResponse } from "next/server";
import { db } from "@/db";
import { crashReports, users } from "@/db/schema";
import { requireAdmin } from "@/features/admin/utils/admin-guard";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireAdmin();
  if ("unauthorized" in guard) return guard.unauthorized;
  if ("forbidden" in guard) return guard.forbidden;

  try {
    const reports = await db
      .select({
        id: crashReports.id,
        errorMessage: crashReports.errorMessage,
        stackTrace: crashReports.stackTrace,
        userId: crashReports.userId,
        route: crashReports.route,
        metadata: crashReports.metadata,
        createdAt: crashReports.createdAt,
        username: users.username,
      })
      .from(crashReports)
      .leftJoin(users, eq(crashReports.userId, users.id))
      .orderBy(desc(crashReports.createdAt))
      .limit(100)
      .all();

    return NextResponse.json(reports);
  } catch (error) {
    console.error("[Crash Reports API Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  const guard = await requireAdmin();
  if ("unauthorized" in guard) return guard.unauthorized;
  if ("forbidden" in guard) return guard.forbidden;

  try {
    await db.delete(crashReports).run();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Crash Reports API Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
