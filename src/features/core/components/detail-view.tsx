"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import * as htmlToImage from "html-to-image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/features/core/utils/utils";
import { computeSnippetStats } from "@/features/snippets/utils/snippet-stats";
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
  FileText,
  BarChart3,
  ChevronDown,
  ArrowLeft,
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
  backUrl?: string;
  showLineNumbers?: boolean;
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
  backUrl,
  showLineNumbers = true,
}: DetailViewProps) {
  const [copied, setCopied] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const { addToast } = useToast();
  const VisIcon = VISIBILITY_CONFIG[visibility].icon;
  const { addRecentSnippet } = useRecentSnippets();
  const normalRef = useRef<HTMLDivElement>(null);
  const zenRef = useRef<HTMLDivElement>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (id && title) {
      addRecentSnippet(id, title);
    }
  }, [id, title, addRecentSnippet]);

  useEffect(() => {
    return () => clearTimeout(copyTimeoutRef.current);
  }, []);

  const [activeTab, setActiveTab] = useState(0);
  const activeFile = files[activeTab] || files[0];
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [statsOpen, setStatsOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [goToLineOpen, setGoToLineOpen] = useState(false);
  const [goToLineValue, setGoToLineValue] = useState("");
  const headerSentinelRef = useRef<HTMLDivElement>(null);
  const manualCollapseRef = useRef(false);
  const stats = useMemo(() => computeSnippetStats(files), [files]);

  const VAR_REGEX = /\{\{([A-Z0-9_]+)\}\}/g;
  const detectedVars = useMemo(() => Array.from(new Set(
    files.flatMap(f => {
      const matches = f.code.match(VAR_REGEX) || [];
      return matches.map(m => m.slice(2, -2));
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  )), [files]);

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
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if ((e.ctrlKey || e.metaKey) && e.key === "g") {
        e.preventDefault();
        setGoToLineOpen(true);
        setGoToLineValue("");
        return;
      }

      if (e.key === "Escape" && goToLineOpen) {
        setGoToLineOpen(false);
        setGoToLineValue("");
        return;
      }

      if (e.key === "Escape" && zenMode) {
        setZenMode(false);
        return;
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [zenMode, goToLineOpen]);

  useEffect(() => {
    const sentinel = headerSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          setHeaderCollapsed(true);
        } else if (!manualCollapseRef.current) {
          setHeaderCollapsed(false);
        }
      },
      { threshold: 0, rootMargin: "-4px 0px 0px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

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
    clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
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

  const handleDownloadMarkdown = () => {
    if (!activeFile) return;
    const frontmatter = [
      "---",
      `title: "${title.replace(/"/g, '\\"')}"`,
      description ? `description: "${description.replace(/"/g, '\\"')}"` : null,
      tags && tags.length > 0 ? `tags: [${tags.join(", ")}]` : null,
      `language: ${activeFile.language}`,
      "---",
      "",
      "```" + activeFile.language,
      processedCode,
      "```",
    ].filter(Boolean).join("\n");

    const sanitizedName = title.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
    const filename = `${sanitizedName}.md`;
    const blob = new Blob([frontmatter], { type: "text/markdown" });
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
    <>
      {showLineNumbers && (
        <style>{`.detail-view-code code{counter-reset:line}.detail-view-code .line{counter-increment:line}.detail-view-code .line::before{content:counter(line);display:inline-block;width:2.5rem;margin-right:1rem;text-align:right;color:#6e7681;user-select:none;flex-shrink:0}`}</style>
      )}
      <div 
      className="flex flex-col h-full overflow-hidden"
      style={{ viewTransitionName: `snippet-card-${id}` }}
    >
      <div className="border-b border-border">
        <div className="flex items-center gap-2 px-4 py-2">
          {backUrl && (
            <a
              href={backUrl}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label="Back to list"
            >
              <ArrowLeft size={14} suppressHydrationWarning />
            </a>
          )}
          <h1
            className="text-sm font-semibold truncate min-w-0"
            style={{ viewTransitionName: `snippet-title-${id}` }}
          >
            {title}
          </h1>
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
            <FileText size={10} className="opacity-50" suppressHydrationWarning />
            <span className="tabular-nums">{files.length}</span>
            <span className={cn("flex items-center gap-0.5", VISIBILITY_CONFIG[visibility].color)}>
              <VisIcon size={10} suppressHydrationWarning />
            </span>
            <span className="tabular-nums">{stats.lines.toLocaleString()} LOC</span>
          </span>
          <div className="flex-1" />
          <div className="flex items-center gap-0.5 shrink-0">
            {deletedAt ? (
              isOwner && (
                <>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRestore} aria-label="Restore snippet" disabled={isSubmitting}>
                    <RotateCcw size={14} suppressHydrationWarning />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onDelete} aria-label="Permanently delete snippet" disabled={isSubmitting}>
                    <Trash2 size={14} suppressHydrationWarning />
                  </Button>
                </>
              )
            ) : (
              <>
                {isOwner && (
                  <>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit} aria-label="Edit snippet" disabled={isSubmitting}>
                      <Pencil size={14} suppressHydrationWarning />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDuplicate} aria-label="Duplicate snippet" disabled={isSubmitting}>
                      <CopyPlus size={14} suppressHydrationWarning />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggleVisibility} aria-label="Toggle visibility" disabled={isSubmitting}>
                      <VisIcon size={14} suppressHydrationWarning />
                    </Button>
                  </>
                )}
                {!isOwner && onFork && (visibility === "PUBLIC" || visibility === "SHARED") && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={onFork} aria-label="Fork snippet" disabled={isSubmitting}>
                    <GitFork size={14} suppressHydrationWarning />
                  </Button>
                )}
                {(visibility === "SHARED" || visibility === "PUBLIC") && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleShare} aria-label="Share snippet" disabled={isSubmitting}>
                    <Share2 size={14} suppressHydrationWarning />
                  </Button>
                )}
                {isOwner && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onDelete} aria-label="Delete snippet" disabled={isSubmitting}>
                    <Trash2 size={14} suppressHydrationWarning />
                  </Button>
                )}
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => {
                if (headerCollapsed) {
                  manualCollapseRef.current = false;
                  setHeaderCollapsed(false);
                } else {
                  manualCollapseRef.current = true;
                  setHeaderCollapsed(true);
                }
              }}
              aria-label={headerCollapsed ? "Expand header" : "Collapse header"}
            >
              <ChevronDown
                size={14}
                className={cn("transition-transform duration-300", !headerCollapsed && "rotate-180")}
                suppressHydrationWarning
              />
            </Button>
          </div>
        </div>

        {(description || (tags && tags.length > 0) || (forkedFromId && forkedFromTitle)) && (
          <div
            className={cn(
              "grid transition-all duration-300 ease-in-out",
              headerCollapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
            )}
          >
            <div className="overflow-hidden">
              <div className="px-4 pb-3 space-y-2">
                {description && (
                  <p className="text-sm text-muted-foreground max-h-32 overflow-y-auto pr-1">{description}</p>
                )}

                {tags && tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[11px] px-1.5 py-0">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {forkedFromId && forkedFromTitle && (
                  <div className="flex items-center gap-1">
                    <GitFork size={11} className="text-muted-foreground" suppressHydrationWarning />
                    <span className="text-xs text-muted-foreground">
                      Forked from{" "}
                      <a href={`/snippets/${forkedFromId}`} className="text-primary hover:underline">
                        {forkedFromTitle}
                      </a>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div ref={headerSentinelRef} className="h-px shrink-0" />{/* sentinel for auto-collapse */}

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
            <div className="relative">
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
              <button
                onClick={() => setStatsOpen(!statsOpen)}
                className="absolute -right-0 top-0 bottom-0 w-5 flex items-center justify-center hover:bg-muted/50 rounded-r transition-colors"
                aria-label="Toggle snippet statistics"
              >
                <ChevronDown size={10} className={cn("transition-transform text-muted-foreground", statsOpen && "rotate-180")} />
              </button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 bg-card/80 backdrop-blur-sm"
              onClick={handleDownloadMarkdown}
              aria-label="Download as Markdown"
            >
              <FileText size={14} suppressHydrationWarning />
              .md
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
                {goToLineOpen && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5 shadow-lg">
                    <input
                      type="number"
                      min={1}
                      max={stats.lines}
                      placeholder={`Go to line (1-${stats.lines})`}
                      value={goToLineValue}
                      onChange={(e) => setGoToLineValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") { setGoToLineOpen(false); setGoToLineValue(""); }
                        if (e.key === "Enter") {
                          const line = parseInt(goToLineValue, 10);
                          if (line >= 1 && line <= stats.lines) {
                            window.location.hash = `#L${line}`;
                            setGoToLineOpen(false);
                            setGoToLineValue("");
                          }
                        }
                      }}
                      className="w-24 text-sm bg-transparent border-none outline-none font-mono"
                      autoFocus
                    />
                  </div>
                )}
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
      
      {statsOpen && (
        <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={14} className="text-muted-foreground" />
              <h3 className="text-sm font-semibold">Snippet Statistics</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="p-3 bg-muted/50 rounded-lg border border-border">
                <div className="text-[10px] text-muted-foreground uppercase">Characters</div>
                <div className="text-lg font-mono font-semibold">{stats.characters.toLocaleString()}</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg border border-border">
                <div className="text-[10px] text-muted-foreground uppercase">Words</div>
                <div className="text-lg font-mono font-semibold">{stats.words.toLocaleString()}</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg border border-border">
                <div className="text-[10px] text-muted-foreground uppercase">Lines</div>
                <div className="text-lg font-mono font-semibold">{stats.lines.toLocaleString()}</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg border border-border">
                <div className="text-[10px] text-muted-foreground uppercase">Read Time</div>
                <div className="text-lg font-mono font-semibold">~{stats.estimatedReadTime} min</div>
              </div>
            </div>
            {stats.languageDistribution.length > 1 && (
              <div>
                <div className="text-[10px] text-muted-foreground uppercase mb-2">Language Distribution</div>
                <div className="space-y-1.5">
                  {stats.languageDistribution.map((lang) => (
                    <div key={lang.language} className="flex items-center gap-2">
                      <span className="text-xs font-mono w-24 truncate">{lang.language}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${lang.percentage}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-10 text-right">{lang.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {zenMode && activeFile && (
        <div className="fixed inset-0 z-[100] bg-[#0d1117] flex flex-col p-4 overflow-hidden animate-in fade-in duration-200 relative">
          {goToLineOpen && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5 shadow-lg">
              <input
                type="number"
                min={1}
                max={stats.lines}
                placeholder={`Go to line (1-${stats.lines})`}
                value={goToLineValue}
                onChange={(e) => setGoToLineValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") { setGoToLineOpen(false); setGoToLineValue(""); }
                  if (e.key === "Enter") {
                    const line = parseInt(goToLineValue, 10);
                    if (line >= 1 && line <= stats.lines) {
                      window.location.hash = `#L${line}`;
                      setGoToLineOpen(false);
                      setGoToLineValue("");
                    }
                  }
                }}
                className="w-24 text-sm bg-transparent border-none outline-none font-mono"
                autoFocus
              />
            </div>
          )}
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
                  if (qrCanvasRef.current) {
                    const link = document.createElement("a");
                    link.download = `koalasnippet-${title.replace(/\s+/g, "_")}.png`;
                    link.href = qrCanvasRef.current.toDataURL();
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
        <QrCode ref={qrCanvasRef} value={getShareUrl()} size={300} />
      </div>
    </div>
    </>
  );
}
