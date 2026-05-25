import { NextResponse } from "next/server";
import { db } from "@/db";
import { snippets } from "@/db/schema";
import { getSession } from "@/features/auth/utils/session";
import { verifyCsrf } from "@/features/core/utils/security";
import { eq, inArray, and } from "drizzle-orm";
import { z } from "zod";
import { logUserAction } from "@/features/admin/utils/audit";
import { logCrash } from "@/features/core/utils/crash-reporter";
import { logErrorToFile } from "@/features/core/utils/file-logger";

export const dynamic = "force-dynamic";

const bulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
  action: z.enum(["delete", "set-visibility"]),
  visibility: z.enum(["PRIVATE", "PUBLIC"]).optional(),
});

export async function POST(request: Request) {
  if (!verifyCsrf(request)) {
    return NextResponse.json({ error: "Invalid CSRF token or Origin" }, { status: 403 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { ids, action, visibility } = parsed.data;

  if (action === "set-visibility" && !visibility) {
    return NextResponse.json({ error: "visibility is required for set-visibility action" }, { status: 400 });
  }

  try {
    const userId = session.user.id;
    const ownedSnippets = await db
      .select({ id: snippets.id, title: snippets.title, deletedAt: snippets.deletedAt })
      .from(snippets)
      .where(and(inArray(snippets.id, ids), eq(snippets.authorId, userId)))
      .all();

    if (ownedSnippets.length === 0) {
      return NextResponse.json({ error: "No matching snippets found" }, { status: 404 });
    }

    const actionableIds = ownedSnippets.map((s) => s.id);

    if (action === "delete") {
      const softDeleteIds = ownedSnippets.filter((s) => !s.deletedAt).map((s) => s.id);
      const hardDeleteIds = ownedSnippets.filter((s) => s.deletedAt).map((s) => s.id);

      if (softDeleteIds.length > 0) {
        await db.update(snippets)
          .set({ deletedAt: new Date() })
          .where(and(inArray(snippets.id, softDeleteIds), eq(snippets.authorId, userId)));
      }

      if (hardDeleteIds.length > 0) {
        await db.delete(snippets)
          .where(and(inArray(snippets.id, hardDeleteIds), eq(snippets.authorId, userId)));
      }

      for (const s of ownedSnippets) {
        await logUserAction(
          userId,
          "DELETE",
          "SNIPPET",
          s.id,
          s.deletedAt
            ? `Snippet "${s.title}" permanently deleted (bulk)`
            : `Snippet "${s.title}" moved to trash (bulk)`
        );
      }
    } else if (action === "set-visibility") {
      await db.update(snippets)
        .set({ visibility: visibility!, updatedAt: new Date() })
        .where(and(inArray(snippets.id, actionableIds), eq(snippets.authorId, userId)));

      for (const s of ownedSnippets) {
        await logUserAction(
          userId,
          "UPDATE",
          "SNIPPET",
          s.id,
          `Snippet "${s.title}" visibility set to ${visibility} (bulk)`
        );
      }
    }

    const actionLabel = action === "delete" ? "moved to trash or deleted" : `set to ${visibility}`;
    return NextResponse.json({ message: `${ownedSnippets.length} snippet${ownedSnippets.length !== 1 ? "s" : ""} ${actionLabel}` });
  } catch (error) {
    console.error("[Bulk API Error]", error);
    await logCrash(error instanceof Error ? error : new Error(String(error)), request.url);
    logErrorToFile(error, "POST /api/snippets/bulk");
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}
