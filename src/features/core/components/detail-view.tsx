"use client";

import { useState, useEffect, useSyncExternalStore, useRef } from "react";
import * as htmlToImage from "html-to-image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/features/core/utils/utils";
import { useToast } from "@/components/ui/toast";
import { VISIBILITY_CONFIG } from "@/features/snippets/utils/constants";
import { useRecentSnippets } from "@/features/core/hooks/use-recent-snippets";
import { QrCode } from "@/features/snippets/components/qr-code";
import {
  Pencil,
  Trash2,
  Copy,
  Share2,
  Check,
  Download,
  CopyPlus,
  Camera,
  RotateCcw,
  GitFork,
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
  deletedAt?: Date | null;
  forkedFromId?: string;
  forkedFromTitle?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onRestore?: () => void;
  onDuplicate?: () => void;
  onToggleVisibility?: () => void;
  onFork?: () => void;
}

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
  id,
  title,
  description,
  tags,
  visibility,
  shareToken,
  updatedAt,
  files,
  isOwner,
  isSubmitting,
  deletedAt,
  forkedFromId,
  forkedFromTitle,
  onEdit,
  onDelete,
  onRestore,
  onDuplicate,
  onToggleVisibility,
  onFork,
}: DetailViewProps) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [copied, setCopied] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const { addToast } = useToast();
  const VisIcon = VISIBILITY_CONFIG[visibility].icon;
  const { addRecentSnippet } = useRecentSnippets();
  const normalRef = useRef<HTMLDivElement>(null);
  const zenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id && title) {
      addRecentSnippet(id, title);
    }
  }, [id, title, addRecentSnippet]);

  const [activeTab, setActiveTab] = useState(0);
  const activeFile = files[activeTab] || files[0];
  const [envVars, setEnvVars] = useState<Record<string, string>>({});

  const VAR_REGEX = /\{\{([A-Z0-9_]+)\}\}/g;
  const detectedVars = Array.from(new Set(
    files.flatMap(f => {
      const matches = f.code.match(VAR_REGEX) || [];
      return matches.map(m => m.slice(2, -2));
    })
  ));

  const handleEnvChange = (key: string, value: string) => {
    setEnvVars(prev => ({ ...prev, [key]: value }));
  };

  const escapeHtml = (unsafe: string) => {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
  };

  const processedCode = activeFile ? activeFile.code.replace(VAR_REGEX, (match, key) => envVars[key] || match) : "";
  const processedHighlightedCode = activeFile ? activeFile.highlightedCode.replace(VAR_REGEX, (match, key) => {
    return envVars[key] ? escapeHtml(envVars[key]) : match;
  }) : "";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && zenMode) {
        setZenMode(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [zenMode]);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith("#L")) return;

    const parts = hash.substring(2).split("-L");
    const start = parseInt(parts[0], 10);
    let end = parts.length > 1 ? parseInt(parts[1], 10) : start;

    if (isNaN(start)) return;
    if (isNaN(end)) end = start;

    const currentRef = zenMode ? zenRef.current : normalRef.current;
    if (!currentRef) return;

    const lines = currentRef.querySelectorAll('.line');
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      if (lineNum >= start && lineNum <= end) {
        line.classList.add('bg-primary/30', 'block', 'w-full');
      } else {
        line.classList.remove('bg-primary/30', 'block', 'w-full');
      }
    });

    if (start > 0 && start <= lines.length) {
      lines[start - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeFile, zenMode]);

  const handleCopy = async (format: "raw" | "markdown" = "raw") => {
    if (!activeFile) return;
    let textToCopy = processedCode;
    if (format === "markdown") {
      textToCopy = "```" + activeFile.language + "\n" + textToCopy + "\n```";
    }
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    addToast(`Copied as ${format === "raw" ? "Raw code" : "Markdown"}!`, "success");
    setTimeout(() => setCopied(false), 2000);
    setCopyOpen(false);
  };

  const handleDownload = () => {
    if (!activeFile) return;
    const filename = getFilename(activeFile.filename, activeFile.language);
    const blob = new Blob([processedCode], { type: "text/plain" });
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
    setShareModalOpen(true);
  };

  const getShareUrl = () => {
    const url = new URL(window.location.href);
    if (visibility === "SHARED" && shareToken) {
      url.searchParams.set("token", shareToken);
    } else {
      url.searchParams.delete("token");
    }
    return url.toString();
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(getShareUrl());
    addToast("Share link copied!", "success");
  };

  const handleScreenshot = async () => {
    const currentRef = zenMode ? zenRef.current : normalRef.current;
    if (!currentRef) return;
    try {
      addToast("Generating screenshot...", "info");
      const dataUrl = await htmlToImage.toPng(currentRef, {
        backgroundColor: zenMode ? "#0d1117" : undefined,
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
    <div 
      className="flex flex-col h-full overflow-hidden"
      style={{ viewTransitionName: `snippet-card-${id}` }}
    >
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 
              className="text-xl font-semibold"
              style={{ viewTransitionName: `snippet-title-${id}` }}
            >
              {title}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{files.length} {files.length === 1 ? 'file' : 'files'}</Badge>
              <span className={cn("flex items-center gap-1 text-xs", VISIBILITY_CONFIG[visibility].color)}>
                <VisIcon size={12} suppressHydrationWarning />
                {VISIBILITY_CONFIG[visibility].label}
              </span>
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {files.reduce((acc, f) => acc + f.code.split('\n').length, 0)} LOC • ~{Math.max(1, Math.ceil(files.reduce((acc, f) => acc + f.code.split('\n').length, 0) / 50))} min read
              </span>
              <span className="text-xs text-muted-foreground">
                Updated {mounted ? new Date(updatedAt).toLocaleDateString() : new Date(updatedAt).toISOString().split('T')[0]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {deletedAt ? (
              isOwner && (
                <>
                  <Button variant="ghost" size="icon" onClick={onRestore} aria-label="Restore snippet" className="text-primary hover:text-primary/80 hover:bg-primary/10" disabled={isSubmitting}>
                    <RotateCcw size={16} suppressHydrationWarning />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Permanently delete snippet" className="text-destructive hover:text-destructive hover:bg-destructive/10" disabled={isSubmitting}>
                    <Trash2 size={16} suppressHydrationWarning />
                  </Button>
                </>
              )
            ) : (
              <>
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
                {!isOwner && onFork && (visibility === "PUBLIC" || visibility === "SHARED") && (
                  <Button variant="ghost" size="icon" onClick={onFork} aria-label="Fork snippet" className="text-primary hover:text-primary/80 hover:bg-primary/10" disabled={isSubmitting}>
                    <GitFork size={16} suppressHydrationWarning />
                  </Button>
                )}
                {(visibility === "SHARED" || visibility === "PUBLIC") && (
                  <Button variant="ghost" size="icon" onClick={handleShare} aria-label="Share snippet" disabled={isSubmitting}>
                    <Share2 size={16} suppressHydrationWarning />
                  </Button>
                )}
                {isOwner && (
                  <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete snippet" className="text-destructive hover:text-destructive" disabled={isSubmitting}>
                    <Trash2 size={16} suppressHydrationWarning />
                  </Button>
                )}
              </>
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

        {forkedFromId && forkedFromTitle && (
          <div className="flex items-center gap-1.5">
            <GitFork size={12} className="text-muted-foreground" suppressHydrationWarning />
            <span className="text-xs text-muted-foreground">
              Forked from{" "}
              <a href={`/snippets/${forkedFromId}`} className="text-primary hover:underline">
                {forkedFromTitle}
              </a>
            </span>
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

        <div className="flex-1 overflow-auto relative bg-muted/20">
          <div className="absolute top-3 right-3 z-20 flex gap-2">
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 bg-card/80 backdrop-blur-sm"
                onClick={() => setCopyOpen(!copyOpen)}
                aria-label="Copy code options"
              >
                {copied ? <Check size={14} suppressHydrationWarning /> : <Copy size={14} suppressHydrationWarning />}
                {copied ? "Copied!" : "Copy"}
              </Button>
              {copyOpen && (
                <div className="absolute right-0 top-full mt-1 w-32 bg-popover border border-border rounded-md shadow-md z-50 flex flex-col overflow-hidden">
                  <button onClick={() => handleCopy("raw")} className="text-left px-3 py-2 text-sm hover:bg-accent/50">Raw Code</button>
                  <button onClick={() => handleCopy("markdown")} className="text-left px-3 py-2 text-sm hover:bg-accent/50">Markdown</button>
                </div>
              )}
            </div>
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
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 bg-card/80 backdrop-blur-sm"
              onClick={() => setZenMode(true)}
              aria-label="Enter Zen Mode"
            >
              Zen Mode
            </Button>
          </div>

          {detectedVars.length > 0 && (
            <div className="px-4 pt-12 pb-2 relative z-10 max-w-4xl lg:mx-auto">
              <div className="bg-background/60 backdrop-blur-xl border border-primary/30 rounded-xl p-5 shadow-[0_0_40px_-10px_rgba(var(--primary),0.2)]">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-primary font-mono font-bold tracking-wider">.ENV</span>
                  <Badge variant="outline" className="text-[10px] border-primary/30 text-primary/80 bg-primary/5">Local Only</Badge>
                  <span className="text-xs text-muted-foreground ml-auto">Fill variables to update snippet</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {detectedVars.map(v => (
                    <div key={v} className="flex flex-col gap-1.5 relative group">
                      <label className="text-[11px] uppercase font-bold text-muted-foreground tracking-widest pl-1">{v}</label>
                      <input 
                        type="text"
                        className="bg-card/50 border border-border/50 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-foreground transition-all placeholder:text-muted-foreground/30"
                        placeholder="[ Enter value ]"
                        value={envVars[v] || ""}
                        onChange={(e) => handleEnvChange(v, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeFile && (
            <div className={cn("p-4 flex justify-center items-start min-h-full", detectedVars.length === 0 && "pt-12 pb-8")}>
              <div
                ref={normalRef}
                className="w-full max-w-4xl p-6 sm:p-10 rounded-2xl bg-gradient-to-tr from-slate-950 via-[#131b2e] to-slate-950 flex items-center justify-center border border-white/5"
              >
                <div 
                  className="w-full rounded-xl border border-border bg-[#0d1117] shadow-2xl overflow-hidden relative"
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
                  className="p-6 font-mono text-sm leading-relaxed overflow-auto detail-view-code"
                  dangerouslySetInnerHTML={{ __html: processedHighlightedCode }}
                  style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                />
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
      
      {zenMode && activeFile && (
        <div className="fixed inset-0 z-[100] bg-[#0d1117] flex flex-col p-4 overflow-hidden animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-4 bg-white/5 p-3 rounded-lg border border-white/10 shrink-0">
            <div className="text-white/80 font-mono text-sm">{activeFile.filename}</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleCopy("raw")} className="bg-transparent border-white/20 text-white hover:bg-white/10 gap-1.5">
                {copied ? <Check size={14} /> : <Copy size={14} />} Copy
              </Button>
              <Button variant="outline" size="sm" onClick={() => setZenMode(false)} className="bg-transparent border-white/20 text-white hover:bg-white/10">
                Exit Zen Mode (Esc)
              </Button>
            </div>
          </div>
          <div 
            ref={zenRef}
            className="flex-1 overflow-auto bg-[#0d1117] rounded-xl border border-white/10 p-6 font-mono text-sm leading-relaxed text-white/90 detail-view-code"
            dangerouslySetInnerHTML={{ __html: processedHighlightedCode }}
            style={{ fontFamily: "var(--font-jetbrains), monospace" }}
          />
        </div>
      )}
      
      {shareModalOpen && (
        <div
          className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShareModalOpen(false)}
        >
          <div
            className="bg-card border border-border rounded-xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Share Snippet</h3>

            <div className="flex justify-center mb-4">
              <div className="bg-white p-3 rounded-lg border border-border">
                <QrCode value={getShareUrl()} size={180} />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-1.5"
                onClick={handleCopyShareLink}
              >
                <Copy size={14} suppressHydrationWarning />
                Copy Link
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-1.5"
                onClick={() => {
                  const canvas = document.querySelector("#qr-canvas-download canvas") as HTMLCanvasElement | null;
                  if (canvas) {
                    const link = document.createElement("a");
                    link.download = `koalasnippet-${title.replace(/\s+/g, "_")}.png`;
                    link.href = canvas.toDataURL();
                    link.click();
                    addToast("QR code downloaded!", "success");
                  }
                }}
              >
                <Download size={14} suppressHydrationWarning />
                Download QR
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-3"
              onClick={() => setShareModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}

      <div id="qr-canvas-download" className="hidden">
        <QrCode value={getShareUrl()} size={300} />
      </div>
    </div>
  );
}
