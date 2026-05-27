import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userFavorites } from "@/db/schema";
import { getSession } from "@/features/auth/utils/session";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await db.select().from(userFavorites).where(and(eq(userFavorites.userId, session.user.id), eq(userFavorites.snippetId, id))).get();
  if (existing) {
    return NextResponse.json({ error: "Already favorited" }, { status: 409 });
  }

  await db.insert(userFavorites).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    snippetId: id,
    createdAt: new Date(),
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await db.delete(userFavorites).where(and(eq(userFavorites.userId, session.user.id), eq(userFavorites.snippetId, id)));

  return NextResponse.json({ success: true });
}
