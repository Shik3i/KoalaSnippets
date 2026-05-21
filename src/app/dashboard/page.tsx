import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Sidebar } from "@/components/layout/sidebar";
import { ListView } from "@/components/layout/list-view";
import { DetailView } from "@/components/layout/detail-view";
import { highlightCode } from "@/lib/shiki";
import { db } from "@/db";
import { snippets } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const userSnippets = await db
    .select()
    .from(snippets)
    .where(eq(snippets.authorId, session.user.id))
    .orderBy(desc(snippets.createdAt))
    .all();

  const languages = [...new Set(userSnippets.map((s) => s.language))].sort();
  const allTags = [...new Set(userSnippets.flatMap((s) => s.tags ?? []))].sort();

  const firstSnippet = userSnippets[0];
  let highlightedCode = "";
  if (firstSnippet) {
    highlightedCode = await highlightCode(firstSnippet.code, firstSnippet.language);
  }

  return (
    <div className="flex h-screen">
      <Sidebar
        tags={allTags}
        languages={languages}
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 shrink-0">
          <ListView
            snippets={userSnippets.map((s) => ({
              id: s.id,
              title: s.title,
              language: s.language,
              tags: s.tags ?? undefined,
              visibility: s.visibility as "PRIVATE" | "SHARED" | "PUBLIC",
              createdAt: s.createdAt,
            }))}
            selectedId={firstSnippet?.id}
            apiEndpoint="/api/snippets"
          />
        </div>

        <div className="flex-1 overflow-hidden">
          {firstSnippet ? (
            <DetailView
              id={firstSnippet.id}
              title={firstSnippet.title}
              description={firstSnippet.description ?? undefined}
              code={firstSnippet.code}
              language={firstSnippet.language}
              tags={firstSnippet.tags ?? undefined}
              visibility={firstSnippet.visibility as "PRIVATE" | "SHARED" | "PUBLIC"}
              createdAt={firstSnippet.createdAt}
              updatedAt={firstSnippet.updatedAt}
              highlightedCode={highlightedCode}
              isOwner={true}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p className="text-lg mb-2">No snippets yet</p>
              <p className="text-sm">Click &quot;New Snippet&quot; to create your first one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
