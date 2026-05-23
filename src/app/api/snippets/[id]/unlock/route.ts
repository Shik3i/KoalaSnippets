import { NextResponse } from "next/server";
import { db } from "@/db";
import { snippets, snippetFiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/features/auth/utils/auth";
import { highlightCode } from "@/features/snippets/utils/shiki";
import { escapeHtml } from "@/features/core/utils/security";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { password, syntaxTheme = "github-dark" } = body;

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    const snippet = await db.select().from(snippets).where(eq(snippets.id, id)).get();

    if (!snippet) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!snippet.passwordHash) {
      return NextResponse.json({ error: "This snippet is not password protected" }, { status: 400 });
    }

    const isValid = await verifyPassword(password, snippet.passwordHash);

    if (!isValid) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    const files = await db.select().from(snippetFiles).where(eq(snippetFiles.snippetId, id)).all();
    
    const highlightedFiles = await Promise.all(
      files.map(async (file) => {
        let highlightedCode: string;
        try {
          highlightedCode = await highlightCode(file.code, file.language, syntaxTheme);
        } catch (err) {
          console.error("[snippet] Failed to highlight code, falling back to plaintext:", err);
          highlightedCode = `<pre><code>${escapeHtml(file.code)}</code></pre>`;
        }
        return {
          id: file.id,
          filename: file.filename,
          code: file.code,
          language: file.language,
          highlightedCode,
        };
      })
    );

    return NextResponse.json({ success: true, files: highlightedFiles });
  } catch (error: unknown) {
    console.error("[Snippets Unlock API Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
