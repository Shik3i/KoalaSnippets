"use client";

import { useEffect, useState, useSyncExternalStore, startTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";

interface PublicSnippet {
  id: string;
  title: string;
  language: string;
  tags: string[] | null;
  createdAt: string;
  authorId: string;
  authorUsername: string;
}

export function AdminPublicSnippets() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [snippets, setSnippets] = useState<PublicSnippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const { addToast } = useToast();

  useEffect(() => {
    startTransition(() => setLoading(true));
    fetch("/api/admin/public-snippets")
      .then((res) => res.json())
      .then((data) => {
        startTransition(() => {
          setSnippets(data.snippets ?? []);
          setLoading(false);
        });
      })
      .catch(() => startTransition(() => setLoading(false)));
  }, [refreshKey]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;

    try {
      const res = await fetch("/api/admin/public-snippets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        addToast(`"${title}" deleted`, "success");
        setRefreshKey((k) => k + 1);
      } else {
        addToast("Failed to delete snippet", "error");
      }
    } catch (err) {
      console.error("Failed to delete snippet:", err);
      addToast("Network error while deleting snippet", "error");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Public Snippet Moderation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-10 bg-muted/30 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Public Snippet Moderation ({snippets.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {snippets.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No public snippets found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2 px-3 font-medium">Title</th>
                  <th className="text-left py-2 px-3 font-medium">Author</th>
                  <th className="text-left py-2 px-3 font-medium">Language</th>
                  <th className="text-left py-2 px-3 font-medium hidden md:table-cell">Tags</th>
                  <th className="text-left py-2 px-3 font-medium hidden sm:table-cell">Created</th>
                  <th className="text-right py-2 px-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {snippets.map((snippet) => (
                  <tr key={snippet.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2.5 px-3 font-medium max-w-[200px] truncate">
                      {snippet.title}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {snippet.authorUsername}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5 whitespace-nowrap">
                        {snippet.language}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {snippet.tags?.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[10px] h-4 px-1">
                            {tag}
                          </Badge>
                        ))}
                        {snippet.tags && snippet.tags.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{snippet.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground text-xs hidden sm:table-cell">
                      {mounted ? new Date(snippet.createdAt).toLocaleDateString() : ""}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/snippets/${snippet.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={`View snippet: ${snippet.title}`}
                        >
                          <ExternalLink size={14} suppressHydrationWarning />
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(snippet.id, snippet.title)}
                          aria-label={`Delete snippet: ${snippet.title}`}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 size={14} suppressHydrationWarning />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
