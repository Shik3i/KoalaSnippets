import { NextResponse } from "next/server";
import { db } from "@/db";
import { snippets, users, snippetFiles } from "@/db/schema";
import { requireAdmin } from "@/features/admin/utils/admin-guard";
import { verifyCsrf } from "@/features/core/utils/security";
import { logUserAction } from "@/features/admin/utils/audit";
import { eq, desc, inArray, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if ("unauthorized" in guard) return guard.unauthorized;
  if ("forbidden" in guard) return guard.forbidden;

  const publicSnippets = await db
    .select({
      id: snippets.id,
      title: snippets.title,
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

  const snippetIds = publicSnippets.map(s => s.id);
  const files = snippetIds.length > 0 
    ? await db.select().from(snippetFiles).where(inArray(snippetFiles.snippetId, snippetIds)).all()
    : [];

  const publicSnippetsWithFiles = publicSnippets.map(s => {
    const sFiles = files.filter(f => f.snippetId === s.id);
    return {
      ...s,
      language: sFiles[0]?.language ?? "plaintext"
    };
  });

  return NextResponse.json({ snippets: publicSnippetsWithFiles });
}

export async function DELETE(request: Request) {
  if (!verifyCsrf(request)) {
    return NextResponse.json({ error: "Invalid CSRF token or Origin" }, { status: 403 });
  }

  const guard = await requireAdmin(request);
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

  const snippet = await db.select().from(snippets).where(
    and(
      eq(snippets.id, body.id),
      eq(snippets.visibility, "PUBLIC")
    )
  ).get();
  if (!snippet) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!snippet.deletedAt) {
    await db.update(snippets).set({ deletedAt: new Date() }).where(
      and(
        eq(snippets.id, body.id),
        eq(snippets.visibility, "PUBLIC")
      )
    );
    await logUserAction(guard.session.user.id, "DELETE", "SNIPPET", body.id, `Public snippet "${snippet.title}" moved to trash`);
  } else {
    await db.delete(snippets).where(
      and(
        eq(snippets.id, body.id),
        eq(snippets.visibility, "PUBLIC")
      )
    );
    await logUserAction(guard.session.user.id, "DELETE", "SNIPPET", body.id, `Public snippet "${snippet.title}" permanently deleted`);
  }

  return NextResponse.json({ message: "Snippet deleted" });
}
