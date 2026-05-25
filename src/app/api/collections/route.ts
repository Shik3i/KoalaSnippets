import { NextResponse } from "next/server";
import { db } from "@/db";
import { collections } from "@/db/schema";
import { getSession } from "@/features/auth/utils/session";
import { generateId } from "@/features/auth/utils/auth";
import { eq } from "drizzle-orm";
import { verifyCsrf } from "@/features/core/utils/security";
import { z } from "zod";
import { logCrash } from "@/features/core/utils/crash-reporter";
import { logErrorToFile } from "@/features/core/utils/file-logger";

export const dynamic = "force-dynamic";

const collectionSchema = z.object({
  name: z.string().trim().min(1).max(50),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userCollections = await db.select().from(collections).where(eq(collections.userId, session.user.id)).all();
    return NextResponse.json({ collections: userCollections });
  } catch (error) {
    console.error("[Collections API GET Error]", error);
    await logCrash(error instanceof Error ? error : new Error(String(error)), "/api/collections");
    logErrorToFile(error, "GET /api/collections");
    return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
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

  try {
    const body = await request.json();
    const parsed = collectionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const newCollection = {
      id: generateId(),
      name: parsed.data.name,
      userId: session.user.id,
    };

    await db.insert(collections).values(newCollection);

    return NextResponse.json({ success: true, collection: newCollection }, { status: 201 });
  } catch (error) {
    console.error("[Collections API POST Error]", error);
    await logCrash(error instanceof Error ? error : new Error(String(error)), request.url);
    logErrorToFile(error, "POST /api/collections");
    return NextResponse.json({ error: "Failed to create collection" }, { status: 500 });
  }
}
