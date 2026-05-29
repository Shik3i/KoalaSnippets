import { unstable_cache } from "next/cache";
import { Sidebar } from "@/features/core/components/sidebar";
import { PublicStatsCards } from "@/features/core/components/public-stats-cards";
import { getPublicStats } from "@/features/core/utils/stats";
import { Github } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Statistics | KoalaSnippets",
  description: "Community statistics for KoalaSnippets",
};

const getCachedStats = unstable_cache(
  async () => getPublicStats(),
  ["public-stats"],
  { revalidate: 300 }
);

export default async function StatsPage() {
  const stats = await getCachedStats();

  return (
    <div className="flex h-screen">
      <Sidebar isAuthenticated={false} isAdmin={false} />

      <div className="flex-1 overflow-auto p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <PublicStatsCards stats={stats} />
          <div className="mt-12 text-center">
            <a
              href="https://github.com/Shik3i/KoalaSnippets"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github size={14} suppressHydrationWarning />
              <span>KoalaSnippets</span>
              {process.env.NEXT_PUBLIC_APP_VERSION && (
                <span className="font-mono tabular-nums bg-muted/50 px-2 py-0.5 rounded border border-border">
                  {process.env.NEXT_PUBLIC_APP_VERSION.startsWith("v")
                    ? process.env.NEXT_PUBLIC_APP_VERSION
                    : `v${process.env.NEXT_PUBLIC_APP_VERSION}`}
                </span>
              )}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
