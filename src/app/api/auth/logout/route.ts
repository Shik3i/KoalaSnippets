import { NextResponse } from "next/server";
import { deleteSession } from "@/features/auth/utils/session";
import { verifyCsrf } from "@/features/core/utils/security";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!verifyCsrf(request)) {
    return NextResponse.json({ error: "Invalid CSRF token or Origin" }, { status: 403 });
  }

  await deleteSession();
  return NextResponse.json({ success: true });
}
