import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { db } from "@/db";
import { siteStatistics, snippetFiles } from "@/db/schema";
import { requireAdmin } from "@/features/admin/utils/admin-guard";
import { eq, desc, sql } from "drizzle-orm";
import { generateETagFromData, isNotModified, notModifiedResponse, setETag } from "@/features/core/utils/etag";

export const dynamic = "force-dynamic";

const SERVER_START_TIME = Date.now();

function getLastBackupTime(): string | null {
  const backupDir = process.env.BACKUP_DIR ?? path.join(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) return null;
  const files = fs.readdirSync(backupDir).filter((f) => f.startsWith("backup-") && f.endsWith(".db"));
  if (files.length === 0) return null;
  const sorted = files.sort((a, b) => b.localeCompare(a));
  const dateStr = sorted[0].replace("backup-", "").replace(".db", "").replace(/T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z$/, "T$1:$2:$3.$4Z");
  return new Date(dateStr).toISOString();
}

function getUptimeSeconds(): number {
  return Math.floor((Date.now() - SERVER_START_TIME) / 1000);
}

export async function GET(request: Request) {
  const guard = await requireAdmin(request);
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

  const lastBackup = getLastBackupTime();
  const uptimeSeconds = getUptimeSeconds();

  const data = {
    totalUsersCreated: stats?.totalUsersCreated ?? 0,
    totalSnippetsCreated: stats?.totalSnippetsCreated ?? 0,
    dbSize,
    uptimeSeconds,
    lastBackup,
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
