import { db } from "@/db";
import { siteStatistics } from "@/db/schema";
import { Sidebar } from "@/components/layout/sidebar";
import { PublicStatsCards } from "@/components/stats/public-stats-cards";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Statistics | KoalaSnippets",
  description: "Community statistics for KoalaSnippets",
};

export default async function StatsPage() {
  const stats = await db.select().from(siteStatistics).where(eq(siteStatistics.id, 1)).get();

  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Community Statistics</h1>
            <p className="text-muted-foreground">
              Lifetime metrics for the KoalaSnippets community
            </p>
          </div>

          <PublicStatsCards
            totalUsersCreated={stats?.totalUsersCreated ?? 0}
            totalSnippetsCreated={stats?.totalSnippetsCreated ?? 0}
          />
        </div>
      </div>
    </div>
  );
}
