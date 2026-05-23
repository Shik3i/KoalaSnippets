"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/features/core/utils/utils";
import { VISIBILITY_CONFIG } from "@/features/snippets/utils/constants";

interface SnippetCardProps {
  id: string;
  title: string;
  description?: string;
  language: string;
  tags?: string[];
  visibility: "PRIVATE" | "SHARED" | "PUBLIC";
  createdAt: Date;
  snippetDensity?: "compact" | "preview" | "full";
  highlightedCode?: string;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  authorUsername?: string;
}

export function SnippetCard({
  id,
  title,
  description,
  language,
  tags,
  visibility,
  createdAt,
  snippetDensity = "preview",
  highlightedCode,
  selected = false,
  onToggleSelect,
  authorUsername,
}: SnippetCardProps) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const VisIcon = VISIBILITY_CONFIG[visibility].icon;

  const dateStr = mounted
    ? new Date(createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'numeric', year: 'numeric' })
    : new Date(createdAt).toISOString().split('T')[0];
  const timeStr = mounted
    ? new Date(createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : '';

  const dateDisplay = mounted
    ? `Vom ${dateStr}${timeStr ? `, ${timeStr}` : ''}`
    : `Vom ${dateStr}`;

  return (
    <Link
      href={`/snippets/${id}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/json", JSON.stringify({ type: "snippet", id }));
      }}
      className={cn(
        "group block rounded-lg border border-border bg-card p-3 sm:p-4 transition-all hover:border-primary/50 hover:shadow-sm relative cursor-grab active:cursor-grabbing",
        selected && "border-primary/50 ring-1 ring-primary/30 bg-primary/5"
      )}
      aria-label={`View snippet: ${title}`}
    >
      {onToggleSelect && (
        <div className="absolute top-2 left-2 z-10" onClick={(e) => e.preventDefault()}>
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(id)}
            className="rounded border-border text-primary focus:ring-ring cursor-pointer"
            aria-label={`Select ${title}`}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      <div className={cn("flex items-start justify-between gap-2 mb-2", onToggleSelect && "ml-6")}>
        <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
          {title}
        </h3>
        <VisIcon size={12} className={cn("shrink-0 mt-1", VISIBILITY_CONFIG[visibility].color)} suppressHydrationWarning />
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-2">
        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 shrink-0">
          {language}
        </Badge>
        <span className="text-xs text-muted-foreground truncate">
          {dateDisplay}{authorUsername ? ` • Erstellt von ${authorUsername}` : ""}
        </span>
      </div>

      {description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
          {description}
        </p>
      )}

      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="text-[10px] h-4 px-1 cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                const params = new URLSearchParams(window.location.search);
                params.set("tags", tag);
                let targetPath = window.location.pathname;
                if (targetPath.startsWith("/snippets")) {
                  targetPath = visibility === "PUBLIC" ? "/public" : "/dashboard";
                }
                window.location.href = `${targetPath}?${params.toString()}`;
              }}
            >
              {tag}
            </Badge>
          ))}
          {tags.length > 3 && (
            <span className="text-[10px] text-muted-foreground">+{tags.length - 3}</span>
          )}
        </div>
      )}

      {snippetDensity !== "compact" && highlightedCode && (
        <div
          className="mt-3 rounded-md border border-border bg-muted/20 text-[11px] max-h-40 overflow-y-auto leading-normal [&>pre]:!bg-transparent [&>pre]:!p-2 [&>pre]:!m-0 [&>pre]:overflow-x-auto select-text font-mono"
          style={{ fontFamily: "var(--font-jetbrains), monospace" }}
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        />
      )}
    </Link>
  );
}
