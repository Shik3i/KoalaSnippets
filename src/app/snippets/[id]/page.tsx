import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { snippets, snippetFiles } from "@/db/schema";
import { getSession } from "@/features/auth/utils/session";
import { highlightCode } from "@/features/snippets/utils/shiki";
import { Sidebar } from "@/features/core/components/sidebar";
import { BreadcrumbWithCollection } from "@/features/core/components/breadcrumb";
import { SnippetDetailClient } from "./SnippetDetailClient";
import { PasswordPrompt } from "@/features/snippets/components/password-prompt";
import { eq } from "drizzle-orm";
import { escapeHtml } from "@/features/core/utils/security";
import crypto from "crypto";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

function constantTimeCompare(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

async function getSnippet(id: string, token?: string): Promise<Record<string, unknown> | null> {
  const snippet = await db.select().from(snippets).where(eq(snippets.id, id)).get();

  if (!snippet) {
    return null;
  }

  const session = await getSession();
  const isOwner = session && snippet.authorId === session.user.id;

  const files = await db.select().from(snippetFiles).where(eq(snippetFiles.snippetId, snippet.id)).all();
  
  let forkedFromTitle: string | undefined;
  if (snippet.forkedFromId) {
    const parent = await db.select({ title: snippets.title }).from(snippets).where(eq(snippets.id, snippet.forkedFromId)).get();
    forkedFromTitle = parent?.title;
  }
  
  const snippetWithFiles: Record<string, unknown> = {
    ...snippet,
    files,
    forkedFromTitle
  };

  if (isOwner) {
    return snippetWithFiles;
  }

  if (snippet.visibility === "SHARED") {
    if (token && snippet.shareToken && constantTimeCompare(snippet.shareToken, token)) {
      if (snippet.passwordHash && !isOwner) {
        return { ...snippetWithFiles, files: [], isPasswordProtected: true };
      }
      return snippetWithFiles;
    }
  }

  if (snippet.visibility === "PUBLIC") {
    if (snippet.passwordHash && !isOwner) {
      return { ...snippetWithFiles, files: [], isPasswordProtected: true };
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

  const snippetFilesArr = snippet.files as Array<{ language?: string }> | undefined;
  const mainLanguage = snippetFilesArr?.[0]?.language ?? "plaintext";
  const snippetTags = snippet.tags as string[] | null | undefined;
  const tagsStr = snippetTags?.length ? ` · ${snippetTags.join(", ")}` : "";
  const title = `${snippet.title as string} · ${mainLanguage}${tagsStr}`;
  const description = (snippet.description as string | null) ?? `Code snippet in ${mainLanguage} from KoalaSnippets`;

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
    ((snippet.files || []) as Array<{ id: string; filename: string; code: string; language: string }>).map(async (file) => {
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

  const isOwner = session?.user.id === (snippet.authorId as string);
  const backUrl = (snippet.visibility as string) === "PUBLIC" ? "/public" : "/dashboard";

  return (
    <div className="flex h-screen">
      <Sidebar isAuthenticated={!!session} isAdmin={session?.user.role === "ADMIN"} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <BreadcrumbWithCollection
          snippetTitle={snippet.title as string}
        />
        <div className="px-4 py-2">
          <Link
            href={backUrl}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} suppressHydrationWarning />
            Back to list
          </Link>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {(snippet.isPasswordProtected as boolean) ? (
            <PasswordPrompt 
              snippet={{
                id: snippet.id as string,
                title: snippet.title as string,
                description: snippet.description as string | undefined,
                tags: snippet.tags as string[] | undefined,
                visibility: snippet.visibility as "PRIVATE" | "SHARED" | "PUBLIC",
                shareToken: snippet.shareToken as string | undefined,
                createdAt: snippet.createdAt as Date,
                updatedAt: snippet.updatedAt as Date,
                deletedAt: snippet.deletedAt as Date | null,
              }}
              syntaxTheme={syntaxTheme} 
            />
          ) : (
            <SnippetDetailClient
              id={snippet.id as string}
              title={snippet.title as string}
              description={snippet.description as string | undefined}
              files={highlightedFiles}
              tags={snippet.tags as string[] | undefined}
              visibility={snippet.visibility as "PRIVATE" | "SHARED" | "PUBLIC"}
              shareToken={snippet.shareToken as string | undefined}
              createdAt={snippet.createdAt as Date}
              updatedAt={snippet.updatedAt as Date}
              deletedAt={snippet.deletedAt as Date | null}
              isOwner={isOwner}
              forkedFromId={snippet.forkedFromId as string | undefined}
              forkedFromTitle={snippet.forkedFromTitle as string | undefined}
            />
          )}
        </div>
      </div>
    </div>
  );
}
