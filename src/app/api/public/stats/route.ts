import { NextResponse } from "next/server";
import { getPublicStats } from "@/features/core/utils/stats";
import { generateETagFromData, isNotModified, notModifiedResponse, setETag } from "@/features/core/utils/etag";
import { logCrash } from "@/features/core/utils/crash-reporter";
import { logErrorToFile } from "@/features/core/utils/file-logger";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const stats = await getPublicStats();
    const etag = generateETagFromData(stats);

    if (isNotModified(request, etag)) {
      return notModifiedResponse(etag);
    }

    const response = NextResponse.json(stats);
    setETag(response, etag);
    return response;
  } catch (error) {
    console.error("[Public Stats API Error]", error);
    await logCrash(error instanceof Error ? error : new Error(String(error)), request.url);
    logErrorToFile(error, "GET /api/public/stats");
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
