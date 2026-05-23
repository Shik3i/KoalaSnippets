import { getSession } from "@/features/auth/utils/session";
import { Sidebar } from "@/features/core/components/sidebar";
import { SnippetSearchHeader } from "@/features/snippets/components/search-header";
import { DashboardContent } from "@/features/snippets/components/dashboard-content";
import { highlightCode } from "@/features/snippets/utils/shiki";
import { db } from "@/db";
import { snippets, snippetFiles, users } from "@/db/schema";
import { eq, desc, asc, and, inArray } from "drizzle-orm";
import { cookies } from "next/headers";
import { buildSnippetConditions } from "@/features/snippets/utils/filters";

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ q?: string; includeCode?: string; sort?: string; tags?: string; language?: string; filterMode?: string }> }) {
  const { q, includeCode, sort, tags, language, filterMode } = await searchParams;
  const session = await getSession();

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
  
  const conditions = await buildSnippetConditions({
    q,
    includeCode,
    tags,
    language,
    filterMode,
    visibility: "PUBLIC",
  });

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

  const allPublicSnippets = await db.select({ tags: snippets.tags }).from(snippets).where(eq(snippets.visibility, "PUBLIC")).all();
  const allPublicFiles = await db.select({ language: snippetFiles.language }).from(snippetFiles).where(
    inArray(snippetFiles.snippetId, db.select({ id: snippets.id }).from(snippets).where(eq(snippets.visibility, "PUBLIC")))
  ).all();
  const sidebarTags = [...new Set(allPublicSnippets.flatMap((s) => s.tags ?? []))].sort();
  const sidebarLanguages = [...new Set(allPublicFiles.map((f) => f.language))].sort();

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
      <Sidebar
        tags={sidebarTags}
        languages={sidebarLanguages}
        isAuthenticated={!!session}
        isAdmin={session?.user.role === "ADMIN"}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <SnippetSearchHeader availableTags={sidebarTags} availableLanguages={sidebarLanguages} sort={sortMode} viewMode={viewMode} resultCount={highlightedSnippets.length} />
        <DashboardContent
          snippets={highlightedSnippets.map((s) => ({
            ...s,
            visibility: s.visibility as "PRIVATE" | "SHARED" | "PUBLIC",
          }))}
          viewMode={viewMode}
          density={density}
          allowSelection={false}
        />
      </div>
    </div>
  );
}
