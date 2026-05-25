import { NextResponse } from "next/server";
import { db } from "@/db";
import { crashReports } from "@/db/schema";
import crypto from "crypto";
import { getSession } from "@/features/auth/utils/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let userId: string | null = null;
  const session = await getSession();
  if (session) {
    userId = session.userId;
  }

  try {
    const body = await request.json();
    const { errorMessage, stackTrace, route, metadata } = body;

    if (!errorMessage) {
      return NextResponse.json({ error: "Missing errorMessage" }, { status: 400 });
    }


    const id = crypto.randomUUID();
    
    await db.insert(crashReports).values({
      id,
      errorMessage: String(errorMessage).substring(0, 1000),
      stackTrace: stackTrace ? String(stackTrace) : null,
      userId,
      route: route ? String(route).substring(0, 255) : null,
      metadata: metadata ? metadata : null,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error) {
    console.error("[CrashReportAPI] Failed to save crash report:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
