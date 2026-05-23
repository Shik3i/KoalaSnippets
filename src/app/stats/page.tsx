import { getSession } from "@/features/auth/utils/session";
import { Sidebar } from "@/features/core/components/sidebar";
import { PublicStatsCards } from "@/features/core/components/public-stats-cards";
import { getPublicStats } from "@/features/core/utils/stats";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Statistics | KoalaSnippets",
  description: "Community statistics for KoalaSnippets",
};

export default async function StatsPage() {
  const session = await getSession();
  const stats = await getPublicStats();

  return (
    <div className="flex h-screen">
      <Sidebar isAuthenticated={!!session} isAdmin={session?.user.role === "ADMIN"} />

      <div className="flex-1 overflow-auto p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <PublicStatsCards stats={stats} />
        </div>
      </div>
    </div>
  );
}
