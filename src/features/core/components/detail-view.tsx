"use client";

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/features/core/utils/utils";
import { useToast } from "@/components/ui/toast";
import {
  Pencil,
  Trash2,
  Copy,
  Share2,
  Lock,
  Globe,
  Link2,
  Check,
  Download,
  CopyPlus,
} from "lucide-react";

interface DetailViewProps {
  id: string;
  title: string;
  description?: string;
  code: string;
  language: string;
  tags?: string[];
  visibility: "PRIVATE" | "SHARED" | "PUBLIC";
  shareToken?: string;
  createdAt: Date;
  updatedAt: Date;
  highlightedCode: string;
  isOwner: boolean;
  isSubmitting?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onToggleVisibility?: () => void;
}

const visibilityConfig = {
  PRIVATE: { icon: Lock, label: "Private", color: "text-muted-foreground" },
  SHARED: { icon: Link2, label: "Shared", color: "text-info" },
  PUBLIC: { icon: Globe, label: "Public", color: "text-success" },
};

const LANGUAGE_EXTENSIONS: Record<string, string> = {
  typescript: "ts",
  javascript: "js",
  python: "py",
  ruby: "rb",
  rust: "rs",
  go: "go",
  java: "java",
  kotlin: "kt",
  swift: "swift",
  php: "php",
  c: "c",
  cpp: "cpp",
  csharp: "cs",
  sql: "sql",
  html: "html",
  css: "css",
  scss: "scss",
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  xml: "xml",
  markdown: "md",
  shell: "sh",
  bash: "sh",
  zsh: "sh",
  powershell: "ps1",
  dockerfile: "Dockerfile",
  toml: "toml",
  ini: "ini",
  txt: "txt",
};

function getFilename(title: string, language: string): string {
  const ext = LANGUAGE_EXTENSIONS[language.toLowerCase()] ?? language.toLowerCase();
  const sanitizedName = title.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
  return ext === "Dockerfile" ? "Dockerfile" : `${sanitizedName}.${ext}`;
}

export function DetailView({
  title,
  description,
  code,
  language,
  tags,
  visibility,
  shareToken,
  updatedAt,
  highlightedCode,
  isOwner,
  isSubmitting,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleVisibility,
}: DetailViewProps) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();
  const VisIcon = visibilityConfig[visibility].icon;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    addToast("Code copied!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = getFilename(title, language);
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast(`Downloaded ${filename}`, "success");
  };

  const handleShare = () => {
    const url = new URL(window.location.href);
    if (visibility === "SHARED" && shareToken) {
      url.searchParams.set("token", shareToken);
    } else {
      url.searchParams.delete("token");
    }
    navigator.clipboard.writeText(url.toString());
    addToast("Share link copied!", "success");
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
                Updated {mounted ? new Date(updatedAt).toLocaleDateString() : new Date(updatedAt).toISOString().split('T')[0]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {isOwner && (
              <>
                <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit snippet" disabled={isSubmitting}>
                  <Pencil size={16} suppressHydrationWarning />
                </Button>
                <Button variant="ghost" size="icon" onClick={onDuplicate} aria-label="Duplicate snippet" disabled={isSubmitting}>
                  <CopyPlus size={16} suppressHydrationWarning />
                </Button>
                <Button variant="ghost" size="icon" onClick={onToggleVisibility} aria-label="Toggle visibility" disabled={isSubmitting}>
                  <VisIcon size={16} suppressHydrationWarning />
                </Button>
              </>
            )}
            {visibility === "SHARED" && (
              <Button variant="ghost" size="icon" onClick={handleShare} aria-label="Copy share link" disabled={isSubmitting}>
                <Share2 size={16} suppressHydrationWarning />
              </Button>
            )}
            {isOwner && (
              <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete snippet" className="text-destructive hover:text-destructive" disabled={isSubmitting}>
                <Trash2 size={16} suppressHydrationWarning />
              </Button>
            )}
          </div>
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
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 bg-card/80 backdrop-blur-sm"
            onClick={handleCopy}
            aria-label="Copy code to clipboard"
          >
            {copied ? <Check size={14} suppressHydrationWarning /> : <Copy size={14} suppressHydrationWarning />}
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 bg-card/80 backdrop-blur-sm"
            onClick={handleDownload}
            aria-label="Download code file"
          >
            <Download size={14} suppressHydrationWarning />
            Download
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
