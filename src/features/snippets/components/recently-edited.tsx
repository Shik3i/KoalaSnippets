"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/features/core/utils/utils";
import { useI18n } from "@/features/core/i18n";

interface RecentSnippet {
  id: string;
  title: string;
  description: string | null;
  language: string;
  tags: string[] | null;
  visibility: string;
  totalLines: number;
  updatedAt: string;
}

export function RecentlyEdited() {
  const { t } = useI18n();
  const [snippets, setSnippets] = useState<RecentSnippet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/snippets?recent=true")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setSnippets(data.snippets || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading || snippets.length === 0) return null;

  return (
    <div className="px-4 pt-2 pb-0">
      <div className="flex items-center gap-2 mb-2">
        <Clock size={14} className="text-muted-foreground" />
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t.recentlyEdited}
        </h3>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scroll-indicator">
        {snippets.map((snippet) => (
          <Link
            key={snippet.id}
            href={`/snippets/${snippet.id}`}
            className={cn(
              "flex-shrink-0 w-[220px] rounded-lg border border-border bg-card/60 p-3 hover:border-primary/40 hover:bg-card transition-all group"
            )}
          >
            <h4 className="text-sm font-medium truncate group-hover:text-primary transition-colors">
              {snippet.title}
            </h4>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                {snippet.language}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {formatRelativeTime(snippet.updatedAt, t)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function formatRelativeTime(dateStr: string, t: ReturnType<typeof useI18n>["t"]): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      if (diffMinutes < 5) return t.justNow;
      return `${diffMinutes}m ago`;
    }
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) return t.editedYesterday;
  if (diffDays < 7) return t.editedXDaysAgo.replace("{days}", String(diffDays));
  return new Date(dateStr).toLocaleDateString();
}
