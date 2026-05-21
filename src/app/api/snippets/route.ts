import { NextResponse } from "next/server";
import { db } from "@/db";
import { snippets, siteStatistics } from "@/db/schema";
import { getSession } from "@/features/auth/utils/session";
import { snippetSchema } from "@/features/core/utils/validations";
import { generateId, generateShareToken } from "@/features/auth/utils/auth";
import { eq, desc, like, or, and, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export async function GET(request: Request) {
  const session = await getSession();
  const { searchParams } = new URL(request.url);
  const visibility = searchParams.get("visibility");
  const query = searchParams.get("q");
  const includeCode = searchParams.get("includeCode") === "true";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  if (!session && visibility !== "PUBLIC") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseQuery = db.select().from(snippets);

  const conditions = [];

  if (visibility === "PUBLIC") {
    conditions.push(eq(snippets.visibility, "PUBLIC"));
  } else if (session) {
    conditions.push(eq(snippets.authorId, session.user.id));
  }

  if (query) {
    const escapedQuery = query.replace(/%/g, "\\%").replace(/_/g, "\\_");
    const searchConditions = [
      like(snippets.title, `%${escapedQuery}%`),
      like(snippets.language, `%${escapedQuery}%`),
      like(snippets.tags, `%${escapedQuery}%`),
    ];

    if (includeCode) {
      searchConditions.push(like(snippets.code, `%${escapedQuery}%`));
    }

    conditions.push(or(...searchConditions));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const results = await (whereClause
    ? baseQuery.where(whereClause).orderBy(desc(snippets.createdAt)).limit(PAGE_SIZE).offset(offset)
    : baseQuery.orderBy(desc(snippets.createdAt)).limit(PAGE_SIZE).offset(offset)
  ).all();

  return NextResponse.json({
    snippets: results.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      language: s.language,
      tags: s.tags,
      visibility: s.visibility,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    })),
    page,
    hasMore: results.length === PAGE_SIZE,
  });
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

    await db.transaction(async (tx) => {
      await tx.insert(snippets).values(snippetData);
      
      await tx.update(siteStatistics)
        .set({ totalSnippetsCreated: sql`total_snippets_created + 1` })
        .where(eq(siteStatistics.id, 1));
    });

    return NextResponse.json({ 
      success: true, 
      id: snippetData.id, 
      shareToken: snippetData.shareToken ?? undefined 
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
