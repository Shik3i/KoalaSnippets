import { NextResponse } from "next/server";
import { db } from "@/db";
import { userFavorites, snippets, snippetFiles } from "@/db/schema";
import { getAuth } from "@/features/auth/utils/session";
import { eq, desc, and, inArray, isNull, gt, or } from "drizzle-orm";
import { getSafePage } from "@/features/core/utils/security";
import { generateETag, isNotModified, notModifiedResponse, setETag } from "@/features/core/utils/etag";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export async function GET(request: Request) {
  const session = await getAuth(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = getSafePage(searchParams.get("page"));
  const offset = (page - 1) * PAGE_SIZE;

  const favorites = await db
    .select({
      snippetId: userFavorites.snippetId,
      favoritedAt: userFavorites.createdAt,
    })
    .from(userFavorites)
    .where(eq(userFavorites.userId, session.user.id))
    .orderBy(desc(userFavorites.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  if (favorites.length === 0) {
    const etag = generateETag("favorites", session.user.id, String(page));
    if (isNotModified(request, etag)) return notModifiedResponse(etag);
    const response = NextResponse.json({ snippets: [], page, hasMore: false, total: 0 });
    setETag(response, etag);
    return response;
  }

  const snippetIds = favorites.map(f => f.snippetId);
  const favoriteMap = new Map(favorites.map(f => [f.snippetId, f.favoritedAt]));

  const snippetResults = await db
    .select()
    .from(snippets)
    .where(and(inArray(snippets.id, snippetIds), isNull(snippets.deletedAt)));

  const files = snippetResults.length > 0
    ? await db.select().from(snippetFiles).where(inArray(snippetFiles.snippetId, snippetIds)).all()
    : [];

  const latestUpdate = snippetResults.reduce<Date | null>(
    (acc, s) => (!acc || s.updatedAt > acc ? s.updatedAt : acc),
    null
  );

  const etag = generateETag(latestUpdate?.toISOString() ?? "", session.user.id, String(page));
  if (isNotModified(request, etag)) return notModifiedResponse(etag);

  const response = NextResponse.json({
    snippets: snippetResults.map((s) => {
      const sFiles = files.filter(f => f.snippetId === s.id);
      return {
        id: s.id,
        title: s.title,
        description: s.description,
        language: sFiles[0]?.language ?? "plaintext",
        tags: s.tags,
        visibility: s.visibility,
        totalLines: s.totalLines,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        isFavorited: true,
      };
    }),
    page,
    hasMore: favorites.length === PAGE_SIZE,
    total: favorites.length,
  });
  setETag(response, etag);
  return response;
}
