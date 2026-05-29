import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { db } from "@/db";
import { snippets, siteStatistics, siteSettings, snippetFiles, userFavorites } from "@/db/schema";
import { getAuth } from "@/features/auth/utils/session";
import { snippetSchema } from "@/features/core/utils/validations";
import { generateId, generateShareToken, hashPassword } from "@/features/auth/utils/auth";
import { eq, desc, like, or, and, sql, count, inArray, isNull, gt } from "drizzle-orm";
import { getSafePage, verifyCsrf } from "@/features/core/utils/security";
import { escapeLike } from "@/features/core/utils/sql";
import { logUserAction } from "@/features/admin/utils/audit";
import { generateETag, isNotModified, notModifiedResponse, setETag } from "@/features/core/utils/etag";
import { logCrash } from "@/features/core/utils/crash-reporter";
import { logErrorToFile } from "@/features/core/utils/file-logger";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export async function GET(request: Request) {
  const session = await getAuth(request);
  const { searchParams } = new URL(request.url);
  const visibility = searchParams.get("visibility");
  const query = searchParams.get("q") ?? "";
  const page = getSafePage(searchParams.get("page"));
  const sort = searchParams.get("sort") || "createdAt";
  const order = searchParams.get("order") || "desc";
  const tagsParam = searchParams.get("tags");
  const offset = (page - 1) * PAGE_SIZE;
  const recent = searchParams.get("recent") === "true";

  if (!session && visibility !== "PUBLIC") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (recent && session) {
    const whereClause = and(
      eq(snippets.authorId, session.user.id),
      isNull(snippets.deletedAt)
    );

    const recentResults = await db.select().from(snippets)
      .where(whereClause)
      .orderBy(desc(snippets.updatedAt))
      .limit(5)
      .all();

    const recentIds = recentResults.map(s => s.id);
    const recentFiles = recentIds.length > 0
      ? await db.select().from(snippetFiles).where(inArray(snippetFiles.snippetId, recentIds)).all()
      : [];

    const recentFavs = session ? await db.select().from(userFavorites).where(and(eq(userFavorites.userId, session.user.id), inArray(userFavorites.snippetId, recentIds))).all() : [];
    const recentFavoriteSet = new Set(recentFavs.map(f => f.snippetId));

    return NextResponse.json({
      snippets: recentResults.map((s) => {
        const sFiles = recentFiles.filter(f => f.snippetId === s.id);
        return {
          id: s.id,
          title: s.title,
          description: s.description,
          language: sFiles[0]?.language ?? "plaintext",
          tags: s.tags,
          visibility: s.visibility,
          totalLines: s.totalLines,
          isPinned: s.isPinned,
          isFavorited: recentFavoriteSet.has(s.id),
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        };
      }),
      page: 1,
      hasMore: false,
    });
  }

  const baseQuery = db.select().from(snippets);

  const conditions = [];
  conditions.push(isNull(snippets.deletedAt));

  if (visibility === "PUBLIC") {
    conditions.push(eq(snippets.visibility, "PUBLIC"));
    conditions.push(or(isNull(snippets.expiresAt), gt(snippets.expiresAt, new Date()))!);
  } else if (session) {
    conditions.push(eq(snippets.authorId, session.user.id));
  }

  if (tagsParam) {
    const tagsList = tagsParam.split(",").map(t => t.trim().toLowerCase()).filter(t => t.length > 0);
    for (const tag of tagsList) {
      conditions.push(like(snippets.tags, `%${escapeLike(tag)}%`));
    }
  }

  const includeCode = searchParams.get("includeCode") === "true";

  if (query) {
    const escapedQuery = escapeLike(query);
    
    const fileSubquery = db.select({ snippetId: snippetFiles.snippetId }).from(snippetFiles)
      .where(
        includeCode
          ? or(
              like(snippetFiles.language, `%${escapedQuery}%`),
              like(snippetFiles.code, `%${escapedQuery}%`)
            )
          : like(snippetFiles.language, `%${escapedQuery}%`)
      );
    
    const searchConditions = [
      like(snippets.title, `%${escapedQuery}%`),
      like(snippets.tags, `%${escapedQuery}%`),
      inArray(snippets.id, fileSubquery),
    ];

    conditions.push(or(...searchConditions)!);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  let orderByCondition = desc(snippets.createdAt);
  if (sort === "title") {
    orderByCondition = order === "asc" ? sql`${snippets.title} collate nocase asc` : sql`${snippets.title} collate nocase desc`;
  } else if (sort === "totalLines") {
    orderByCondition = order === "asc" ? sql`${snippets.totalLines} asc` : sql`${snippets.totalLines} desc`;
  } else {
    orderByCondition = order === "asc" ? sql`${snippets.isPinned} asc, ${snippets.createdAt} asc` : sql`${snippets.isPinned} desc, ${snippets.createdAt} desc`;
  }

  const results = await (whereClause
    ? baseQuery.where(whereClause).orderBy(orderByCondition).limit(PAGE_SIZE).offset(offset)
    : baseQuery.orderBy(orderByCondition).limit(PAGE_SIZE).offset(offset)
  ).all();

  const snippetIds = results.map(s => s.id);
  const files = snippetIds.length > 0 
    ? await db.select().from(snippetFiles).where(inArray(snippetFiles.snippetId, snippetIds)).all()
    : [];

  const favoriteSet = new Set<string>();
  if (session && snippetIds.length > 0) {
    const favs = await db.select().from(userFavorites).where(and(eq(userFavorites.userId, session.user.id), inArray(userFavorites.snippetId, snippetIds))).all();
    favs.forEach(f => favoriteSet.add(f.snippetId));
  }

  const latestUpdate = results.reduce<Date | null>(
    (acc, s) => (!acc || s.updatedAt > acc ? s.updatedAt : acc),
    null
  );
  const etag = generateETag(
    latestUpdate ?? "",
    visibility ?? "",
    query,
    tagsParam ?? "",
    includeCode ? "1" : "0",
    sort,
    order,
    String(page)
  );

  if (isNotModified(request, etag)) {
    return notModifiedResponse(etag);
  }

  const response = NextResponse.json({
    snippets: results.map((s) => {
      const sFiles = files.filter(f => f.snippetId === s.id);
      return {
        id: s.id,
        title: s.title,
        description: s.description,
        language: sFiles[0]?.language ?? "plaintext",
        tags: s.tags,
        visibility: s.visibility,
        totalLines: s.totalLines,
        isPinned: s.isPinned,
        isFavorited: favoriteSet.has(s.id),
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      };
    }),
    page,
    hasMore: results.length === PAGE_SIZE,
  });
  setETag(response, etag);
  return response;
}

export async function POST(request: Request) {
  if (!verifyCsrf(request)) {
    return NextResponse.json({ error: "Invalid CSRF token or Origin" }, { status: 403 });
  }

  const session = await getAuth(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  try {
    const settings = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).get();
    const maxSnippets = settings?.maxSnippetsPerUser ?? 1000;
    const maxChars = settings?.maxCharsPerSnippet ?? 250000;
    const body = await request.json();
    const parsed = snippetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { title, description, code, language, tags, visibility, files, password, expiresAt } = parsed.data;

    let totalChars = 0;
    let totalLines = 0;
    const filesToInsert = files ?? [{ filename: "index", code: code!, language: language! }];
    
    for (const f of filesToInsert) {
      if (!f.code || !f.language) {
        return NextResponse.json({ error: "Missing code or language in file" }, { status: 400 });
      }
      totalChars += f.code.length;
      totalLines += f.code.split('\n').length;
    }

    if (totalChars > maxChars) {
      return NextResponse.json({ error: `Snippet total code too long (Max: ${maxChars} chars)` }, { status: 400 });
    }

    const normalizedTags = tags?.map((t) => t.toLowerCase()) ?? null;
    const passwordHash = password ? await hashPassword(password) : null;
    
    const combinedCode = filesToInsert.map(f => f.code).join("");
    const contentHash = crypto.createHash("sha256").update(combinedCode).digest("hex");
    
    let snippetData: typeof snippets.$inferInsert;

    db.transaction((tx) => {
      // 1. Duplicate check inside the transaction block with database lock.
      // This prevents race conditions under rapid concurrent API requests.
      if (body.ignoreDuplicate !== true) {
        const existing = tx.select({ id: snippets.id }).from(snippets).where(
          and(eq(snippets.authorId, session.user.id), eq(snippets.contentHash, contentHash), isNull(snippets.deletedAt))
        ).get();
        
        if (existing) {
          const err = new Error("DUPLICATE_SNIPPET") as Error & { existingId: string };
          err.existingId = existing.id;
          throw err;
        }
      }

      // 2. User Quota count check
      const currentCount = tx.select({ c: count() }).from(snippets).where(and(eq(snippets.authorId, session.user.id), isNull(snippets.deletedAt))).get();
      if (currentCount && currentCount.c >= maxSnippets) {
        throw new Error(`Snippet quota exceeded (Max: ${maxSnippets})`);
      }

      const expiresDate = expiresAt ? new Date(expiresAt) : null;
      const validExpiresDate = (expiresDate && !isNaN(expiresDate.getTime())) ? expiresDate : null;

      snippetData = {
        id: generateId(),
        title,
        description: description ?? null,
        tags: normalizedTags,
        authorId: session.user.id,
        visibility,
        shareToken: visibility === "SHARED" ? generateShareToken() : null,
        totalLines,
        contentHash,
        passwordHash,
        expiresAt: validExpiresDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      tx.insert(snippets).values(snippetData).run();

      for (const f of filesToInsert) {
        tx.insert(snippetFiles).values({
          id: generateId(),
          snippetId: snippetData.id,
          filename: f.filename,
          code: f.code,
          language: f.language
        }).run();
      }
      
      tx.update(siteStatistics)
        .set({ totalSnippetsCreated: sql`total_snippets_created + 1` })
        .where(eq(siteStatistics.id, 1)).run();
    });

    await logUserAction(
      session.user.id,
      "CREATE",
      "SNIPPET",
      snippetData!.id,
      `Snippet "${title}" created`
    );

    if (visibility === "PUBLIC") {
      revalidatePath("/");
      revalidatePath("/public");
      revalidatePath("/stats");
    }

    return NextResponse.json({ 
      success: true, 
      id: snippetData!.id, 
      shareToken: snippetData!.shareToken ?? undefined 
    }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "DUPLICATE_SNIPPET") {
      const existingId = (error as { existingId?: string }).existingId;
      return NextResponse.json({ error: "Duplicate snippet detected", isDuplicate: true, existingId }, { status: 409 });
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Snippets API Error]", message, error instanceof Error ? error.stack : undefined);
    
    await logCrash(error instanceof Error ? error : new Error(message), request.url);
    logErrorToFile(error, "POST /api/snippets");

    if (message.includes("quota exceeded")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      isDev
        ? { error: "Internal Server Error", details: message }
        : { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
