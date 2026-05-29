import { getSession } from "@/features/auth/utils/session";
import { HelpClient } from "./HelpClient";
import { db } from "@/db";
import { snippets, snippetFiles } from "@/db/schema";
import { eq, and, or, isNull, isNotNull, ne } from "drizzle-orm";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Help & Guide | KoalaSnippets",
  description: "Learn how to master KoalaSnippets with interactive guides, search filters, and shortcuts.",
};

export default async function HelpPage() {
  const session = await getSession();

  const activeTags = await db
    .select({ tags: snippets.tags })
    .from(snippets)
    .where(
      and(
        isNull(snippets.deletedAt),
        isNotNull(snippets.tags),
        session
          ? or(
              eq(snippets.authorId, session.user.id),
              and(eq(snippets.visibility, "PUBLIC"), ne(snippets.authorId, session.user.id))
            )
          : eq(snippets.visibility, "PUBLIC")
      )
    )
    .all();

  const activeLanguages = await db
    .selectDistinct({ language: snippetFiles.language })
    .from(snippetFiles)
    .innerJoin(snippets, eq(snippetFiles.snippetId, snippets.id))
    .where(
      and(
        isNull(snippets.deletedAt),
        session
          ? or(
              eq(snippets.authorId, session.user.id),
              and(eq(snippets.visibility, "PUBLIC"), ne(snippets.authorId, session.user.id))
            )
          : eq(snippets.visibility, "PUBLIC")
      )
    )
    .all();

  const sidebarTags = [...new Set(activeTags.flatMap((s) => s.tags ?? []))].sort();
  const sidebarLanguages = activeLanguages.map((f) => f.language).sort();

  return (
    <HelpClient
      sidebarTags={sidebarTags}
      sidebarLanguages={sidebarLanguages}
      isAuthenticated={!!session}
      isAdmin={session?.user?.role === "ADMIN"}
    />
  );
}
