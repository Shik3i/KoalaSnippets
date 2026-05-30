import { NextResponse } from "next/server";
import { db } from "@/db";
import { snippets } from "@/db/schema";
import { getSession } from "@/features/auth/utils/session";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ tags: [] });
  }

  try {
    const userSnippets = await db
      .select({ tags: snippets.tags })
      .from(snippets)
      .where(eq(snippets.authorId, session.user.id))
      .all();

    const allTags = new Set<string>();
    userSnippets.forEach((s) => {
      s.tags?.forEach((t: string) => allTags.add(t.toLowerCase()));
    });

    return NextResponse.json({ tags: Array.from(allTags).sort() });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
