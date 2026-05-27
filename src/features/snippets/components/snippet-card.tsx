"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import KoalaFile from "../../../../public/KoalaFile.png";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/features/core/utils/utils";
import { VISIBILITY_CONFIG } from "@/features/snippets/utils/constants";
import { SafeZone } from "@/components/ui/safe-zone";
import { ContextMenu } from "@/components/ui/context-menu";
import { useToast } from "@/components/ui/toast";
import { LinkIcon, Loader2, Pencil, Trash2, X, Copy, Check, Star, Pin } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface SnippetCardProps {
  id: string;
  title: string;
  description?: string;
  language: string;
  tags?: string[];
  visibility: "PRIVATE" | "SHARED" | "PUBLIC";
  createdAt: Date | string;
  snippetDensity?: "compact" | "preview" | "full";
  highlightedCode?: string;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  authorUsername?: string;
  totalLines?: number;
  isPinned?: boolean;
  isFavorited?: boolean;
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
  totalLines = 0,
  isPinned = false,
  isFavorited = false,
}: SnippetCardProps) {
  const VisIcon = VISIBILITY_CONFIG[visibility].icon;
  const { addToast } = useToast();

  const [editingTags, setEditingTags] = useState(false);
  const [localTags, setLocalTags] = useState<string[]>([]);
  const [savingTags, setSavingTags] = useState(false);
  const savingRef = useRef(false);
  const [copyingCode, setCopyingCode] = useState(false);
  const [pinned, setPinned] = useState(isPinned);
  const [favorited, setFavorited] = useState(isFavorited);

  const handleSaveTags = useCallback(async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSavingTags(true);
    try {
      await fetch(`/api/snippets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: localTags }),
      });
      setEditingTags(false);
    } finally {
      savingRef.current = false;
      setSavingTags(false);
    }
  }, [id, localTags]);

  const handleCopyCode = useCallback(async () => {
    if (!highlightedCode) return;
    const plainText = highlightedCode.replace(/<[^>]*>/g, "");
    await navigator.clipboard.writeText(plainText);
    setCopyingCode(true);
    addToast("Code copied to clipboard", "success");
    setTimeout(() => setCopyingCode(false), 2000);
  }, [highlightedCode, addToast]);

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

  const dateStr = new Date(createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'numeric', year: 'numeric' });
  const timeStr = new Date(createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const dateDisplay = `Vom ${dateStr}, ${timeStr}`;

  const estimatedReadingTime = Math.max(1, Math.ceil(totalLines / 50));

  const getLanguageGradient = (lang: string) => {
    switch (lang.toLowerCase()) {
      case "typescript":
      case "ts": return "from-blue-600/30 to-blue-900/10";
      case "javascript":
      case "js": return "from-yellow-500/30 to-yellow-900/10";
      case "python": return "from-green-500/30 to-green-900/10";
      case "rust": return "from-orange-600/30 to-orange-900/10";
      case "go": return "from-cyan-500/30 to-cyan-900/10";
      case "html": return "from-orange-500/30 to-orange-900/10";
      case "css": return "from-blue-500/30 to-blue-900/10";
      default: return "from-slate-700/30 to-slate-900/10";
    }
  };

  const gradientClass = getLanguageGradient(language);

  return (
    <SafeZone name={`SnippetCard-${id}`}>
    <ContextMenu
      options={[
        { label: "Copy Link", icon: LinkIcon, onClick: () => {
          const url = `${window.location.origin}/snippets/${id}`;
          navigator.clipboard.writeText(url);
          addToast("Link copied to clipboard", "success");
        }},
        { label: "Copy Code", icon: copyingCode ? Check : Copy, onClick: handleCopyCode },
        { label: "Edit Snippet", icon: Pencil, onClick: () => {
          window.location.href = `/snippets/${id}`;
        }},
        { label: "Delete", icon: Trash2, variant: "destructive", onClick: () => {
          fetch(`/api/snippets/${id}`, { method: "DELETE" }).then(() => {
            addToast("Snippet moved to trash", "info", { label: "Undo", onClick: () => fetch(`/api/snippets/${id}`, { method: "PUT", body: JSON.stringify({ isRestore: true }) }) });
            setTimeout(() => window.location.reload(), 2000);
          });
        }}
      ]}
    >
    <Link
      href={`/snippets/${id}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/json", JSON.stringify({ type: "snippet", id }));
      }}
      onClick={(e) => {
        if (editingTags) {
          e.preventDefault();
        }
      }}
      className={cn(
        "group block rounded-xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg relative cursor-grab active:cursor-grabbing overflow-hidden",
        selected && "border-primary/50 ring-1 ring-primary/30 bg-primary/5"
      )}
      style={{ viewTransitionName: `snippet-card-${id}` }}
      aria-label={`View snippet: ${title}`}
    >
      <div className={cn("h-10 w-full absolute top-0 left-0 bg-gradient-to-r opacity-50 transition-opacity group-hover:opacity-100", gradientClass)} />
      <div className="p-3 sm:p-4 relative z-10">
      {onToggleSelect && (
        <div className="absolute top-2 left-2 z-10">
          <Checkbox
            checked={selected}
            onChange={() => onToggleSelect(id)}
            aria-label={`Select ${title}`}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      <div className={cn("flex items-start justify-between gap-2 mb-2", onToggleSelect && "ml-6")}>
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <Image src={KoalaFile} alt="" width={22} height={22} className="shrink-0 opacity-60" />
          {pinned && <Pin size={12} className="shrink-0 text-amber-400" aria-label="Pinned" />}
          <h3
            className="font-medium text-sm truncate group-hover:text-primary transition-colors"
            style={{ viewTransitionName: `snippet-title-${id}` }}
          >
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={togglePin}
            className="p-0.5 rounded hover:bg-accent/50 transition-colors"
            aria-label={pinned ? "Unpin snippet" : "Pin snippet"}
          >
            <Pin size={12} className={cn("transition-colors", pinned ? "text-amber-400" : "text-muted-foreground opacity-0 group-hover:opacity-100")} />
          </button>
          <button
            type="button"
            onClick={toggleFavorite}
            className="p-0.5 rounded hover:bg-accent/50 transition-colors"
            aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
          >
            <Star size={12} className={cn("transition-colors", favorited ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground opacity-0 group-hover:opacity-100")} />
          </button>
          <VisIcon size={12} className={cn("shrink-0 mt-0.5", VISIBILITY_CONFIG[visibility].color)} suppressHydrationWarning aria-label={`Visibility: ${visibility}`} />
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-2">
        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 shrink-0">
          {language}
        </Badge>
        {totalLines > 0 && (
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {totalLines} LOC • ~{estimatedReadingTime} min read
          </span>
        )}
        <span className="text-xs text-muted-foreground truncate">
          {dateDisplay}{authorUsername ? ` • Erstellt von ${authorUsername}` : ""}
        </span>
      </div>

      {description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
          {description}
        </p>
      )}

      {!editingTags && tags && tags.length > 0 && (
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
          <button
            type="button"
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors ml-1"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setLocalTags([...(tags || [])]);
              setEditingTags(true);
            }}
            aria-label="Edit tags"
          >
            Edit
          </button>
        </div>
      )}

      {editingTags && (
        <div
          className="flex flex-wrap gap-1 items-center"
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              handleSaveTags();
            }
          }}
        >
          {localTags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="text-[10px] h-4 px-1 gap-0.5 cursor-default"
            >
              {tag}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setLocalTags((prev) => prev.filter((t) => t !== tag));
                }}
                className="ml-0.5 hover:text-destructive"
                aria-label={`Remove tag ${tag}`}
              >
                <X size={10} />
              </button>
            </Badge>
          ))}
          <input
            className="w-20 h-5 px-1.5 text-[10px] bg-muted/50 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="+ tag"
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.currentTarget.value.trim()) {
                const newTag = e.currentTarget.value.trim();
                if (!localTags.includes(newTag)) {
                  setLocalTags((prev) => [...prev, newTag]);
                }
                e.currentTarget.value = "";
              }
              if (e.key === "Escape") {
                setEditingTags(false);
                handleSaveTags();
              }
            }}
          />
          {savingTags && (
            <Loader2 size={12} className="animate-spin text-muted-foreground" />
          )}
        </div>
      )}

      {snippetDensity !== "compact" && highlightedCode && (
        <div
          className="mt-3 rounded-md border border-border bg-muted/20 text-[11px] max-h-40 overflow-y-auto leading-normal [&>pre]:!bg-transparent [&>pre]:!p-2 [&>pre]:!m-0 [&>pre]:overflow-x-auto select-text font-mono [&_span]:!bg-transparent"
          style={{ fontFamily: "var(--font-jetbrains), monospace" }}
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        />
      )}
      </div>
    </Link>
    </ContextMenu>
    </SafeZone>
  );
}
