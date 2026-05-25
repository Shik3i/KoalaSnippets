import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/features/admin/utils/admin-guard";
import { like } from "drizzle-orm";
import { escapeLike } from "@/features/core/utils/sql";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if ("unauthorized" in guard) return guard.unauthorized;
  if ("forbidden" in guard) return guard.forbidden;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  if (!q.trim()) {
    return NextResponse.json([]);
  }

  try {
    const escapedQuery = escapeLike(q.trim());
    const matchedUsers = await db
      .select({
        id: users.id,
        username: users.username,
      })
      .from(users)
      .where(like(users.username, `%${escapedQuery}%`))
      .limit(10)
      .all();

    return NextResponse.json(matchedUsers);
  } catch (error) {
    console.error("[Autocomplete API Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
