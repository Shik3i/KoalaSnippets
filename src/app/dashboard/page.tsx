import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Sidebar } from "@/components/layout/sidebar";
import { SnippetCard } from "@/components/snippets/snippet-card";
import { SnippetSearchHeader } from "@/components/snippets/search-header";
import { db } from "@/db";
import { snippets } from "@/db/schema";
import { eq, desc, like, or, and } from "drizzle-orm";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ q?: string; includeCode?: string }> }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { q, includeCode } = await searchParams;
  const query = q ?? "";
  const includeCodeBool = includeCode === "true";

  const baseQuery = db.select().from(snippets);
  let conditions = [eq(snippets.authorId, session.user.id)];

  if (query) {
    const searchConditions = [
      like(snippets.title, `%${query}%`),
      like(snippets.language, `%${query}%`),
      sql`snippets.tags LIKE ${`%${query}%`}`,
    ];
    if (includeCodeBool) {
      searchConditions.push(like(snippets.code, `%${query}%`));
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

  return (
    <div className="flex h-screen">
      <Sidebar
        tags={allTags}
        languages={languages}
        isAuthenticated={true}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <SnippetSearchHeader />

        <div className="flex-1 overflow-y-auto p-4">
          {userSnippets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p className="text-lg mb-2">No snippets yet</p>
              <p className="text-sm">Click &quot;New Snippet&quot; to create your first one</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userSnippets.map((s) => (
                <SnippetCard
                  key={s.id}
                  id={s.id}
                  title={s.title}
                  description={s.description ?? undefined}
                  language={s.language}
                  tags={s.tags ?? undefined}
                  visibility={s.visibility as "PRIVATE" | "SHARED" | "PUBLIC"}
                  createdAt={s.createdAt}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
