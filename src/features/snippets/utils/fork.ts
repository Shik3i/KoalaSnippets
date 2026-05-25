import { db } from "@/db";
import { snippets, snippetFiles, siteSettings, siteStatistics } from "@/db/schema";
import { generateId } from "@/features/auth/utils/auth";
import { logUserAction } from "@/features/admin/utils/audit";
import { eq, and, isNull, count, sql } from "drizzle-orm";

export interface ForkResult {
  success: boolean;
  id?: string;
  error?: string;
}

export async function forkSnippet(
  originalId: string,
  userId: string,
  username: string
): Promise<ForkResult> {
  const original = await db.select().from(snippets).where(
    and(eq(snippets.id, originalId), isNull(snippets.deletedAt))
  ).get();

  if (!original) {
    return { success: false, error: "Snippet not found" };
  }

  if (original.authorId === userId) {
    return { success: false, error: "Cannot fork your own snippet" };
  }

  if (original.visibility !== "PUBLIC" && original.visibility !== "SHARED") {
    return { success: false, error: "This snippet is not forkable" };
  }

  if (original.passwordHash) {
    return { success: false, error: "Password-protected snippets cannot be forked" };
  }

  const settings = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).get();
  const maxSnippets = settings?.maxSnippetsPerUser ?? 1000;

  const originalFiles = await db.select().from(snippetFiles).where(
    eq(snippetFiles.snippetId, originalId)
  ).all();

  if (originalFiles.length === 0) {
    return { success: false, error: "Snippet has no files to fork" };
  }

  let totalLines = 0;
  for (const f of originalFiles) {
    totalLines += f.code.split("\n").length;
  }

  const newId = generateId();
  const forkTitle = `${original.title} (fork)`;

  try {
    db.transaction((tx) => {
      const currentCount = tx.select({ c: count() }).from(snippets).where(
        and(eq(snippets.authorId, userId), isNull(snippets.deletedAt))
      ).get();

      if (currentCount && currentCount.c >= maxSnippets) {
        throw new Error(`Snippet quota exceeded (Max: ${maxSnippets})`);
      }

      tx.insert(snippets).values({
        id: newId,
        title: forkTitle,
        description: original.description,
        tags: original.tags,
        authorId: userId,
        visibility: "PRIVATE",
        totalLines,
        forkedFromId: originalId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).run();

      for (const f of originalFiles) {
        tx.insert(snippetFiles).values({
          id: generateId(),
          snippetId: newId,
          filename: f.filename,
          code: f.code,
          language: f.language,
        }).run();
      }

      tx.update(siteStatistics)
        .set({ totalSnippetsCreated: sql`total_snippets_created + 1` })
        .where(eq(siteStatistics.id, 1)).run();
    });

    await logUserAction(
      userId,
      "CREATE",
      "SNIPPET",
      newId,
      `Forked "${original.title}" from @${username}`
    );

    return { success: true, id: newId };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[fork] Fork failed:", message);
    return { success: false, error: message.includes("quota") ? message : "Internal server error" };
  }
}
