import { getSession } from "@/features/auth/utils/session";
import { Sidebar } from "@/features/core/components/sidebar";
import { SnippetCard } from "@/features/snippets/components/snippet-card";
import { SnippetSearchHeader } from "@/features/snippets/components/search-header";
import { highlightCode } from "@/features/snippets/utils/shiki";
import { db } from "@/db";
import { snippets, snippetFiles } from "@/db/schema";
import { eq, desc, like, or, and, inArray } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { escapeLike } from "@/features/core/utils/sql";

export const dynamic = "force-dynamic";

export default async function PublicPage({ searchParams }: { searchParams: Promise<{ q?: string; includeCode?: string }> }) {
  const session = await getSession();
  const { q, includeCode } = await searchParams;
  const query = q ?? "";
  const escapedQuery = escapeLike(query);
  const includeCodeBool = includeCode === "true";

  const baseQuery = db.select().from(snippets);
  const conditions = [eq(snippets.visibility, "PUBLIC")];

  let matchingSnippetIds = new Set<string>();
  if (query) {
    let fileQuery = db.select({ snippetId: snippetFiles.snippetId }).from(snippetFiles)
      .where(like(snippetFiles.language, `%${escapedQuery}%`));
    
    if (includeCodeBool) {
      fileQuery = db.select({ snippetId: snippetFiles.snippetId }).from(snippetFiles)
        .where(or(
          like(snippetFiles.language, `%${escapedQuery}%`),
          like(snippetFiles.code, `%${escapedQuery}%`)
        ));
    }
    
    const matchedFiles = await fileQuery.all();
    matchedFiles.forEach(f => matchingSnippetIds.add(f.snippetId));

    const searchConditions = [
      like(snippets.title, `%${escapedQuery}%`),
      sql`snippets.tags LIKE ${`%${escapedQuery}%`}`,
    ];
    if (matchingSnippetIds.size > 0) {
      searchConditions.push(inArray(snippets.id, Array.from(matchingSnippetIds)));
    }
    conditions.push(or(...searchConditions)!);
  }

  const whereClause = and(...conditions);
  const publicSnippets = await (whereClause
    ? baseQuery.where(whereClause).orderBy(desc(snippets.createdAt)).all()
    : baseQuery.orderBy(desc(snippets.createdAt)).all()
  );

  const snippetIds = publicSnippets.map(s => s.id);
  const files = snippetIds.length > 0 
    ? await db.select().from(snippetFiles).where(inArray(snippetFiles.snippetId, snippetIds)).all()
    : [];

  const publicSnippetsWithFiles = publicSnippets.map(s => {
    return {
      ...s,
      files: files.filter(f => f.snippetId === s.id)
    };
  });

  const languages = [...new Set(files.map((f) => f.language))].sort();
  const allTags = [...new Set(publicSnippetsWithFiles.flatMap((s) => s.tags ?? []))].sort();

  const density = session?.user?.preferences?.snippetDensity ?? "compact";
  const syntaxTheme = session?.user?.preferences?.syntaxTheme ?? "github-dark";

  const highlightedSnippets = await Promise.all(
    publicSnippetsWithFiles.map(async (s) => {
      const mainFile = s.files[0];
      if (!mainFile) return { ...s, highlightedCode: undefined, language: "plaintext" };

      if (density === "compact") {
        return { ...s, highlightedCode: undefined, language: mainFile.language };
      }
      
      let codeToHighlight = mainFile.code;
      if (density === "preview") {
        const lines = mainFile.code.split("\n");
        codeToHighlight = lines.slice(0, 5).join("\n") + (lines.length > 5 ? "\n..." : "");
      }
      try {
        const hl = await highlightCode(codeToHighlight, mainFile.language, syntaxTheme);
        return { ...s, highlightedCode: hl, language: mainFile.language };
      } catch (err) {
        console.error("Failed to highlight code server-side inside list", err);
        return { ...s, highlightedCode: undefined, language: mainFile.language };
      }
    })
  );

  return (
    <div className="flex h-screen">
      <Sidebar tags={allTags} languages={languages} isAuthenticated={!!session} isAdmin={session?.user.role === "ADMIN"} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <SnippetSearchHeader />

        <div className="flex-1 overflow-y-auto p-4">
          {highlightedSnippets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p className="text-lg mb-2">No public snippets</p>
              <p className="text-sm">Public snippets will appear here</p>
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
                  visibility="PUBLIC"
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
