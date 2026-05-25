import { getAuth } from "@/features/auth/utils/session";
import { NextResponse } from "next/server";

export async function requireAdmin(request: Request) {
  const session = await getAuth(request);
  if (!session) {
    return { unauthorized: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.role !== "ADMIN") {
    return { forbidden: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}
