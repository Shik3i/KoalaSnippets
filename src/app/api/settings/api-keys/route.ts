import { NextResponse } from "next/server";
import { db } from "@/db";
import { apiKeys } from "@/db/schema";
import { getSession } from "@/features/auth/utils/session";
import { generateApiToken, hashApiToken } from "@/features/auth/utils/api-key";
import { generateId } from "@/features/auth/utils/auth";
import { eq, desc } from "drizzle-orm";
import { verifyCsrf } from "@/features/core/utils/security";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const keys = await db.select({
      id: apiKeys.id,
      name: apiKeys.name,
      createdAt: apiKeys.createdAt,
      lastUsedAt: apiKeys.lastUsedAt,
    }).from(apiKeys)
      .where(eq(apiKeys.userId, session.user.id))
      .orderBy(desc(apiKeys.createdAt))
      .all();

    return NextResponse.json({ keys });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const keyCount = await db.select().from(apiKeys)
    .where(eq(apiKeys.userId, session.user.id)).all();

  if (keyCount.length >= 20) {
    return NextResponse.json({ error: "Maximum 20 API keys per user" }, { status: 400 });
  }

  const token = generateApiToken();
  const tokenHash = hashApiToken(token);

  const id = generateId();
  await db.insert(apiKeys).values({
    id,
    userId: session.user.id,
    name: parsed.data.name,
    tokenHash,
    createdAt: new Date(),
  });

  return NextResponse.json({
    success: true,
    id,
    name: parsed.data.name,
    token,
  }, { status: 201 });
}

export async function DELETE(request: Request) {
  if (!verifyCsrf(request)) {
    return NextResponse.json({ error: "Invalid CSRF token or Origin" }, { status: 403 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const keyId = url.searchParams.get("id");

  if (!keyId) {
    return NextResponse.json({ error: "Missing key id" }, { status: 400 });
  }

  try {
    const key = await db.select().from(apiKeys)
      .where(eq(apiKeys.id, keyId)).get();

    if (!key || key.userId !== session.user.id) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }

    await db.delete(apiKeys).where(eq(apiKeys.id, keyId));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
