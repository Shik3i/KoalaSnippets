import { NextResponse } from "next/server";
import { db } from "@/db";
import { snippets, snippetFiles, siteSettings, snippetRevisions } from "@/db/schema";
import { getSession } from "@/features/auth/utils/session";
import { updateSnippetSchema } from "@/features/core/utils/validations";
import { generateShareToken, generateId, hashPassword } from "@/features/auth/utils/auth";
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";
import { verifyCsrf } from "@/features/core/utils/security";
import { logUserAction } from "@/features/admin/utils/audit";

export const dynamic = "force-dynamic";

function constantTimeCompare(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  const url = new URL(_request.url);
  const token = url.searchParams.get("token");

  const snippet = await db.select().from(snippets).where(eq(snippets.id, id)).get();

  if (!snippet) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = session && snippet.authorId === session.user.id;

  if (snippet.expiresAt && new Date() > snippet.expiresAt && !isOwner) {
    return NextResponse.json({ error: "Snippet has expired" }, { status: 410 });
  }

  if (!isOwner) {
    if (snippet.visibility === "PRIVATE") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (snippet.visibility === "SHARED") {
      if (!token || !constantTimeCompare(snippet.shareToken!, token)) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }
  }

  const files = await db.select().from(snippetFiles).where(eq(snippetFiles.snippetId, id)).all();
  const mainFile = files.length > 0 ? files[0] : null;

  return NextResponse.json({
    id: snippet.id,
    title: snippet.title,
    description: snippet.description,
    code: mainFile?.code ?? "",
    language: mainFile?.language ?? "plaintext",
    files: files.map(f => ({
      id: f.id,
      filename: f.filename,
      code: f.code,
      language: f.language
    })),
    tags: snippet.tags,
    visibility: snippet.visibility,
    shareToken: snippet.visibility === "SHARED" ? snippet.shareToken : undefined,
    createdAt: snippet.createdAt,
    updatedAt: snippet.updatedAt,
    deletedAt: snippet.deletedAt,
    isOwner: session?.user.id === snippet.authorId,
  });
}

export async function PUT(
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

  const snippet = await db.select().from(snippets).where(eq(snippets.id, id)).get();
  if (!snippet || snippet.authorId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const parsed = updateSnippetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const updates: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
    const { code, language, files, isRestore, ...snippetUpdates } = updates;

    if (isRestore) {
      snippetUpdates.deletedAt = null;
    }

    if (snippetUpdates.visibility === "SHARED" && !snippet.shareToken) {
      snippetUpdates.shareToken = generateShareToken();
    }

    if ('visibility' in snippetUpdates && snippetUpdates.visibility !== "SHARED") {
      snippetUpdates.shareToken = null;
    }

    if (snippetUpdates.password) {
      snippetUpdates.passwordHash = await hashPassword(snippetUpdates.password as string);
    }
    delete snippetUpdates.password;

    if (snippetUpdates.expiresAt !== undefined) {
      snippetUpdates.expiresAt = snippetUpdates.expiresAt ? new Date(snippetUpdates.expiresAt as string | number | Date) : null;
    }

    db.transaction((tx) => {
      let newTotalLines: number | undefined = undefined;

      if (files && Array.isArray(files)) {
        const settings = tx.select().from(siteSettings).where(eq(siteSettings.id, 1)).get();
        const maxChars = settings?.maxCharsPerSnippet ?? 250000;
        
        let totalChars = 0;
        let linesCount = 0;
        for (const f of files) {
          totalChars += (f as { code: string }).code.length;
          linesCount += (f as { code: string }).code.split('\n').length;
        }

        if (totalChars > maxChars) {
          throw new Error(`Snippet code too long (Max: ${maxChars} chars)`);
        }
        newTotalLines = linesCount;

        // Save History
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

        tx.delete(snippetFiles).where(eq(snippetFiles.snippetId, id)).run();
        for (const f of files) {
          tx.insert(snippetFiles).values({
            id: generateId(),
            snippetId: id,
            filename: (f as { filename: string }).filename,
            code: (f as { code: string }).code,
            language: (f as { language: string }).language
          }).run();
        }
      } else if (code !== undefined || language !== undefined) {
        // Fallback for single-file update
        const settings = tx.select().from(siteSettings).where(eq(siteSettings.id, 1)).get();
        const maxChars = settings?.maxCharsPerSnippet ?? 250000;
        
        if (typeof code === 'string' && code.length > maxChars) {
          throw new Error(`Snippet code too long (Max: ${maxChars} chars)`);
        }

        // We assume there's at least one file. We update the first one or 'index'
        const existingFiles = tx.select().from(snippetFiles).where(eq(snippetFiles.snippetId, id)).all();
        if (existingFiles.length > 0) {
          tx.insert(snippetRevisions).values({
            id: generateId(),
            snippetId: id,
            content: JSON.stringify(existingFiles.map(f => ({ filename: f.filename, code: f.code, language: f.language }))),
            createdAt: new Date(),
          }).run();

          const allRevisions = tx.select().from(snippetRevisions).where(eq(snippetRevisions.snippetId, id)).orderBy(desc(snippetRevisions.createdAt)).all();
          if (allRevisions.length > 5) {
            const toDelete = allRevisions.slice(5).map(r => r.id);
            for (const revId of toDelete) {
              tx.delete(snippetRevisions).where(eq(snippetRevisions.id, revId)).run();
            }
          }

          const fileUpdate: Record<string, unknown> = {};
          if (code !== undefined) fileUpdate.code = code;
          if (language !== undefined) fileUpdate.language = language;
          tx.update(snippetFiles).set(fileUpdate).where(eq(snippetFiles.id, existingFiles[0].id)).run();

          // Recompute total lines from all database files of this snippet
          const allFiles = tx.select().from(snippetFiles).where(eq(snippetFiles.snippetId, id)).all();
          let linesCount = 0;
          for (const f of allFiles) {
            linesCount += f.code.split('\n').length;
          }
          newTotalLines = linesCount;
        }
      }

      if (newTotalLines !== undefined) {
        snippetUpdates.totalLines = newTotalLines;
      }

      if (Object.keys(snippetUpdates).length > 0) {
        tx.update(snippets).set(snippetUpdates).where(eq(snippets.id, id)).run();
      }
    });

    await logUserAction(
      session.user.id,
      isRestore ? "RESTORE" : "UPDATE",
      "SNIPPET",
      id,
      isRestore ? `Snippet "${snippet.title}" restored` : `Snippet "${parsed.data.title || snippet.title}" updated`
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[Snippets API PUT Error]", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: message.includes("too long") ? 400 : 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyCsrf(_request)) {
    return NextResponse.json({ error: "Invalid CSRF token or Origin" }, { status: 403 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const snippet = await db.select().from(snippets).where(eq(snippets.id, id)).get();
  if (!snippet || snippet.authorId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!snippet.deletedAt) {
    // Soft delete
    await db.update(snippets).set({ deletedAt: new Date() }).where(eq(snippets.id, id));
    await logUserAction(session.user.id, "DELETE", "SNIPPET", id, `Snippet "${snippet.title}" moved to trash`);
  } else {
    // Hard delete
    await db.delete(snippets).where(eq(snippets.id, id));
    await logUserAction(session.user.id, "DELETE", "SNIPPET", id, `Snippet "${snippet.title}" permanently deleted`);
  }

  return NextResponse.json({ success: true });
}
