import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSession } from "@/features/auth/utils/session";
import { Sidebar } from "@/features/core/components/sidebar";
import { SnippetSearchHeader } from "@/features/snippets/components/search-header";
import { DashboardContent } from "@/features/snippets/components/dashboard-content";
import { highlightCode } from "@/features/snippets/utils/shiki";
import { GlobalDropzone } from "@/features/core/components/global-dropzone";
import { db } from "@/db";
import { snippets, snippetFiles } from "@/db/schema";
import { eq, desc, asc, and, inArray } from "drizzle-orm";
import { buildSnippetConditions } from "@/features/snippets/utils/filters";

export const dynamic = "force-dynamic";

interface DashboardSearchParams {
  q?: string;
  includeCode?: string;
  sort?: string;
  collection?: string;
  tags?: string;
  language?: string;
  filterMode?: string;
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<DashboardSearchParams> }) {
  const session = await getSession();
  if (!session) {
    redirect("/login?expired=1");
  }

  const { q, includeCode, sort, collection, tags, language, filterMode } = await searchParams;
  const sortMode = (["newest", "oldest", "alphabetical", "size-asc", "size-desc"].includes(sort ?? "") ? sort : "newest") as "newest" | "oldest" | "alphabetical" | "size-asc" | "size-desc";

  const baseQuery = db.select().from(snippets);
  
  const conditions = await buildSnippetConditions({
    q,
    includeCode,
    tags,
    language,
    collection,
    filterMode,
    authorId: session.user.id,
  });

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
  const userSnippets = await (whereClause
    ? baseQuery.where(whereClause).orderBy(orderBy).limit(50).all()
    : baseQuery.orderBy(orderBy).limit(50).all()
  );

  const snippetIds = userSnippets.map(s => s.id);
  const files = snippetIds.length > 0 
    ? await db.select().from(snippetFiles).where(inArray(snippetFiles.snippetId, snippetIds)).all()
    : [];

  const userSnippetsWithFiles = userSnippets.map(s => {
    return {
      ...s,
      files: files.filter(f => f.snippetId === s.id)
    };
  });

  const allUserSnippets = await db.select({ tags: snippets.tags }).from(snippets).where(eq(snippets.authorId, session.user.id)).all();
  const allUserFiles = await db.select({ language: snippetFiles.language }).from(snippetFiles).where(
    inArray(snippetFiles.snippetId, db.select({ id: snippets.id }).from(snippets).where(eq(snippets.authorId, session.user.id)))
  ).all();
  const sidebarTags = [...new Set(allUserSnippets.flatMap((s) => s.tags ?? []))].sort();
  const sidebarLanguages = [...new Set(allUserFiles.map((f) => f.language))].sort();

  const density = session?.user?.preferences?.snippetDensity ?? "preview";
  const syntaxTheme = session?.user?.preferences?.syntaxTheme ?? "github-dark";

  const highlightedSnippets = await Promise.all(
    userSnippetsWithFiles.map(async (s) => {
      // Just highlight the first file for the preview card
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
      <GlobalDropzone />
      <Sidebar
        tags={sidebarTags}
        languages={sidebarLanguages}
        isAuthenticated={true}
        isAdmin={session.user.role === "ADMIN"}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <SnippetSearchHeader availableTags={sidebarTags} availableLanguages={sidebarLanguages} sort={sortMode} viewMode={viewMode} resultCount={highlightedSnippets.length} />
        <DashboardContent
          snippets={highlightedSnippets.map((s) => ({
            ...s,
            visibility: s.visibility as "PRIVATE" | "SHARED" | "PUBLIC",
            authorUsername: session.user.username,
          }))}
          viewMode={viewMode}
          density={density}
          hasMoreInitial={highlightedSnippets.length === 50}
        />
      </div>
    </div>
  );
}
