import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { db } from "@/db";
import { siteStatistics } from "@/db/schema";
import { requireAdmin } from "@/features/admin/utils/admin-guard";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireAdmin();
  if ("unauthorized" in guard) return guard.unauthorized;
  if ("forbidden" in guard) return guard.forbidden;

  const stats = await db.select().from(siteStatistics).where(eq(siteStatistics.id, 1)).get();

  const dbPath = path.resolve(process.cwd(), process.env.DATABASE_URL?.replace("file:", "") ?? "./data/koalasnippets.db");
  let dbSize = 0;
  if (fs.existsSync(dbPath)) {
    dbSize = fs.statSync(dbPath).size;
  }

  return NextResponse.json({
    totalUsersCreated: stats?.totalUsersCreated ?? 0,
    totalSnippetsCreated: stats?.totalSnippetsCreated ?? 0,
    dbSize,
  });
}
