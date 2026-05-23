import { db } from "@/db";
import { snippets, snippetFiles, users, siteStatistics } from "@/db/schema";
import { eq, sql, count, desc } from "drizzle-orm";

export interface PublicStats {
  totalUsersCreated: number;
  totalSnippetsCreated: number;
  totalSnippets: number;
  totalUsers: number;
  totalLines: number;
  totalDifferentTags: number;
  totalLanguages: number;
  popularLanguage: string;
  popularLanguageCount: number;
  averageLines: number;
  visibility: {
    public: number;
    private: number;
    shared: number;
  };
  languagesBreakdown: {
    language: string;
    count: number;
  }[];
}

/**
 * Computes public platform statistics dynamically from the database.
 */
export async function getPublicStats(): Promise<PublicStats> {
  // 1. Lifetime counters from the singleton siteStatistics table
  const lifetimeStats = await db.select().from(siteStatistics).where(eq(siteStatistics.id, 1)).get();

  // 2. Total active snippets currently in the database
  const totalSnippetsRes = await db.select({ count: count() }).from(snippets).get();
  const totalSnippets = totalSnippetsRes?.count ?? 0;

  // 3. Total active registered users in the database
  const totalUsersRes = await db.select({ count: count() }).from(users).get();
  const totalUsers = totalUsersRes?.count ?? 0;

  // 4. Total lines of code summed across all snippets
  const totalLinesRes = await db.select({ total: sql<number>`SUM(${snippets.totalLines})` }).from(snippets).get();
  const totalLines = Number(totalLinesRes?.total ?? 0);

  // 5. Total unique tags populated across all active snippets
  const allTagsResult = await db.select({ tags: snippets.tags }).from(snippets).all();
  const uniqueTags = new Set<string>();
  for (const row of allTagsResult) {
    if (row.tags && Array.isArray(row.tags)) {
      row.tags.forEach(tag => {
        if (tag && typeof tag === 'string') {
          const trimmed = tag.trim().toLowerCase();
          if (trimmed.length > 0) {
            uniqueTags.add(trimmed);
          }
        }
      });
    }
  }
  const totalDifferentTags = uniqueTags.size;

  // 6. Programming languages aggregated from all files in snippets
  const languagesStats = await db
    .select({
      language: snippetFiles.language,
      count: sql<number>`COUNT(*)`
    })
    .from(snippetFiles)
    .groupBy(snippetFiles.language)
    .orderBy(desc(sql`COUNT(*)`))
    .all();

  const totalLanguages = languagesStats.length;
  const popularLanguage = languagesStats[0]?.language ?? "None";
  const popularLanguageCount = Number(languagesStats[0]?.count ?? 0);

  // 7. Mathematical average of lines of code per snippet
  const avgLinesRes = await db.select({ avg: sql<number>`AVG(${snippets.totalLines})` }).from(snippets).get();
  const averageLines = Math.round(avgLinesRes?.avg ?? 0);

  // 8. Visibility breakdown (Public vs Private vs Shared)
  const visibilityStats = await db
    .select({
      visibility: snippets.visibility,
      count: sql<number>`COUNT(*)`
    })
    .from(snippets)
    .groupBy(snippets.visibility)
    .all();

  let publicCount = 0;
  let privateCount = 0;
  let sharedCount = 0;
  for (const dist of visibilityStats) {
    if (dist.visibility === "PUBLIC") publicCount = Number(dist.count);
    else if (dist.visibility === "PRIVATE") privateCount = Number(dist.count);
    else if (dist.visibility === "SHARED") sharedCount = Number(dist.count);
  }

  return {
    totalUsersCreated: lifetimeStats?.totalUsersCreated ?? 0,
    totalSnippetsCreated: lifetimeStats?.totalSnippetsCreated ?? 0,
    totalSnippets,
    totalUsers,
    totalLines,
    totalDifferentTags,
    totalLanguages,
    popularLanguage,
    popularLanguageCount,
    averageLines,
    visibility: {
      public: publicCount,
      private: privateCount,
      shared: sharedCount,
    },
    languagesBreakdown: languagesStats.map((s) => ({
      language: s.language,
      count: Number(s.count),
    })),
  };
}
