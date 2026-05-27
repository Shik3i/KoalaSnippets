import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/utils/session";
import { Sidebar } from "@/features/core/components/sidebar";
import { Breadcrumb } from "@/features/core/components/breadcrumb";
import { DashboardContent } from "@/features/snippets/components/dashboard-content";
import { GlobalDropzone } from "@/features/core/components/global-dropzone";
import { highlightCode } from "@/features/snippets/utils/shiki";
import { db } from "@/db";
import { snippets, snippetFiles, userFavorites } from "@/db/schema";
import { eq, desc, inArray, isNull, and, gt, or } from "drizzle-orm";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?expired=1");
  }

  const favorites = await db
    .select({ snippetId: userFavorites.snippetId })
    .from(userFavorites)
    .where(eq(userFavorites.userId, session.user.id))
    .orderBy(desc(userFavorites.createdAt))
    .limit(50);

  const snippetIds = favorites.map(f => f.snippetId);
  const favoriteSet = new Set(snippetIds);

  const userSnippets = snippetIds.length > 0
    ? await db.select().from(snippets).where(and(inArray(snippets.id, snippetIds), isNull(snippets.deletedAt), or(isNull(snippets.expiresAt), gt(snippets.expiresAt, new Date())))).all()
    : [];

  const files = snippetIds.length > 0
    ? await db.select().from(snippetFiles).where(inArray(snippetFiles.snippetId, snippetIds)).all()
    : [];

  const density = session?.user?.preferences?.snippetDensity ?? "preview";
  const syntaxTheme = session?.user?.preferences?.syntaxTheme ?? "github-dark";

  const highlightedSnippets = await Promise.all(
    userSnippets.map(async (s) => {
      const sFiles = files.filter(f => f.snippetId === s.id);
      const mainFile = sFiles[0];
      if (!mainFile) return { ...s, highlightedCode: undefined, language: "plaintext" };

      if (density === "compact") {
        return { ...s, highlightedCode: undefined, language: mainFile.language, isFavorited: true };
      }

      let codeToHighlight = mainFile.code;
      if (density === "preview") {
        const lines = mainFile.code.split("\n");
        codeToHighlight = lines.slice(0, 5).join("\n") + (lines.length > 5 ? "\n..." : "");
      }
      try {
        const hl = await highlightCode(codeToHighlight, mainFile.language, syntaxTheme);
        return { ...s, highlightedCode: hl, language: mainFile.language, isFavorited: true };
      } catch {
        return { ...s, highlightedCode: undefined, language: mainFile.language, isFavorited: true };
      }
    })
  );

  const cookieStore = await cookies();
  const viewMode = (cookieStore.get("snippet_view")?.value === "table" ? "table" : "grid") as "grid" | "table";

  const allUserSnippets = await db.select({ tags: snippets.tags }).from(snippets).where(eq(snippets.authorId, session.user.id)).all();
  const allUserFiles = await db.select({ language: snippetFiles.language }).from(snippetFiles).where(
    inArray(snippetFiles.snippetId, db.select({ id: snippets.id }).from(snippets).where(eq(snippets.authorId, session.user.id)))
  ).all();
  const sidebarTags = [...new Set(allUserSnippets.flatMap((s) => s.tags ?? []))].sort();
  const sidebarLanguages = [...new Set(allUserFiles.map((f) => f.language))].sort();

  return (
    <div className="flex h-screen">
      <GlobalDropzone />
      <Suspense fallback={<div className="w-[240px] shrink-0 bg-card border-r border-border" />}>
        <Sidebar
          tags={sidebarTags}
          languages={sidebarLanguages}
          isAuthenticated={true}
          isAdmin={session.user.role === "ADMIN"}
        />
      </Suspense>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Suspense fallback={<div className="h-9 border-b border-border bg-card/50" />}>
          <Breadcrumb />
        </Suspense>
        <div className="px-4 py-3 border-b border-border">
          <h1 className="text-lg font-semibold">Favorites</h1>
          <p className="text-sm text-muted-foreground">{highlightedSnippets.length} favorited snippet{highlightedSnippets.length !== 1 ? "s" : ""}</p>
        </div>
        <DashboardContent
          snippets={highlightedSnippets.map((s) => ({
            id: s.id,
            title: s.title,
            description: s.description,
            language: s.language,
            tags: s.tags,
            visibility: s.visibility,
            authorUsername: session.user.username,
            totalLines: s.totalLines,
            isPinned: s.isPinned,
            isFavorited: true,
            createdAt: s.createdAt,
            highlightedCode: s.highlightedCode,
          }))}
          viewMode={viewMode}
          density={density}
          hasMoreInitial={favorites.length === 50}
        />
      </div>
    </div>
  );
}
