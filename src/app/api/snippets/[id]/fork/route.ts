import { NextResponse } from "next/server";
import { getAuth } from "@/features/auth/utils/session";
import { forkSnippet } from "@/features/snippets/utils/fork";
import { verifyCsrf } from "@/features/core/utils/security";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyCsrf(request)) {
    return NextResponse.json({ error: "Invalid CSRF token or Origin" }, { status: 403 });
  }

  const session = await getAuth(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const result = await forkSnippet(id, session.user.id, session.user.username);

  if (!result.success) {
    const status = result.error?.includes("not found") ? 404
      : result.error?.includes("own snippet") ? 400
      : result.error?.includes("forkable") ? 400
      : result.error?.includes("quota") ? 403
      : 500;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ success: true, id: result.id }, { status: 201 });
}
