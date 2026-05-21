import { NextResponse } from "next/server";
import { db } from "@/db";
import { siteStatistics } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const stats = await db.select().from(siteStatistics).where(eq(siteStatistics.id, 1)).get();

  return NextResponse.json({
    totalUsersCreated: stats?.totalUsersCreated ?? 0,
    totalSnippetsCreated: stats?.totalSnippetsCreated ?? 0,
  });
}
