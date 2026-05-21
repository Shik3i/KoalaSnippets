import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { snippets } from "@/db/schema";
import { getSession } from "@/lib/session";
import { highlightCode } from "@/lib/shiki";
import { Sidebar } from "@/components/layout/sidebar";
import { DetailView } from "@/components/layout/detail-view";
import { eq } from "drizzle-orm";
import crypto from "crypto";

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

export default async function SnippetDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { token } = await searchParams;
  const session = await getSession();

  const snippet = await db.select().from(snippets).where(eq(snippets.id, id)).get();

  if (!snippet) {
    notFound();
  }

  if (snippet.visibility === "PRIVATE") {
    if (!session || snippet.authorId !== session.user.id) {
      notFound();
    }
  }

  if (snippet.visibility === "SHARED") {
    if (!token || !snippet.shareToken || !constantTimeCompare(snippet.shareToken, token)) {
      notFound();
    }
  }

  const highlightedCode = await highlightCode(snippet.code, snippet.language);
  const isOwner = session?.user.id === snippet.authorId;
  const backUrl = snippet.visibility === "PUBLIC" ? "/public" : "/dashboard";

  return (
    <div className="flex h-screen">
      <Sidebar isAuthenticated={!!session} />

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
