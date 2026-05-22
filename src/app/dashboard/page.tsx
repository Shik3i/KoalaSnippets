import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSession } from "@/features/auth/utils/session";
import { Sidebar } from "@/features/core/components/sidebar";
import { SnippetSearchHeader } from "@/features/snippets/components/search-header";
import { DashboardContent } from "@/features/snippets/components/dashboard-content";
import { highlightCode } from "@/features/snippets/utils/shiki";
import { db } from "@/db";
import { snippets } from "@/db/schema";
import { eq, desc, asc, like, or, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { escapeLike } from "@/features/core/utils/sql";

export const dynamic = "force-dynamic";

interface DashboardSearchParams {
  q?: string;
  includeCode?: string;
  sort?: string;
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<DashboardSearchParams> }) {
  const session = await getSession();
  if (!session) {
    redirect("/login?expired=1");
  }

  const { q, includeCode, sort } = await searchParams;
  const query = q ?? "";
  const escapedQuery = escapeLike(query);
  const includeCodeBool = includeCode === "true";
  const sortMode = (["newest", "oldest", "alphabetical"].includes(sort ?? "") ? sort : "newest") as "newest" | "oldest" | "alphabetical";

  const baseQuery = db.select().from(snippets);
  const conditions = [eq(snippets.authorId, session.user.id)];

  if (query) {
    const searchConditions = [
      like(snippets.title, `%${escapedQuery}%`),
      like(snippets.language, `%${escapedQuery}%`),
      sql`snippets.tags LIKE ${`%${escapedQuery}%`}`,
    ];
    if (includeCodeBool) {
      searchConditions.push(like(snippets.code, `%${escapedQuery}%`));
    }
    const searchOr = or(...searchConditions);
    if (searchOr) {
      conditions.push(searchOr);
    }
  }

  const orderBy =
    sortMode === "oldest"
      ? asc(snippets.createdAt)
      : sortMode === "alphabetical"
        ? asc(snippets.title)
        : desc(snippets.createdAt);

  const whereClause = and(...conditions);
  const userSnippets = await (whereClause
    ? baseQuery.where(whereClause).orderBy(orderBy).all()
    : baseQuery.orderBy(orderBy).all()
  );

  const languages = [...new Set(userSnippets.map((s) => s.language))].sort();
  const allTags = [...new Set(userSnippets.flatMap((s) => s.tags ?? []))].sort();

  const density = session?.user?.preferences?.snippetDensity ?? "compact";
  const syntaxTheme = session?.user?.preferences?.syntaxTheme ?? "github-dark";

  const highlightedSnippets = await Promise.all(
    userSnippets.map(async (s) => {
      if (density === "compact") {
        return { ...s, highlightedCode: undefined };
      }
      let codeToHighlight = s.code;
      if (density === "preview") {
        const lines = s.code.split("\n");
        codeToHighlight = lines.slice(0, 5).join("\n") + (lines.length > 5 ? "\n..." : "");
      }
      try {
        const hl = await highlightCode(codeToHighlight, s.language, syntaxTheme);
        return { ...s, highlightedCode: hl };
      } catch (err) {
        console.error("Failed to highlight code server-side inside list", err);
        return { ...s, highlightedCode: undefined };
      }
    })
  );

  const cookieStore = await cookies();
  const viewMode = (cookieStore.get("snippet_view")?.value === "table" ? "table" : "grid") as "grid" | "table";

  return (
    <div className="flex h-screen">
      <Sidebar
        tags={allTags}
        languages={languages}
        isAuthenticated={true}
        isAdmin={session.user.role === "ADMIN"}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <SnippetSearchHeader />
        <DashboardContent
          snippets={highlightedSnippets.map((s) => ({
            ...s,
            visibility: s.visibility as "PRIVATE" | "SHARED" | "PUBLIC",
          }))}
          viewMode={viewMode}
          sort={sortMode}
          density={density}
        />
      </div>
    </div>
  );
}
