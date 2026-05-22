import { NextResponse } from "next/server";
import { db } from "@/db";
import { snippets } from "@/db/schema";
import { getSession } from "@/features/auth/utils/session";
import { verifyCsrf } from "@/features/core/utils/security";
import { eq, inArray, and } from "drizzle-orm";
import { z } from "zod";

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
    await db.transaction(async (tx) => {
      const ownedSnippets = await tx
        .select({ id: snippets.id })
        .from(snippets)
        .where(and(inArray(snippets.id, ids), eq(snippets.authorId, userId)))
        .all();

      const actionableIds = ownedSnippets.map((s) => s.id);

      if (actionableIds.length === 0) {
        throw new Error("No matching snippets found");
      }

      if (action === "delete") {
        await tx.delete(snippets).where(
          and(inArray(snippets.id, actionableIds), eq(snippets.authorId, userId))
        );
      } else if (action === "set-visibility") {
        await tx.update(snippets)
          .set({ visibility: visibility!, updatedAt: new Date() })
          .where(and(inArray(snippets.id, actionableIds), eq(snippets.authorId, userId)));
      }
    });

    const actionLabel = action === "delete" ? "deleted" : `set to ${visibility}`;
    return NextResponse.json({ message: `${ids.length} snippet${ids.length !== 1 ? "s" : ""} ${actionLabel}` });
  } catch (error) {
    console.error("[Bulk API Error]", error);
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}
