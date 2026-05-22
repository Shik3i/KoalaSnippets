import { NextResponse } from "next/server";
import { db } from "@/db";
import { snippets, snippetFiles, siteSettings } from "@/db/schema";
import { getSession } from "@/features/auth/utils/session";
import { updateSnippetSchema } from "@/features/core/utils/validations";
import { generateShareToken } from "@/features/auth/utils/auth";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { verifyCsrf } from "@/features/core/utils/security";

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

  const file = await db.select().from(snippetFiles).where(eq(snippetFiles.snippetId, id)).get();

  return NextResponse.json({
    id: snippet.id,
    title: snippet.title,
    description: snippet.description,
    code: file?.code ?? "",
    language: file?.language ?? "plaintext",
    tags: snippet.tags,
    visibility: snippet.visibility,
    shareToken: snippet.visibility === "SHARED" ? snippet.shareToken : undefined,
    createdAt: snippet.createdAt,
    updatedAt: snippet.updatedAt,
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
    const { code, language, ...snippetUpdates } = updates;

    if (snippetUpdates.visibility === "SHARED" && !snippet.shareToken) {
      snippetUpdates.shareToken = generateShareToken();
    }

    if ('visibility' in snippetUpdates && snippetUpdates.visibility !== "SHARED") {
      snippetUpdates.shareToken = null;
    }

    await db.transaction(async (tx) => {
      if (Object.keys(snippetUpdates).length > 0) {
        await tx.update(snippets).set(snippetUpdates).where(eq(snippets.id, id));
      }

      if (code !== undefined || language !== undefined) {
        const settings = await tx.select().from(siteSettings).where(eq(siteSettings.id, 1)).get();
        const maxChars = settings?.maxCharsPerSnippet ?? 250000;
        
        if (typeof code === 'string' && code.length > maxChars) {
          throw new Error(`Snippet code too long (Max: ${maxChars} chars)`);
        }

        const fileUpdate: Record<string, unknown> = {};
        if (code !== undefined) fileUpdate.code = code;
        if (language !== undefined) fileUpdate.language = language;
        
        await tx.update(snippetFiles).set(fileUpdate).where(eq(snippetFiles.snippetId, id));
      }
    });

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

  await db.delete(snippets).where(eq(snippets.id, id));

  return NextResponse.json({ success: true });
}
