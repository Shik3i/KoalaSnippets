import { NextResponse } from "next/server";
import { db } from "@/db";
import { snippets, users } from "@/db/schema";
import { requireAdmin } from "@/features/admin/utils/admin-guard";
import { verifyCsrf } from "@/features/core/utils/security";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireAdmin();
  if ("unauthorized" in guard) return guard.unauthorized;
  if ("forbidden" in guard) return guard.forbidden;

  const publicSnippets = await db
    .select({
      id: snippets.id,
      title: snippets.title,
      language: snippets.language,
      tags: snippets.tags,
      createdAt: snippets.createdAt,
      authorId: snippets.authorId,
      authorUsername: users.username,
    })
    .from(snippets)
    .innerJoin(users, eq(snippets.authorId, users.id))
    .where(eq(snippets.visibility, "PUBLIC"))
    .orderBy(desc(snippets.createdAt))
    .all();

  return NextResponse.json({ snippets: publicSnippets });
}

export async function DELETE(request: Request) {
  if (!verifyCsrf(request)) {
    return NextResponse.json({ error: "Invalid CSRF token or Origin" }, { status: 403 });
  }

  const guard = await requireAdmin();
  if ("unauthorized" in guard) return guard.unauthorized;
  if ("forbidden" in guard) return guard.forbidden;

  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.id || typeof body.id !== "string") {
    return NextResponse.json({ error: "Snippet ID is required" }, { status: 400 });
  }

  await db.delete(snippets).where(eq(snippets.id, body.id));

  return NextResponse.json({ message: "Snippet deleted" });
}
