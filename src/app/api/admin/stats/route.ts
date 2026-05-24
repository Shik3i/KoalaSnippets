import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { db } from "@/db";
import { siteStatistics, snippetFiles } from "@/db/schema";
import { requireAdmin } from "@/features/admin/utils/admin-guard";
import { eq, desc, sql } from "drizzle-orm";
import { generateETagFromData, isNotModified, notModifiedResponse, setETag } from "@/features/core/utils/etag";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if ("unauthorized" in guard) return guard.unauthorized;
  if ("forbidden" in guard) return guard.forbidden;

  const stats = await db.select().from(siteStatistics).where(eq(siteStatistics.id, 1)).get();

  const dbPath = path.resolve(process.cwd(), process.env.DATABASE_URL?.replace("file:", "") ?? "./data/koalasnippets.db");
  let dbSize = 0;
  if (fs.existsSync(dbPath)) {
    dbSize = fs.statSync(dbPath).size;
  }

  const languageStats = await db
    .select({
      language: snippetFiles.language,
      count: sql<number>`COUNT(*)`,
    })
    .from(snippetFiles)
    .groupBy(snippetFiles.language)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(10)
    .all();

  const data = {
    totalUsersCreated: stats?.totalUsersCreated ?? 0,
    totalSnippetsCreated: stats?.totalSnippetsCreated ?? 0,
    dbSize,
    languageBreakdown: languageStats.map((s) => ({
      language: s.language,
      count: Number(s.count),
    })),
  };

  const etag = generateETagFromData(data);

  if (isNotModified(request, etag)) {
    return notModifiedResponse(etag);
  }

  const response = NextResponse.json(data);
  setETag(response, etag);
  return response;
}
