import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { requireAdmin } from "@/features/admin/utils/admin-guard";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if ("unauthorized" in guard) return guard.unauthorized;
  if ("forbidden" in guard) return guard.forbidden;

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  try {
    const baseQuery = db
      .select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        action: auditLogs.action,
        targetType: auditLogs.targetType,
        targetId: auditLogs.targetId,
        details: auditLogs.details,
        createdAt: auditLogs.createdAt,
        username: users.username,
      })
      .from(auditLogs)
      .innerJoin(users, eq(auditLogs.userId, users.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(20);

    const logs = userId
      ? await baseQuery.where(eq(auditLogs.userId, userId)).all()
      : await baseQuery.all();

    return NextResponse.json(logs);
  } catch (error) {
    console.error("[Audit Logs API Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
