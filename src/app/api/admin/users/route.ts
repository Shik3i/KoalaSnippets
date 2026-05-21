import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, snippets } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-guard";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const guard = await requireAdmin();
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
    .select({ authorId: snippets.authorId, count: snippets.id })
    .from(snippets)
    .groupBy(snippets.authorId);

  const countMap = new Map<string, number>();
  for (const row of snippetCounts) {
    countMap.set(row.authorId, (countMap.get(row.authorId) ?? 0) + 1);
  }

  return NextResponse.json({
    users: allUsers.map((u) => ({
      ...u,
      snippetCount: countMap.get(u.id) ?? 0,
    })),
  });
}

export async function DELETE(request: Request) {
  const guard = await requireAdmin();
  if ("unauthorized" in guard) return guard.unauthorized;
  if ("forbidden" in guard) return guard.forbidden;

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

  await db.delete(snippets).where(eq(snippets.authorId, userId));
  await db.delete(users).where(eq(users.id, userId));

  return NextResponse.json({ success: true });
}
