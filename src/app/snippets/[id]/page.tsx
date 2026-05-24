import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { snippets, snippetFiles } from "@/db/schema";
import { getSession } from "@/features/auth/utils/session";
import { highlightCode } from "@/features/snippets/utils/shiki";
import { Sidebar } from "@/features/core/components/sidebar";
import { SnippetDetailClient } from "./SnippetDetailClient";
import { PasswordPrompt } from "@/features/snippets/components/password-prompt";
import { eq } from "drizzle-orm";
import { escapeHtml } from "@/features/core/utils/security";
import crypto from "crypto";
import type { Metadata } from "next";

export const revalidate = 120;

export async function generateStaticParams() {
  const publicSnippets = await db
    .select({ id: snippets.id })
    .from(snippets)
    .where(eq(snippets.visibility, "PUBLIC"))
    .all();

  return publicSnippets.map((s) => ({ id: s.id }));
}

function constantTimeCompare(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

async function getSnippet(id: string, token?: string) {
  const snippet = await db.select().from(snippets).where(eq(snippets.id, id)).get();

  if (!snippet) {
    return null;
  }

  const session = await getSession();
  const isOwner = session && snippet.authorId === session.user.id;

  const files = await db.select().from(snippetFiles).where(eq(snippetFiles.snippetId, snippet.id)).all();
  
  const snippetWithFiles = {
    ...snippet,
    files
  };

  // The owner must ALWAYS be able to see their snippet, regardless of visibility or missing tokens in the URL.
  if (isOwner) {
    return snippetWithFiles;
  }

  // SHARED snippets are accessible if the correct token is provided
  if (snippet.visibility === "SHARED") {
    if (token && snippet.shareToken && constantTimeCompare(snippet.shareToken, token)) {
      if (snippet.passwordHash && !isOwner) {
        return { ...snippet, files: [], isPasswordProtected: true };
      }
      return snippetWithFiles;
    }
  }

  // PUBLIC snippets are accessible to anyone
  if (snippet.visibility === "PUBLIC") {
    if (snippet.passwordHash && !isOwner) {
      return { ...snippet, files: [], isPasswordProtected: true };
    }
    return snippetWithFiles;
  }

  return null;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { token } = await searchParams;
  const snippet = await getSnippet(id, token);

  if (!snippet) {
    return {
      title: "Snippet Not Found | KoalaSnippets",
    };
  }

  const mainLanguage = snippet.files?.[0]?.language ?? "plaintext";
  const tagsStr = snippet.tags?.length ? ` · ${snippet.tags.join(", ")}` : "";
  const title = `${snippet.title} · ${mainLanguage}${tagsStr}`;
  const description = snippet.description ?? `Code snippet in ${mainLanguage} from KoalaSnippets`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      siteName: "KoalaSnippets",
      locale: "en_US",
    },
    twitter: {
      card: "summary",
      title,
      description,
      site: "@KoalaSnippets",
    },
  };
}

export default async function SnippetDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { token } = await searchParams;
  const session = await getSession();

  const snippet = await getSnippet(id, token);

  if (!snippet) {
    notFound();
  }

  const syntaxTheme = session?.user?.preferences?.syntaxTheme ?? "github-dark";
  
  const highlightedFiles = await Promise.all(
    (snippet.files || []).map(async (file) => {
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

  const isOwner = session?.user.id === snippet.authorId;
  const backUrl = snippet.visibility === "PUBLIC" ? "/public" : "/dashboard";

  return (
    <div className="flex h-screen">
      <Sidebar isAuthenticated={!!session} isAdmin={session?.user.role === "ADMIN"} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-border p-4">
          <Link
            href={backUrl}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} suppressHydrationWarning />
            Back to list
          </Link>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {("isPasswordProtected" in snippet && snippet.isPasswordProtected) ? (
            <PasswordPrompt 
              snippet={{
                id: snippet.id,
                title: snippet.title,
                description: snippet.description ?? undefined,
                tags: snippet.tags ?? undefined,
                visibility: snippet.visibility,
                shareToken: snippet.shareToken ?? undefined,
                createdAt: snippet.createdAt,
                updatedAt: snippet.updatedAt,
                deletedAt: snippet.deletedAt,
              }}
              syntaxTheme={syntaxTheme} 
            />
          ) : (
            <SnippetDetailClient
              id={snippet.id}
              title={snippet.title}
              description={snippet.description ?? undefined}
              files={highlightedFiles}
              tags={snippet.tags ?? undefined}
              visibility={snippet.visibility as "PRIVATE" | "SHARED" | "PUBLIC"}
              shareToken={snippet.shareToken ?? undefined}
              createdAt={snippet.createdAt}
              updatedAt={snippet.updatedAt}
              deletedAt={snippet.deletedAt}
              isOwner={isOwner}
            />
          )}
        </div>
      </div>
    </div>
  );
}
