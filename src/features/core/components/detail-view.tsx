"use client";

import { useState, useSyncExternalStore, useRef } from "react";
import * as htmlToImage from "html-to-image";
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
  Camera,
} from "lucide-react";

interface DetailViewProps {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  visibility: "PRIVATE" | "SHARED" | "PUBLIC";
  shareToken?: string;
  updatedAt: Date;
  files: { id?: string; filename: string; code: string; language: string; highlightedCode: string }[];
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
  tags,
  visibility,
  shareToken,
  updatedAt,
  files,
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
  const codeRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState(0);
  const activeFile = files[activeTab] || files[0];

  const handleCopy = async () => {
    if (!activeFile) return;
    await navigator.clipboard.writeText(activeFile.code);
    setCopied(true);
    addToast("Code copied!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!activeFile) return;
    const filename = getFilename(activeFile.filename, activeFile.language);
    const blob = new Blob([activeFile.code], { type: "text/plain" });
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

  const handleScreenshot = async () => {
    if (!codeRef.current) return;
    try {
      addToast("Generating screenshot...", "info");
      const dataUrl = await htmlToImage.toPng(codeRef.current, {
        backgroundColor: "transparent",
        pixelRatio: 2,
        style: {
          transform: "scale(1)",
        },
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${title.replace(/\s+/g, "_")}_screenshot.png`;
      a.click();
      addToast("Screenshot downloaded!", "success");
    } catch (err) {
      console.error("Screenshot error", err);
      addToast("Failed to generate screenshot", "error");
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">{title}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{files.length} {files.length === 1 ? 'file' : 'files'}</Badge>
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

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {files.length > 1 && (
          <div className="flex border-b border-border bg-muted/50 overflow-x-auto">
            {files.map((file, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab(idx)}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-r border-border transition-colors whitespace-nowrap",
                  activeTab === idx ? "bg-card text-foreground border-b-2 border-b-primary" : "text-muted-foreground hover:bg-muted"
                )}
              >
                {file.filename}
                <span className="ml-2 text-xs opacity-50">{file.language}</span>
              </button>
            ))}
          </div>
        )}

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
              onClick={handleScreenshot}
              aria-label="Export as Image"
            >
              <Camera size={14} suppressHydrationWarning />
              Screenshot
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

          {activeFile && (
            <div className="p-4 pt-12 pb-8 flex justify-center items-start min-h-full bg-muted/20">
              <div 
                ref={codeRef} 
                className="w-full max-w-4xl rounded-xl border border-border bg-[#0d1117] shadow-2xl overflow-hidden"
              >
                <div className="flex items-center px-4 py-3 border-b border-white/10 bg-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                  </div>
                  <div className="flex-1 text-center text-xs text-white/50 font-mono pr-12">
                    {activeFile.filename}
                  </div>
                </div>
                <div
                  className="p-6 font-mono text-sm leading-relaxed overflow-auto"
                  dangerouslySetInnerHTML={{ __html: activeFile.highlightedCode }}
                  style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
