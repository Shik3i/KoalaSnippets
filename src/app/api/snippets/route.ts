import { NextResponse } from "next/server";
import { db } from "@/db";
import { snippets, siteStatistics, siteSettings, snippetFiles } from "@/db/schema";
import { getSession } from "@/features/auth/utils/session";
import { snippetSchema } from "@/features/core/utils/validations";
import { generateId, generateShareToken } from "@/features/auth/utils/auth";
import { eq, desc, like, or, and, sql, count, inArray } from "drizzle-orm";
import { getSafePage, verifyCsrf } from "@/features/core/utils/security";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export async function GET(request: Request) {
  const session = await getSession();
  const { searchParams } = new URL(request.url);
  const visibility = searchParams.get("visibility");
  const query = searchParams.get("q");
  const includeCode = searchParams.get("includeCode") === "true";
  const page = getSafePage(searchParams.get("page"));
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

  let matchingSnippetIds = new Set<string>();
  if (query) {
    const escapedQuery = query.replace(/%/g, "\\%").replace(/_/g, "\\_");
    
    let fileQuery = db.select({ snippetId: snippetFiles.snippetId }).from(snippetFiles)
      .where(like(snippetFiles.language, `%${escapedQuery}%`));
      
    // if (includeCode) {
    //   fileQuery = db.select({ snippetId: snippetFiles.snippetId }).from(snippetFiles)
    //     .where(or(
    //       like(snippetFiles.language, `%${escapedQuery}%`),
    //       like(snippetFiles.code, `%${escapedQuery}%`)
    //     ));
    // }
    
    const matchedFiles = await fileQuery.all();
    matchedFiles.forEach(f => matchingSnippetIds.add(f.snippetId));

    const searchConditions = [
      like(snippets.title, `%${escapedQuery}%`),
      like(snippets.tags, `%${escapedQuery}%`),
    ];
    if (matchingSnippetIds.size > 0) {
      searchConditions.push(inArray(snippets.id, Array.from(matchingSnippetIds)));
    }

    conditions.push(or(...searchConditions)!);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const results = await (whereClause
    ? baseQuery.where(whereClause).orderBy(desc(snippets.createdAt)).limit(PAGE_SIZE).offset(offset)
    : baseQuery.orderBy(desc(snippets.createdAt)).limit(PAGE_SIZE).offset(offset)
  ).all();

  const snippetIds = results.map(s => s.id);
  const files = snippetIds.length > 0 
    ? await db.select().from(snippetFiles).where(inArray(snippetFiles.snippetId, snippetIds)).all()
    : [];

  return NextResponse.json({
    snippets: results.map((s) => {
      const sFiles = files.filter(f => f.snippetId === s.id);
      return {
        id: s.id,
        title: s.title,
        description: s.description,
        language: sFiles[0]?.language ?? "plaintext",
        tags: s.tags,
        visibility: s.visibility,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      };
    }),
    page,
    hasMore: results.length === PAGE_SIZE,
  });
}

export async function POST(request: Request) {
  if (!verifyCsrf(request)) {
    return NextResponse.json({ error: "Invalid CSRF token or Origin" }, { status: 403 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).get();
  const maxSnippets = settings?.maxSnippetsPerUser ?? 1000;
  const maxChars = settings?.maxCharsPerSnippet ?? 250000;

  const currentCount = await db.select({ c: count() }).from(snippets).where(eq(snippets.authorId, session.user.id)).get();
  if (currentCount && currentCount.c >= maxSnippets) {
    return NextResponse.json({ error: `Snippet quota exceeded (Max: ${maxSnippets})` }, { status: 403 });
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  try {
    const body = await request.json();
    const parsed = snippetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { title, description, code, language, tags, visibility, files } = parsed.data;

    let totalChars = 0;
    const filesToInsert = files ?? [{ filename: "index", code: code!, language: language! }];
    
    for (const f of filesToInsert) {
      if (!f.code || !f.language) {
        return NextResponse.json({ error: "Missing code or language in file" }, { status: 400 });
      }
      totalChars += f.code.length;
    }

    if (totalChars > maxChars) {
      return NextResponse.json({ error: `Snippet total code too long (Max: ${maxChars} chars)` }, { status: 400 });
    }

    const normalizedTags = tags?.map((t) => t.toLowerCase()) ?? null;

    const snippetData: typeof snippets.$inferInsert = {
      id: generateId(),
      title,
      description: description ?? null,
      tags: normalizedTags,
      authorId: session.user.id,
      visibility,
      shareToken: visibility === "SHARED" ? generateShareToken() : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.transaction(async (tx) => {
      await tx.insert(snippets).values(snippetData);

      for (const f of filesToInsert) {
        await tx.insert(snippetFiles).values({
          id: generateId(),
          snippetId: snippetData.id,
          filename: f.filename,
          code: f.code,
          language: f.language
        });
      }
      
      await tx.update(siteStatistics)
        .set({ totalSnippetsCreated: sql`total_snippets_created + 1` })
        .where(eq(siteStatistics.id, 1));
    });

    return NextResponse.json({ 
      success: true, 
      id: snippetData.id, 
      shareToken: snippetData.shareToken ?? undefined 
    }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("[Snippets API Error]", message, stack);
    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 }
    );
  }
}
