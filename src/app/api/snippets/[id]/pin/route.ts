import { NextResponse } from "next/server";
import { db } from "@/db";
import { snippets } from "@/db/schema";
import { getAuth } from "@/features/auth/utils/session";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuth(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const snippet = await db.select().from(snippets).where(and(eq(snippets.id, id), eq(snippets.authorId, session.user.id))).get();
    if (!snippet) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db.update(snippets).set({ isPinned: !snippet.isPinned, updatedAt: new Date() }).where(eq(snippets.id, id));

    return NextResponse.json({ success: true, isPinned: !snippet.isPinned });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
