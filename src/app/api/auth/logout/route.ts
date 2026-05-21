import { NextResponse } from "next/server";
import { deleteSession } from "@/features/auth/utils/session";

export const dynamic = "force-dynamic";

export async function POST() {
  await deleteSession();
  return NextResponse.json({ success: true });
}
