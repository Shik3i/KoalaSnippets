"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/features/core/utils/utils";
import { useToast } from "@/components/ui/toast";
import { Lock, Globe, Link2, Star, Pin } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface SnippetTableRowProps {
  id: string;
  title: string;
  language: string;
  tags?: string[];
  visibility: "PRIVATE" | "SHARED" | "PUBLIC";
  createdAt: Date | string;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  isPinned?: boolean;
  isFavorited?: boolean;
}

const visibilityConfig = {
  PRIVATE: { icon: Lock, label: "Private", color: "text-muted-foreground" },
  SHARED: { icon: Link2, label: "Shared", color: "text-info" },
  PUBLIC: { icon: Globe, label: "Public", color: "text-success" },
};

export function SnippetTableRow({
  id,
  title,
  language,
  tags,
  visibility,
  createdAt,
  selected = false,
  onToggleSelect,
  isPinned = false,
  isFavorited = false,
}: SnippetTableRowProps) {
  const VisIcon = visibilityConfig[visibility].icon;
  const { addToast } = useToast();
  const [pinned, setPinned] = useState(isPinned);
  const [favorited, setFavorited] = useState(isFavorited);

  const toggleFavorite = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const method = favorited ? "DELETE" : "POST";
      const res = await fetch(`/api/snippets/${id}/favorite`, { method });
      if (res.ok) {
        setFavorited(!favorited);
        addToast(favorited ? "Removed from favorites" : "Added to favorites", "success");
      }
    } catch {
      addToast("Failed to update favorite", "error");
    }
  }, [favorited, id, addToast]);

  const togglePin = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/snippets/${id}/pin`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setPinned(data.isPinned);
        addToast(data.isPinned ? "Snippet pinned" : "Snippet unpinned", "success");
      }
    } catch {
      addToast("Failed to update pin", "error");
    }
  }, [id, addToast]);

  return (
    <tr
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/json", JSON.stringify({ type: "snippet", id }));
      }}
      className={cn(
        "border-b border-border transition-colors cursor-grab active:cursor-grabbing group/row",
        selected ? "bg-primary/5" : "hover:bg-muted/30"
      )}
    >
      {onToggleSelect && (
        <td className="w-10 px-2 py-2.5">
          <Checkbox
            checked={selected}
            onChange={() => onToggleSelect(id)}
            aria-label={`Select ${title}`}
            onClick={(e) => e.stopPropagation()}
          />
        </td>
      )}
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          {pinned && <Pin size={12} className="shrink-0 text-amber-400" aria-label="Pinned" />}
          <Link
            href={`/snippets/${id}`}
            className="text-sm font-medium hover:text-primary transition-colors block truncate max-w-[300px]"
          >
            {title}
          </Link>
        </div>
      </td>
      <td className="px-3 py-2.5">
        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 whitespace-nowrap">
          {language}
        </Badge>
      </td>
      <td className="px-3 py-2.5 hidden md:table-cell">
        <div className="flex flex-wrap gap-1">
          {tags?.slice(0, 3).map((tag) => (
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
          {tags && tags.length > 3 && (
            <span className="text-[10px] text-muted-foreground">+{tags.length - 3}</span>
          )}
        </div>
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={togglePin}
            className="p-0.5 rounded hover:bg-accent/50 transition-colors opacity-0 group-hover/row:opacity-100"
            aria-label={pinned ? "Unpin snippet" : "Pin snippet"}
          >
            <Pin size={12} className={cn("transition-colors", pinned ? "text-amber-400" : "text-muted-foreground")} />
          </button>
          <button
            type="button"
            onClick={toggleFavorite}
            className="p-0.5 rounded hover:bg-accent/50 transition-colors opacity-0 group-hover/row:opacity-100"
            aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
          >
            <Star size={12} className={cn("transition-colors", favorited ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground")} />
          </button>
          <span className={cn("flex items-center gap-1 text-xs", visibilityConfig[visibility].color)}>
            <VisIcon size={12} suppressHydrationWarning />
            <span className="hidden sm:inline">{visibilityConfig[visibility].label}</span>
          </span>
        </div>
      </td>
      <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
        {new Date(createdAt).toLocaleDateString()}
      </td>
    </tr>
  );
}
