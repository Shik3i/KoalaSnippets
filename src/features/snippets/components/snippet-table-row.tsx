"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/features/core/utils/utils";
import { Lock, Globe, Link2 } from "lucide-react";

interface SnippetTableRowProps {
  id: string;
  title: string;
  language: string;
  tags?: string[];
  visibility: "PRIVATE" | "SHARED" | "PUBLIC";
  createdAt: Date;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
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
}: SnippetTableRowProps) {
  const VisIcon = visibilityConfig[visibility].icon;
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  return (
    <tr
      className={cn(
        "border-b border-border transition-colors",
        selected ? "bg-primary/5" : "hover:bg-muted/30"
      )}
    >
      {onToggleSelect && (
        <td className="w-10 px-2 py-2.5">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(id)}
            className="rounded border-border text-primary focus:ring-ring cursor-pointer"
            aria-label={`Select ${title}`}
            onClick={(e) => e.stopPropagation()}
          />
        </td>
      )}
      <td className="px-3 py-2.5">
        <Link
          href={`/snippets/${id}`}
          className="text-sm font-medium hover:text-primary transition-colors block truncate max-w-[300px]"
        >
          {title}
        </Link>
      </td>
      <td className="px-3 py-2.5">
        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 whitespace-nowrap">
          {language}
        </Badge>
      </td>
      <td className="px-3 py-2.5 hidden md:table-cell">
        <div className="flex flex-wrap gap-1">
          {tags?.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px] h-4 px-1">
              {tag}
            </Badge>
          ))}
          {tags && tags.length > 3 && (
            <span className="text-[10px] text-muted-foreground">+{tags.length - 3}</span>
          )}
        </div>
      </td>
      <td className="px-3 py-2.5">
        <span className={cn("flex items-center gap-1 text-xs", visibilityConfig[visibility].color)}>
          <VisIcon size={12} suppressHydrationWarning />
          <span className="hidden sm:inline">{visibilityConfig[visibility].label}</span>
        </span>
      </td>
      <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
        {mounted ? new Date(createdAt).toLocaleDateString() : new Date(createdAt).toISOString().split('T')[0]}
      </td>
    </tr>
  );
}
