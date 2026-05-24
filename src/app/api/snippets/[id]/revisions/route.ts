import { NextResponse } from "next/server";
import { db } from "@/db";
import { snippets, snippetRevisions, snippetFiles } from "@/db/schema";
import { getSession } from "@/features/auth/utils/session";
import { verifyCsrf } from "@/features/core/utils/security";
import { eq, desc } from "drizzle-orm";
import { generateId } from "@/features/auth/utils/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snippet = await db.select().from(snippets).where(eq(snippets.id, id)).get();
  if (!snippet || snippet.authorId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const revisions = await db.select({
    id: snippetRevisions.id,
    createdAt: snippetRevisions.createdAt,
  }).from(snippetRevisions)
    .where(eq(snippetRevisions.snippetId, id))
    .orderBy(desc(snippetRevisions.createdAt))
    .all();

  return NextResponse.json({ revisions });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyCsrf(request)) {
    return NextResponse.json({ error: "Invalid CSRF token or Origin" }, { status: 403 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { revisionId } = await request.json();

  const snippet = await db.select().from(snippets).where(eq(snippets.id, id)).get();
  if (!snippet || snippet.authorId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const revision = await db.select().from(snippetRevisions).where(eq(snippetRevisions.id, revisionId)).get();
  if (!revision || revision.snippetId !== id) {
    return NextResponse.json({ error: "Revision not found" }, { status: 404 });
  }

  try {
    const filesSnapshot = JSON.parse(revision.content) as Array<{ filename: string, code: string, language: string }>;

    db.transaction((tx) => {
      // Create a snapshot of current state before restoring
      const currentFiles = tx.select().from(snippetFiles).where(eq(snippetFiles.snippetId, id)).all();
      if (currentFiles.length > 0) {
        tx.insert(snippetRevisions).values({
          id: generateId(),
          snippetId: id,
          content: JSON.stringify(currentFiles.map(f => ({ filename: f.filename, code: f.code, language: f.language }))),
          createdAt: new Date(),
        }).run();

        const allRevisions = tx.select().from(snippetRevisions).where(eq(snippetRevisions.snippetId, id)).orderBy(desc(snippetRevisions.createdAt)).all();
        if (allRevisions.length > 5) {
          const toDelete = allRevisions.slice(5).map(r => r.id);
          for (const revId of toDelete) {
            tx.delete(snippetRevisions).where(eq(snippetRevisions.id, revId)).run();
          }
        }
      }

      // Restore files
      tx.delete(snippetFiles).where(eq(snippetFiles.snippetId, id)).run();
      
      let linesCount = 0;
      for (const f of filesSnapshot) {
        linesCount += f.code.split('\n').length;
        tx.insert(snippetFiles).values({
          id: generateId(),
          snippetId: id,
          filename: f.filename,
          code: f.code,
          language: f.language
        }).run();
      }

      tx.update(snippets).set({ totalLines: linesCount, updatedAt: new Date() }).where(eq(snippets.id, id)).run();
    });

    return NextResponse.json({ success: true, files: filesSnapshot });
  } catch (error) {
    console.error("Restore failed:", error);
    return NextResponse.json({ error: "Failed to restore revision" }, { status: 500 });
  }
}
