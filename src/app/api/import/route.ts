import { NextResponse } from "next/server";
import { getSession } from "@/features/auth/utils/session";
import { verifyCsrf } from "@/features/core/utils/security";
import { importFromUrl, createImportedSnippet } from "@/features/snippets/utils/importer";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export const dynamic = "force-dynamic";

const importSchema = z.object({
  url: z.string().url().max(2048),
  title: z.string().min(1).max(500).optional(),
  visibility: z.enum(["PRIVATE", "SHARED", "PUBLIC"]).optional().default("PRIVATE"),
});

export async function POST(request: Request) {
  if (!verifyCsrf(request)) {
    return NextResponse.json({ error: "Invalid CSRF token or Origin" }, { status: 403 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = importSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { url, title: customTitle, visibility } = parsed.data;

  const importResult = await importFromUrl(url, session.user.id);
  if (!importResult.success || !importResult.files) {
    return NextResponse.json({ error: importResult.error }, { status: 400 });
  }

  const finalTitle = customTitle || importResult.title || "Imported Snippet";

  const createResult = await createImportedSnippet(
    session.user.id,
    session.user.username,
    finalTitle,
    importResult.files,
    visibility
  );

  if (!createResult.success) {
    return NextResponse.json({ error: createResult.error }, {
      status: createResult.error?.includes("quota") ? 403 : 500,
    });
  }

  if (visibility === "PUBLIC") {
    revalidatePath("/");
    revalidatePath("/public");
  }
  revalidatePath("/dashboard");

  return NextResponse.json({
    success: true,
    id: createResult.id,
    title: finalTitle,
    files: importResult.files,
  }, { status: 201 });
}
