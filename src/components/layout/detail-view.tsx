"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Pencil,
  Trash2,
  Copy,
  Share2,
  Lock,
  Globe,
  Link2,
  Check,
} from "lucide-react";

interface DetailViewProps {
  id: string;
  title: string;
  description?: string;
  code: string;
  language: string;
  tags?: string[];
  visibility: "PRIVATE" | "SHARED" | "PUBLIC";
  createdAt: Date;
  updatedAt: Date;
  highlightedCode: string;
  isOwner: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleVisibility?: () => void;
}

const visibilityConfig = {
  PRIVATE: { icon: Lock, label: "Private", color: "text-muted-foreground" },
  SHARED: { icon: Link2, label: "Shared", color: "text-info" },
  PUBLIC: { icon: Globe, label: "Public", color: "text-success" },
};

export function DetailView({
  title,
  description,
  code,
  language,
  tags,
  visibility,
  createdAt,
  updatedAt,
  highlightedCode,
  isOwner,
  onEdit,
  onDelete,
  onToggleVisibility,
}: DetailViewProps) {
  const [copied, setCopied] = useState(false);
  const VisIcon = visibilityConfig[visibility].icon;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">{title}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{language}</Badge>
              <span className={cn("flex items-center gap-1 text-xs", visibilityConfig[visibility].color)}>
                <VisIcon size={12} suppressHydrationWarning />
                {visibilityConfig[visibility].label}
              </span>
              <span className="text-xs text-muted-foreground">
                Updated {updatedAt.toLocaleDateString()}
              </span>
            </div>
          </div>

          {isOwner && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={onEdit} title="Edit">
                <Pencil size={16} suppressHydrationWarning />
              </Button>
              <Button variant="ghost" size="icon" onClick={onToggleVisibility} title="Toggle visibility">
                <VisIcon size={16} suppressHydrationWarning />
              </Button>
              {visibility === "SHARED" && (
                <Button variant="ghost" size="icon" title="Share" onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                }}>
                  <Share2 size={16} suppressHydrationWarning />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onDelete} title="Delete" className="text-destructive hover:text-destructive">
                <Trash2 size={16} suppressHydrationWarning />
              </Button>
            </div>
          )}
        </div>

        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}

        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto relative">
        <div className="absolute top-3 right-3 z-10">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 bg-card/80 backdrop-blur-sm"
            onClick={handleCopy}
          >
            {copied ? <Check size={14} suppressHydrationWarning /> : <Copy size={14} suppressHydrationWarning />}
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>

        <div
          className="p-4 font-mono text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
          style={{ fontFamily: "var(--font-jetbrains), monospace" }}
        />
      </div>
    </div>
  );
}
