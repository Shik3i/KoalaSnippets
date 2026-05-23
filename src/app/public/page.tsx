import { getSession } from "@/features/auth/utils/session";
import { Sidebar } from "@/features/core/components/sidebar";
import { SnippetSearchHeader } from "@/features/snippets/components/search-header";
import { DashboardContent } from "@/features/snippets/components/dashboard-content";
import { highlightCode } from "@/features/snippets/utils/shiki";
import { db } from "@/db";
import { snippets, snippetFiles, users } from "@/db/schema";
import { eq, desc, asc, like, or, and, inArray } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { escapeLike } from "@/features/core/utils/sql";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function PublicPage({ searchParams }: { searchParams: Promise<{ q?: string; includeCode?: string; sort?: string }> }) {
  const session = await getSession();
  const { q, includeCode, sort } = await searchParams;
  const query = q ?? "";
  const escapedQuery = escapeLike(query);
  const includeCodeBool = includeCode === "true";

  const baseQuery = db.select({
    id: snippets.id,
    title: snippets.title,
    description: snippets.description,
    tags: snippets.tags,
    visibility: snippets.visibility,
    createdAt: snippets.createdAt,
    updatedAt: snippets.updatedAt,
    authorUsername: users.username
  }).from(snippets).innerJoin(users, eq(snippets.authorId, users.id));
  const conditions = [eq(snippets.visibility, "PUBLIC")];

  const matchingSnippetIds = new Set<string>();
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

  const sortMode = (["newest", "oldest", "alphabetical", "size-asc", "size-desc"].includes(sort ?? "") ? sort : "newest") as "newest" | "oldest" | "alphabetical" | "size-asc" | "size-desc";

  const orderBy =
    sortMode === "oldest"
      ? asc(snippets.createdAt)
      : sortMode === "alphabetical"
        ? asc(snippets.title)
        : sortMode === "size-asc"
          ? asc(snippets.totalLines)
          : sortMode === "size-desc"
            ? desc(snippets.totalLines)
            : desc(snippets.createdAt);

  const whereClause = and(...conditions);
  const publicSnippets = await (whereClause
    ? baseQuery.where(whereClause).orderBy(orderBy).all()
    : baseQuery.orderBy(orderBy).all()
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

  const density = session?.user?.preferences?.snippetDensity ?? "preview";
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
  const cookieStore = await cookies();
  const viewMode = (cookieStore.get("snippet_view")?.value === "table" ? "table" : "grid") as "grid" | "table";

  return (
    <div className="flex h-screen">
      <Sidebar tags={allTags} languages={languages} isAuthenticated={!!session} isAdmin={session?.user.role === "ADMIN"} />

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
          allowSelection={false}
        />
      </div>
    </div>
  );
}
