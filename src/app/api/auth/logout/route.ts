import { NextResponse } from "next/server";
import { deleteSession, getSession } from "@/features/auth/utils/session";
import { verifyCsrf } from "@/features/core/utils/security";
import { logUserAction } from "@/features/admin/utils/audit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!verifyCsrf(request)) {
    return NextResponse.json({ error: "Invalid CSRF token or Origin" }, { status: 403 });
  }

  const session = await getSession();
  if (session) {
    await logUserAction(session.user.id, "LOGOUT", "USER", session.user.id, `User "${session.user.username}" logged out`);
  }

  await deleteSession();
  return NextResponse.json({ success: true });
}
