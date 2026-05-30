import { getSession } from "@/features/auth/utils/session";
import { Sidebar } from "@/features/core/components/sidebar";
import { SnippetSearchHeader } from "@/features/snippets/components/search-header";
import { DashboardContent } from "@/features/snippets/components/dashboard-content";
import { highlightCode } from "@/features/snippets/utils/shiki";
import { db } from "@/db";
import { snippets, snippetFiles, users } from "@/db/schema";
import { eq, desc, asc, and, inArray, or, isNull, isNotNull, ne } from "drizzle-orm";
import { cookies } from "next/headers";
import { buildSnippetConditions } from "@/features/snippets/utils/filters";

import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "KoalaSnippets",
  description: "Browse and search code snippets with syntax highlighting, tags, and filters. The self-hosted snippet manager for developers.",
  openGraph: {
    title: "KoalaSnippets — Code Snippet Manager",
    description: "Browse and search code snippets with syntax highlighting, tags, and filters.",
  },
};

export default async function HomePage({ searchParams }: { searchParams: Promise<{ q?: string; includeCode?: string; sort?: string; tags?: string; language?: string; filterMode?: string; visibility?: string; author?: string; authorMode?: string; pinned?: string; favorited?: string; minLines?: string; maxLines?: string; before?: string; after?: string; minFiles?: string; title?: string }> }) {
  const { q, includeCode, sort, tags, language, filterMode, visibility, author, authorMode, pinned, favorited, minLines, maxLines, before, after, minFiles, title } = await searchParams;
  const session = await getSession();

  const baseQuery = db.select({
    id: snippets.id,
    title: snippets.title,
    description: snippets.description,
    tags: snippets.tags,
    visibility: snippets.visibility,
    createdAt: snippets.createdAt,
    updatedAt: snippets.updatedAt,
    totalLines: snippets.totalLines,
    authorUsername: users.username
  }).from(snippets).innerJoin(users, eq(snippets.authorId, users.id));

  const conditions: (ReturnType<typeof eq>)[] = [];
  conditions.push(isNull(snippets.deletedAt));

  if (session) {
    conditions.push(or(
      eq(snippets.authorId, session.user.id),
      and(eq(snippets.visibility, "PUBLIC"), ne(snippets.authorId, session.user.id))
    )!);
  } else {
    conditions.push(eq(snippets.visibility, "PUBLIC"));
  }

  const textConditions = await buildSnippetConditions({
    q,
    includeCode,
    tags,
    language,
    filterMode,
    visibility: (visibility === "PUBLIC" || visibility === "PRIVATE" || visibility === "SHARED") ? visibility : undefined,
    authorUsername: author,
    authorUsernameMode: (authorMode === "exclude" ? "exclude" : "include"),
    pinned,
    favorited,
    minLines,
    maxLines,
    before,
    after,
    minFiles,
    title,
    currentUserId: session?.user?.id,
  });

  const activeAuthorsQuery = await db
    .selectDistinct({ username: users.username })
    .from(users)
    .innerJoin(snippets, eq(snippets.authorId, users.id))
    .where(isNull(snippets.deletedAt))
    .all();
  const availableAuthors = activeAuthorsQuery.map(a => a.username).sort();

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

  const allConditions = [...conditions, ...textConditions];
  const whereClause = and(...allConditions);
  const homeSnippets = await baseQuery.where(whereClause).orderBy(orderBy).limit(50).all();

  const snippetIds = homeSnippets.map(s => s.id);
  const files = snippetIds.length > 0 
    ? await db.select().from(snippetFiles).where(inArray(snippetFiles.snippetId, snippetIds)).all()
    : [];

  const homeSnippetsWithFiles = homeSnippets.map(s => ({
    ...s,
    files: files.filter(f => f.snippetId === s.id)
  }));

  const activePublicTags = await db.select({ tags: snippets.tags }).from(snippets).where(
    and(
      eq(snippets.visibility, "PUBLIC"),
      isNull(snippets.deletedAt),
      isNotNull(snippets.tags)
    )
  ).all();
  const publicLanguages = await db
    .selectDistinct({ language: snippetFiles.language })
    .from(snippetFiles)
    .innerJoin(snippets, eq(snippetFiles.snippetId, snippets.id))
    .where(
      and(
        eq(snippets.visibility, "PUBLIC"),
        isNull(snippets.deletedAt)
      )
    )
    .all();

  const sidebarTags = [...new Set(activePublicTags.flatMap((s) => s.tags ?? []))].sort();
  const sidebarLanguages = publicLanguages.map((f) => f.language).sort();

  const density = session?.user?.preferences?.snippetDensity ?? "preview";
  const syntaxTheme = session?.user?.preferences?.syntaxTheme ?? "github-dark";

  const highlightedSnippets = await Promise.all(
    homeSnippetsWithFiles.map(async (s) => {
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
        <SnippetSearchHeader availableTags={sidebarTags} availableLanguages={sidebarLanguages} availableAuthors={availableAuthors} isAuthenticated={!!session} sort={sortMode} viewMode={viewMode} resultCount={highlightedSnippets.length} />
        <DashboardContent
          snippets={highlightedSnippets.map((s) => ({
            id: (s as Record<string, unknown>).id as string,
            title: (s as Record<string, unknown>).title as string,
            description: (s as Record<string, unknown>).description as string | null,
            language: s.language as string ?? "plaintext",
            tags: (s as Record<string, unknown>).tags as string[] | null,
            visibility: ((s as Record<string, unknown>).visibility ?? "PUBLIC") as "PRIVATE" | "SHARED" | "PUBLIC",
            authorUsername: (s as Record<string, unknown>).authorUsername as string | undefined,
            totalLines: ((s as Record<string, unknown>).totalLines ?? 0) as number,
            createdAt: (s as Record<string, unknown>).createdAt as Date,
            highlightedCode: s.highlightedCode as string | undefined,
          }))}
          viewMode={viewMode}
          density={density}
          allowSelection={false}
          hasMoreInitial={highlightedSnippets.length === 50}
        />
      </div>
    </div>
  );
}
