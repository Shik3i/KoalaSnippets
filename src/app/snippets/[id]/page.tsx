import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { snippets } from "@/db/schema";
import { getSession } from "@/features/auth/utils/session";
import { highlightCode } from "@/features/snippets/utils/shiki";
import { Sidebar } from "@/features/core/components/sidebar";
import { DetailView } from "@/features/core/components/detail-view";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
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

  // The owner must ALWAYS be able to see their snippet, regardless of visibility or missing tokens in the URL.
  if (isOwner) {
    return snippet;
  }

  // PUBLIC snippets are accessible to anyone
  if (snippet.visibility === "PUBLIC") {
    return snippet;
  }

  // SHARED snippets are accessible if the correct token is provided
  if (snippet.visibility === "SHARED") {
    if (token && snippet.shareToken && constantTimeCompare(snippet.shareToken, token)) {
      return snippet;
    }
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

  const tagsStr = snippet.tags?.length ? ` · ${snippet.tags.join(", ")}` : "";
  const title = `${snippet.title} · ${snippet.language}${tagsStr}`;
  const description = snippet.description ?? `Code snippet in ${snippet.language} from KoalaSnippets`;

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
  let highlightedCode: string;
  try {
    highlightedCode = await highlightCode(snippet.code, snippet.language, syntaxTheme);
  } catch (err) {
    console.error("[snippet] Failed to highlight code, falling back to plaintext:", err);
    highlightedCode = `<pre><code>${snippet.code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`;
  }
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

        <div className="flex-1 overflow-hidden">
          <DetailView
            id={snippet.id}
            title={snippet.title}
            description={snippet.description ?? undefined}
            code={snippet.code}
            language={snippet.language}
            tags={snippet.tags ?? undefined}
            visibility={snippet.visibility as "PRIVATE" | "SHARED" | "PUBLIC"}
            shareToken={snippet.shareToken ?? undefined}
            createdAt={snippet.createdAt}
            updatedAt={snippet.updatedAt}
            highlightedCode={highlightedCode}
            isOwner={isOwner}
          />
        </div>
      </div>
    </div>
  );
}
