import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/utils/session";
import { Sidebar } from "@/features/core/components/sidebar";
import { SnippetCard } from "@/features/snippets/components/snippet-card";
import { SnippetSearchHeader } from "@/features/snippets/components/search-header";
import { highlightCode } from "@/features/snippets/utils/shiki";
import { db } from "@/db";
import { snippets } from "@/db/schema";
import { eq, desc, like, or, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { escapeLike } from "@/features/core/utils/sql";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ q?: string; includeCode?: string }> }) {
  const session = await getSession();
  if (!session) {
    redirect("/login?expired=1");
  }

  const { q, includeCode } = await searchParams;
  const query = q ?? "";
  const escapedQuery = escapeLike(query);
  const includeCodeBool = includeCode === "true";

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

  const whereClause = and(...conditions);
  const userSnippets = await (whereClause
    ? baseQuery.where(whereClause).orderBy(desc(snippets.createdAt)).all()
    : baseQuery.orderBy(desc(snippets.createdAt)).all()
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

        <div className="flex-1 overflow-y-auto p-4">
          {highlightedSnippets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p className="text-lg mb-2">No snippets yet</p>
              <p className="text-sm">Click &quot;New Snippet&quot; to create your first one</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {highlightedSnippets.map((s) => (
                <SnippetCard
                  key={s.id}
                  id={s.id}
                  title={s.title}
                  description={s.description ?? undefined}
                  language={s.language}
                  tags={s.tags ?? undefined}
                  visibility={s.visibility as "PRIVATE" | "SHARED" | "PUBLIC"}
                  createdAt={s.createdAt}
                  snippetDensity={density}
                  highlightedCode={s.highlightedCode}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
