import { NextResponse } from "next/server";
import { db } from "@/db";
import { snippets } from "@/db/schema";
import { getSession } from "@/lib/session";
import { updateSnippetSchema } from "@/lib/validations";
import { generateShareToken } from "@/lib/auth";
import { eq } from "drizzle-orm";
import crypto from "crypto";

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
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

  if (snippet.visibility === "PRIVATE") {
    if (!session || snippet.authorId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  if (snippet.visibility === "SHARED") {
    if (!token || !constantTimeCompare(snippet.shareToken!, token)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  return NextResponse.json({
    id: snippet.id,
    title: snippet.title,
    description: snippet.description,
    code: snippet.code,
    language: snippet.language,
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

    if (updates.visibility === "SHARED" && !snippet.shareToken) {
      updates.shareToken = generateShareToken();
    }

    if (updates.visibility !== "SHARED") {
      updates.shareToken = null;
    }

    await db.update(snippets).set(updates).where(eq(snippets.id, id));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
