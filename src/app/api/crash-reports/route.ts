import { NextResponse } from "next/server";
import { logCrash } from "@/features/core/utils/crash-reporter";
import { getSession } from "@/features/auth/utils/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { errorMessage, stackTrace, route, digest, metadata } = body;

    if (!errorMessage) {
      return NextResponse.json({ error: "errorMessage is required" }, { status: 400 });
    }

    const fakeError = new Error(errorMessage) as Error & { digest?: string };
    fakeError.stack = stackTrace || fakeError.stack;
    if (digest) fakeError.digest = digest;

    const session = await getSession();
    const userId = session?.userId;

    await logCrash(fakeError, route, userId, metadata);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("[crash-reports API] Failed to log crash:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
