import { NextResponse } from "next/server";
import { getPublicStats } from "@/features/core/utils/stats";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await getPublicStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("[Public Stats API Error]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
