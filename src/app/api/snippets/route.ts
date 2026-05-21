import { NextResponse } from "next/server";
import { db } from "@/db";
import { snippets } from "@/db/schema";
import { getSession } from "@/lib/session";
import { snippetSchema } from "@/lib/validations";
import { generateId, generateShareToken } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export async function GET(request: Request) {
  const session = await getSession();
  const { searchParams } = new URL(request.url);
  const visibility = searchParams.get("visibility");

  if (!session && visibility !== "PUBLIC") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let query = db.select().from(snippets).orderBy(desc(snippets.createdAt));

  if (visibility === "PUBLIC") {
    const results = await query.where(eq(snippets.visibility, "PUBLIC")).all();
    return NextResponse.json(
      results.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        language: s.language,
        tags: s.tags,
        visibility: s.visibility,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }))
    );
  }

  if (session) {
    const results = await query.where(eq(snippets.authorId, session.user.id)).all();
    return NextResponse.json(
      results.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        language: s.language,
        tags: s.tags,
        visibility: s.visibility,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }))
    );
  }

  const results = await query.all();
  return NextResponse.json(
    results.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      language: s.language,
      tags: s.tags,
      visibility: s.visibility,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }))
  );
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = snippetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { title, description, code, language, tags, visibility } = parsed.data;

    const snippetData: typeof snippets.$inferInsert = {
      id: generateId(),
      title,
      description: description ?? null,
      code,
      language,
      tags: tags ?? null,
      authorId: session.user.id,
      visibility,
      shareToken: visibility === "SHARED" ? generateShareToken() : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(snippets).values(snippetData);

    return NextResponse.json({ success: true, id: snippetData.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
