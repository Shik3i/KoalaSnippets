import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, snippets } from "@/db/schema";
import { requireAdmin } from "@/features/admin/utils/admin-guard";
import { eq, desc, count } from "drizzle-orm";
import { verifyCsrf } from "@/features/core/utils/security";
import { logCrash } from "@/features/core/utils/crash-reporter";
import { logErrorToFile } from "@/features/core/utils/file-logger";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if ("unauthorized" in guard) return guard.unauthorized;
  if ("forbidden" in guard) return guard.forbidden;

  const allUsers = await db
    .select({
      id: users.id,
      username: users.username,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .all();

  const snippetCounts = await db
    .select({ authorId: snippets.authorId, count: count(snippets.id) })
    .from(snippets)
    .groupBy(snippets.authorId);

  const countMap = new Map<string, number>();
  for (const row of snippetCounts) {
    countMap.set(row.authorId, row.count);
  }

  return NextResponse.json({
    users: allUsers.map((u) => ({
      ...u,
      snippetCount: countMap.get(u.id) ?? 0,
    })),
  });
}

export async function DELETE(request: Request) {
  if (!verifyCsrf(request)) {
    return NextResponse.json({ error: "Invalid CSRF token or Origin" }, { status: 403 });
  }

  const guard = await requireAdmin(request);
  if ("unauthorized" in guard) return guard.unauthorized;
  if ("forbidden" in guard) return guard.forbidden;

  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const target = await db.select().from(users).where(eq(users.id, userId)).get();
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (target.role === "ADMIN") {
      return NextResponse.json({ error: "Cannot delete admin users" }, { status: 403 });
    }

    db.transaction((tx) => {
      tx.delete(snippets).where(eq(snippets.authorId, userId)).run();
      tx.delete(users).where(eq(users.id, userId)).run();
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Users API Error]", error);
    await logCrash(error instanceof Error ? error : new Error(String(error)), request.url);
    logErrorToFile(error, "DELETE /api/admin/users");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
