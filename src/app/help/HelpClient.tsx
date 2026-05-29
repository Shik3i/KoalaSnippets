"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/features/core/components/sidebar";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/features/core/i18n";
import { cn } from "@/features/core/utils/utils";
import {
  HelpCircle,
  BookOpen,
  Keyboard,
  Terminal,
  Star,
  Copy,
  Check,
  Search,
  Eye,
  LayoutGrid,
  Table,
  User,
  Tags,
  Code,
  ArrowRight,
  Pin,
  Sparkles,
  Info,
  Lock,
  Link2,
  Globe,
  Download,
  ChevronDown,
} from "lucide-react";

interface HelpClientProps {
  sidebarTags: string[];
  sidebarLanguages: string[];
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const mockupCode = `// Matrix rain canvas animation effect
function drawMatrixRain() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#10b981"; // vibrant green
  ctx.font = fontSize + "px monospace";
  drops.forEach((y, x) => {
    const text = chars[Math.floor(Math.random() * chars.length)];
    ctx.fillText(text, x * fontSize, y * fontSize);
    if (y * fontSize > canvas.height && Math.random() > 0.975) {
      drops[x] = 0;
    }
    drops[x]++;
  });
}`;

export function HelpClient({
  sidebarTags,
  sidebarLanguages,
  isAuthenticated,
  isAdmin,
}: HelpClientProps) {
  const { t } = useI18n();
  const { addToast } = useToast();

  const [viewMode, setViewMode] = useState<"preview" | "compact" | "table">("preview");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [copied, setCopied] = useState(false);

  // Simulated Import Mockup State
  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ title: string; language: string; code: string } | null>(null);

  // FAQ Accordion State
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);

  // Scroll Entrance Animations via IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove("opacity-0", "translate-y-8");
            entry.target.classList.add("opacity-100", "translate-y-0");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05 }
    );

    const elements = document.querySelectorAll(".scroll-animate");
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const handleSimulatedImport = () => {
    if (!importUrl.trim()) {
      addToast(t.helpImportMockToastError, "error");
      return;
    }
    setIsImporting(true);
    setImportResult(null);

    setTimeout(() => {
      setIsImporting(false);
      const isSuccess = importUrl.includes("github") || importUrl.includes("raw") || importUrl.includes("code");
      if (isSuccess) {
        setImportResult({
          title: "Matrix Rain Script",
          language: importUrl.endsWith(".css") ? "css" : "javascript",
          code: importUrl.endsWith(".css") ? "body { background: black; overflow: hidden; }" : mockupCode,
        });
        addToast(t.helpImportMockToastSuccess, "success");
      } else {
        addToast(t.helpImportMockToastError, "error");
      }
    }, 1500);
  };

  const toggleFaq = (index: number) => {
    setFaqOpenIndex(faqOpenIndex === index ? null : index);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mockupCode);
      setCopied(true);
      addToast(t.helpMockCopiedToast, "success");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      addToast("Failed to copy code", "error");
    }
  };

  const handleFavoriteToggle = () => {
    const nextFav = !isFavorite;
    setIsFavorite(nextFav);
    addToast(nextFav ? t.helpMockFavAddToast : t.helpMockFavRemToast, "success");
  };

  const handlePinToggle = () => {
    const nextPin = !isPinned;
    setIsPinned(nextPin);
    addToast(nextPin ? t.helpMockPinAddToast : t.helpMockPinRemToast, "success");
  };

  const handleTagClick = (tag: string) => {
    addToast(t.helpMockTagToast, "info");
  };

  const handleLangClick = () => {
    addToast(t.helpMockLangToast, "info");
  };

  function KbdKey({ children }: { children: React.ReactNode }) {
    return (
      <kbd className="px-1.5 py-0.5 text-[11px] font-mono font-semibold bg-muted border border-border rounded shadow-sm text-foreground min-w-[20px] text-center inline-block">
        {children}
      </kbd>
    );
  }

  const shortcutGroups = [
    {
      title: t.helpShortcutGroupGeneral,
      shortcuts: [
        { keys: ["⌘ K", "Ctrl+K"], desc: t.helpShortcutCommandPalette },
        { keys: ["/"], desc: t.helpShortcutFocusSearch },
        { keys: ["?"], desc: t.helpShortcutShowShortcuts },
        { keys: ["Esc"], desc: t.helpShortcutClearSearch },
      ],
    },
    {
      title: t.helpShortcutGroupNavigation,
      shortcuts: [
        { keys: ["J"], desc: t.helpShortcutNextSnippet },
        { keys: ["K"], desc: t.helpShortcutPrevSnippet },
        { keys: ["Enter"], desc: t.helpShortcutOpenSnippet },
        { keys: ["⌘ ⇧ T", "Ctrl+Shift+T"], desc: t.helpShortcutOpenTrash },
      ],
    },
    {
      title: t.helpShortcutGroupActions,
      shortcuts: [
        { keys: ["⌘ ⇧ N", "Ctrl+Shift+N"], desc: t.helpShortcutNewSnippet },
        { keys: ["⌘ ⇧ D", "Ctrl+Shift+D"], desc: t.helpShortcutDuplicateSnippet },
        { keys: ["F"], desc: t.helpShortcutToggleFavorite },
        { keys: ["P"], desc: t.helpShortcutTogglePin },
        { keys: ["Delete"], desc: t.helpShortcutDeleteSnippet },
        { keys: ["⌘ S", "Ctrl+S"], desc: t.helpShortcutSaveSnippet },
        { keys: ["⌘ ⇧ F", "Ctrl+Shift+F"], desc: t.helpShortcutFormatCode },
      ],
    },
  ];

  const searchCommands = [
    { prefix: "tag:python", desc: t.helpMockTagToast, example: "tag:react" },
    { prefix: "tag:!python", desc: "Exclude tag", example: "tag:!web" },
    { prefix: "lang:js", desc: t.helpMockLangToast, example: "lang:typescript" },
    { prefix: "lang:!js", desc: "Exclude language", example: "lang:!python" },
    { prefix: "is:public", desc: "Filter by public visibility", example: "is:private" },
    { prefix: "is:favorited", desc: "Show only favorites", example: "is:favorited" },
    { prefix: "is:!favorited", desc: "Exclude favorites", example: "is:!favorited" },
    { prefix: "is:pinned", desc: "Show only pinned", example: "is:pinned" },
    { prefix: "is:!pinned", desc: "Exclude pinned", example: "is:!pinned" },
    { prefix: "from:username", desc: t.creator, example: "from:koala" },
    { prefix: "from:!username", desc: t.creatorModeExclude, example: "from:!alice" },
    { prefix: "lines:>N", desc: "Filter total lines > N", example: "lines:>50" },
    { prefix: "lines:<N", desc: "Filter total lines < N", example: "lines:<10" },
    { prefix: "before:YYYY-MM-DD", desc: "Filter created before date", example: "before:2026-01-01" },
    { prefix: "after:YYYY-MM-DD", desc: "Filter created after date", example: "after:2025-12-31" },
    { prefix: "has:files>N", desc: "Filter multi-file snippets", example: "has:files>1" },
    { prefix: "sort:newest", desc: "Sort results inline", example: "sort:alpha" },
    { prefix: "title:keyword", desc: "Search only in title", example: "title:matrix" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar
        tags={sidebarTags}
        languages={sidebarLanguages}
        isAuthenticated={isAuthenticated}
        isAdmin={isAdmin}
      />

      <div className="flex-1 overflow-y-auto px-6 py-8 md:p-10 relative">
        {/* Table of Contents / Jump Navigation */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/40 -mx-6 px-6 -mt-8 md:-mt-10 py-3 mb-6 shadow-sm overflow-x-auto scrollbar-none shrink-0">
          <div className="flex gap-2 max-w-6xl mx-auto">
            <button
              onClick={() => document.getElementById("mockup-section")?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-muted hover:bg-primary/10 hover:text-primary border border-border/80 hover:border-primary/20 transition-all shrink-0 select-none"
            >
              <BookOpen size={10} />
              {t.helpTocMockup}
            </button>
            <button
              onClick={() => document.getElementById("shortcuts-section")?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-muted hover:bg-primary/10 hover:text-primary border border-border/80 hover:border-primary/20 transition-all shrink-0 select-none"
            >
              <Keyboard size={10} />
              {t.helpTocShortcuts}
            </button>
            <button
              onClick={() => document.getElementById("commands-section")?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-muted hover:bg-primary/10 hover:text-primary border border-border/80 hover:border-primary/20 transition-all shrink-0 select-none"
            >
              <Terminal size={10} />
              {t.helpTocCommands}
            </button>
            <button
              onClick={() => document.getElementById("visibility-section")?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-muted hover:bg-primary/10 hover:text-primary border border-border/80 hover:border-primary/20 transition-all shrink-0 select-none"
            >
              <Lock size={10} />
              {t.helpTocVisibility}
            </button>
            <button
              onClick={() => document.getElementById("import-section")?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-muted hover:bg-primary/10 hover:text-primary border border-border/80 hover:border-primary/20 transition-all shrink-0 select-none"
            >
              <Download size={10} />
              {t.helpTocImport}
            </button>
            <button
              onClick={() => document.getElementById("faq-section")?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-muted hover:bg-primary/10 hover:text-primary border border-border/80 hover:border-primary/20 transition-all shrink-0 select-none"
            >
              <HelpCircle size={10} />
              {t.helpTocFaq}
            </button>
          </div>
        </div>

        {/* Decorative subtle top gradient background */}
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-6xl mx-auto space-y-10 relative z-10">
          {/* Header section with glassmorphism border card */}
          <div className="p-6 md:p-8 rounded-2xl bg-card/40 backdrop-blur-md border border-border/60 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <Sparkles size={12} className="animate-pulse" />
                {t.helpTutorial}
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
                {t.helpTitle}
              </h1>
              <p className="text-muted-foreground text-sm max-w-2xl">
                {t.helpSubtitle}
              </p>
            </div>
            <div className="bg-muted/40 p-3 rounded-xl border border-border/50 max-w-xs shrink-0">
              <div className="flex gap-2 items-start text-xs text-muted-foreground">
                <Info size={14} className="text-primary shrink-0 mt-0.5" />
                <span>
                  <strong>Tip:</strong> Press <KbdKey>?</KbdKey> anywhere on the dashboard to toggle the quick shortcut overlay!
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Interactive Mockup (Left 3 columns) */}
            <div id="mockup-section" className="lg:col-span-3 space-y-6 scroll-animate opacity-0 translate-y-8 transition-all duration-700 ease-out">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <BookOpen size={20} className="text-primary" />
                    {t.helpInteractiveMock}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.helpInteractiveMockDesc}
                  </p>
                </div>

                {/* View switcher toolbar */}
                <div className="inline-flex items-center bg-muted/60 p-1 rounded-lg border border-border/60 self-start shrink-0">
                  <button
                    onClick={() => setViewMode("preview")}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                      viewMode === "preview"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    title={t.helpMockPreviewDensity}
                  >
                    <Eye size={13} />
                    <span className="hidden sm:inline">{t.helpMockPreviewDensity}</span>
                  </button>
                  <button
                    onClick={() => setViewMode("compact")}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                      viewMode === "compact"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    title={t.helpMockCompactDensity}
                  >
                    <LayoutGrid size={13} />
                    <span className="hidden sm:inline">{t.helpMockCompactDensity}</span>
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                      viewMode === "table"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    title={t.helpMockTableRowView}
                  >
                    <Table size={13} />
                    <span className="hidden sm:inline">{t.helpMockTableRowView}</span>
                  </button>
                </div>
              </div>

              {/* The Mockup Card itself */}
              <div className="transition-all duration-300">
                {viewMode === "table" ? (
                  /* Table view mockup */
                  <div className="rounded-xl border border-border bg-card/60 overflow-hidden shadow-lg p-3">
                    <div className="text-[11px] font-semibold text-muted-foreground grid grid-cols-12 gap-2 px-3 pb-2 border-b border-border/40">
                      <div className="col-span-5">{t.headerTitle || "Title"}</div>
                      <div className="col-span-2">{t.headerLanguage || "Language"}</div>
                      <div className="col-span-2">{t.headerVisibility || "Visibility"}</div>
                      <div className="col-span-3 text-right">Actions</div>
                    </div>
                    <div className="grid grid-cols-12 gap-2 px-3 py-3 items-center hover:bg-muted/30 transition-colors rounded-lg mt-1 text-sm">
                      <div className="col-span-5 font-semibold text-foreground flex flex-col">
                        <span className="truncate">{t.helpMockTitle}</span>
                        <span className="text-[10px] text-muted-foreground">from: dev_koala</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded border border-border/60">
                          javascript
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                          PUBLIC
                        </span>
                      </div>
                      <div className="col-span-3 flex justify-end gap-1.5">
                        <button
                          onClick={handleFavoriteToggle}
                          className={cn(
                            "p-1.5 rounded-md hover:bg-muted/80 transition-colors",
                            isFavorite ? "text-yellow-500" : "text-muted-foreground"
                          )}
                          title="Favorite"
                        >
                          <Star size={14} fill={isFavorite ? "currentColor" : "none"} />
                        </button>
                        <button
                          onClick={handlePinToggle}
                          className={cn(
                            "p-1.5 rounded-md hover:bg-muted/80 transition-colors",
                            isPinned ? "text-blue-500" : "text-muted-foreground"
                          )}
                          title="Pin"
                        >
                          <Pin size={14} fill={isPinned ? "currentColor" : "none"} className={cn(isPinned && "rotate-45")} />
                        </button>
                        <button
                          onClick={handleCopy}
                          className="p-1.5 rounded-md hover:bg-muted/80 text-muted-foreground transition-colors"
                          title="Copy Code"
                        >
                          {copied ? (
                            <Check size={14} className="text-emerald-500" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Card views mockup (preview or compact) */
                  <div
                    className={cn(
                      "rounded-2xl border bg-card/60 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col group",
                      isPinned ? "border-blue-500/40 bg-gradient-to-br from-card/60 via-card/60 to-blue-950/5" : "border-border/80"
                    )}
                  >
                    {/* Card Header */}
                    <div className="p-5 border-b border-border/40 space-y-3 relative">
                      {isPinned && (
                        <div className="absolute top-0 right-16 transform -translate-y-1/2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                          <Pin size={10} fill="currentColor" className="rotate-45" />
                          PINNED
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                            {t.helpMockTitle}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <User size={12} />
                            <span>from: dev_koala</span>
                          </div>
                        </div>

                        {/* Top action icons */}
                        <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border/40 shrink-0">
                          <button
                            onClick={handleFavoriteToggle}
                            className={cn(
                              "p-2 rounded-md hover:bg-card hover:text-yellow-500 transition-all duration-200",
                              isFavorite ? "text-yellow-500" : "text-muted-foreground"
                            )}
                            aria-label="Favorite"
                          >
                            <Star
                              size={15}
                              fill={isFavorite ? "currentColor" : "none"}
                              className={cn(isFavorite && "scale-110 animate-in zoom-in-50")}
                            />
                          </button>
                          <button
                            onClick={handlePinToggle}
                            className={cn(
                              "p-2 rounded-md hover:bg-card hover:text-blue-500 transition-all duration-200",
                              isPinned ? "text-blue-500" : "text-muted-foreground"
                            )}
                            aria-label="Pin"
                          >
                            <Pin
                              size={15}
                              fill={isPinned ? "currentColor" : "none"}
                              className={cn(
                                "transition-transform",
                                isPinned ? "scale-110 rotate-45 text-blue-500" : "rotate-0 text-muted-foreground"
                              )}
                            />
                          </button>
                          <button
                            onClick={handleCopy}
                            className="p-2 rounded-md hover:bg-card hover:text-foreground text-muted-foreground transition-all duration-200"
                            aria-label="Copy code"
                          >
                            {copied ? (
                              <Check size={15} className="text-emerald-500 scale-110" />
                            ) : (
                              <Copy size={15} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Snippet Description */}
                      <p className={cn(
                        "text-sm text-muted-foreground leading-relaxed",
                        viewMode === "compact" ? "line-clamp-1" : "line-clamp-2"
                      )}>
                        {t.helpMockDesc}
                      </p>

                      {/* Badges & Meta */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                        <button
                          onClick={handleLangClick}
                          className="inline-flex items-center gap-1 bg-muted/80 text-muted-foreground px-2 py-0.5 rounded-md border border-border/80 hover:text-foreground hover:bg-muted/100 transition-colors font-mono"
                        >
                          <Code size={10} />
                          javascript
                        </button>
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                          PUBLIC
                        </span>

                        <div className="w-px h-3.5 bg-border/60 mx-1" />

                        <div className="flex items-center gap-1.5">
                          {["canvas", "visual"].map((tag) => (
                            <button
                              key={tag}
                              onClick={() => handleTagClick(tag)}
                              className="inline-flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors bg-accent/20 px-2 py-0.5 rounded-full border border-border/20"
                            >
                              # {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Code block (only for Preview view mode) */}
                    {viewMode === "preview" && (
                      <div className="p-4 bg-muted/30 border-t border-border/40 relative">
                        {/* Fake code block header line numbers */}
                        <div className="flex gap-4 font-mono text-xs text-muted-foreground select-none">
                          <div className="w-6 text-right opacity-40 space-y-1">
                            <div>1</div>
                            <div>2</div>
                            <div>3</div>
                            <div>4</div>
                            <div>5</div>
                            <div>6</div>
                            <div>7</div>
                            <div>8</div>
                            <div>9</div>
                            <div>10</div>
                          </div>
                          <div className="flex-1 overflow-x-auto text-emerald-400/90 whitespace-pre">
                            {mockupCode}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Informative Help Guide Text */}
              <div className="bg-card/30 rounded-2xl border border-border/50 p-6 space-y-4 shadow-md">
                <h3 className="font-semibold text-sm flex items-center gap-1.5">
                  <Info size={16} className="text-primary" />
                  Guide to Density Settings
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1">
                    <h4 className="font-semibold text-foreground">1. Preview Density</h4>
                    <p className="text-muted-foreground">
                      Displays a snippet card with a 5-line syntax-highlighted code preview. Perfect for browsing code contents.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-foreground">2. Compact Density</h4>
                    <p className="text-muted-foreground">
                      Collapses the code preview entirely. Excellent for scanning a large number of snippet titles and descriptions.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-foreground">3. Table Row View</h4>
                    <p className="text-muted-foreground">
                      Renders snippets as elegant horizontal rows in a structured database sheet format. Best for power bulk management.
                    </p>
                  </div>
                </div>
              </div>

              {/* Visibility Guide Section (Relocated Vertically to Left Column) */}
              <div
                id="visibility-section"
                className="scroll-animate opacity-0 translate-y-8 transition-all duration-700 ease-out bg-card/25 backdrop-blur-md rounded-2xl border border-border/60 p-6 space-y-6 shadow-xl"
              >
                <div className="space-y-1">
                  <h2 className="text-xl font-extrabold flex items-center gap-2">
                    <Lock size={20} className="text-primary" />
                    {t.visibility || "Visibility"} Guide
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Understand who can see, share, and fork your code snippets.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
                  {/* Private card */}
                  <div className="bg-card/40 border border-border/50 rounded-xl p-5 hover:border-primary/20 transition-colors flex flex-col gap-4 shadow-sm relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 text-red-500/10 group-hover:text-red-500/20 transition-colors">
                      <Lock size={64} />
                    </div>
                    <div className="flex items-center gap-2 text-red-500 font-bold text-sm">
                      <span className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                        🔒
                      </span>
                      {t.visibilityPrivate}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                      {t.helpVisibilityPrivateDesc}
                    </p>
                  </div>

                  {/* Shared card */}
                  <div className="bg-card/40 border border-border/50 rounded-xl p-5 hover:border-primary/20 transition-colors flex flex-col gap-4 shadow-sm relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 text-blue-500/10 group-hover:text-blue-500/20 transition-colors">
                      <Link2 size={64} />
                    </div>
                    <div className="flex items-center gap-2 text-blue-500 font-bold text-sm">
                      <span className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                        🔗
                      </span>
                      {t.visibilityShared}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                      {t.helpVisibilitySharedDesc}
                    </p>
                  </div>

                  {/* Public card */}
                  <div className="bg-card/40 border border-border/50 rounded-xl p-5 hover:border-primary/20 transition-colors flex flex-col gap-4 shadow-sm relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 text-emerald-500/10 group-hover:text-emerald-500/20 transition-colors">
                      <Globe size={64} />
                    </div>
                    <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
                      <span className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                        🌐
                      </span>
                      {t.visibilityPublic}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                      {t.helpVisibilityPublicDesc}
                    </p>
                  </div>
                </div>
              </div>

              {/* Import Guide Section (Relocated to Left Column) */}
              <div
                id="import-section"
                className="scroll-animate opacity-0 translate-y-8 transition-all duration-700 ease-out bg-card/25 backdrop-blur-md rounded-2xl border border-border/60 p-6 space-y-6 shadow-xl"
              >
                <div className="space-y-1">
                  <h2 className="text-xl font-extrabold flex items-center gap-2">
                    <Download size={20} className="text-primary" />
                    {t.helpImportSectionTitle}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {t.helpImportSectionDesc}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Written Guide */}
                  <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                    <div className="space-y-2">
                      <h3 className="font-bold text-foreground text-sm">{t.helpImportDragDrop}</h3>
                      <p>{t.helpImportDragDropDesc}</p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-bold text-foreground text-sm">2. Fetch & Import from URL</h3>
                      <p>{t.helpImportFromUrlDesc}</p>
                    </div>
                  </div>

                  {/* Interactive URL Import Box Mockup */}
                  <div className="bg-card/50 border border-border/50 rounded-xl p-5 space-y-4 shadow-sm">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                      <Sparkles size={14} />
                      {t.helpImportMockLabel}
                    </div>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={importUrl}
                          onChange={(e) => setImportUrl(e.target.value)}
                          placeholder={t.helpImportMockPlaceholder}
                          className="flex-1 h-8 px-2.5 text-xs bg-muted/50 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary font-mono text-foreground"
                        />
                        <button
                          onClick={handleSimulatedImport}
                          disabled={isImporting}
                          className="h-8 px-4 bg-primary text-primary-foreground font-semibold text-xs rounded hover:bg-primary/95 transition-colors flex items-center justify-center shrink-0 select-none"
                        >
                          {isImporting ? t.helpImportMockButtonFetching : t.helpImportMockButton}
                        </button>
                      </div>
                      {/* Presets */}
                      <div className="flex flex-wrap gap-1.5 pt-1 items-center">
                        <span className="text-[10px] text-muted-foreground">Try presets:</span>
                        <button
                          onClick={() => setImportUrl("raw.githubusercontent.com/matrix-rain.js")}
                          className="text-[9px] font-mono bg-muted/80 text-muted-foreground hover:text-foreground px-2 py-0.5 rounded border border-border/80 hover:bg-muted select-none"
                        >
                          matrix-rain.js
                        </button>
                        <button
                          onClick={() => setImportUrl("raw.githubusercontent.com/matrix-rain.css")}
                          className="text-[9px] font-mono bg-muted/80 text-muted-foreground hover:text-foreground px-2 py-0.5 rounded border border-border/80 hover:bg-muted select-none"
                        >
                          matrix-rain.css
                        </button>
                      </div>
                    </div>

                    {/* Import Result simulated preview */}
                    {isImporting && (
                      <div className="h-28 flex items-center justify-center border border-border/50 rounded bg-muted/10">
                        <div className="w-5 h-5 border border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    {importResult && (
                      <div className="border border-emerald-500/30 rounded bg-emerald-500/5 p-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-between text-xs font-semibold text-emerald-600">
                          <span className="truncate flex items-center gap-1.5">
                            📦 Simulated Import: {importResult.title}
                          </span>
                          <span className="text-[10px] font-mono bg-emerald-500/10 px-2 py-0.5 rounded">
                            {importResult.language}
                          </span>
                        </div>
                        <pre className="text-[10px] font-mono text-emerald-400 bg-black/40 p-2 rounded max-h-24 overflow-y-auto leading-relaxed border border-emerald-500/10">
                          {importResult.code}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Shortcuts & Search Commands (Right 2 columns) */}
            <div className="lg:col-span-2 space-y-8">
              {/* Keyboard Shortcuts Section */}
              <div id="shortcuts-section" className="space-y-4 scroll-animate opacity-0 translate-y-8 transition-all duration-700 ease-out">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Keyboard size={20} className="text-primary" />
                    {t.helpShortcuts}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.helpShortcutsDesc}
                  </p>
                </div>

                <div className="rounded-2xl border border-border/80 bg-card/45 p-4 shadow-lg space-y-5">
                  {shortcutGroups.map((group) => (
                    <div key={group.title} className="space-y-2">
                      <h3 className="text-xs font-bold text-primary tracking-wide uppercase px-1">
                        {group.title}
                      </h3>
                      <div className="space-y-1.5">
                        {group.shortcuts.map((shortcut) => (
                          <div
                            key={shortcut.desc}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 transition-colors text-xs"
                          >
                            <span className="text-muted-foreground font-medium">{shortcut.desc}</span>
                            <div className="flex gap-1">
                              {shortcut.keys.map((k, idx) => (
                                <div key={k} className="flex items-center gap-1">
                                  {idx > 0 && <span className="text-[10px] text-muted-foreground/50">or</span>}
                                  <KbdKey>{k}</KbdKey>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Power Search Commands Section */}
              <div id="commands-section" className="space-y-4 scroll-animate opacity-0 translate-y-8 transition-all duration-700 ease-out">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Terminal size={20} className="text-primary" />
                    {t.helpSearchCommands}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.helpSearchCommandsDesc}
                  </p>
                </div>

                <div className="rounded-2xl border border-border/80 bg-card/45 p-4 shadow-lg overflow-hidden">
                  <div className="text-[10px] font-bold text-muted-foreground grid grid-cols-12 gap-2 pb-2 px-1 border-b border-border/40">
                    <div className="col-span-5 uppercase tracking-wide">
                      {t.helpSearchCommandHeaderPrefix || "Prefix"}
                    </div>
                    <div className="col-span-7 uppercase tracking-wide">
                      {t.helpSearchCommandHeaderDesc || "Description"}
                    </div>
                  </div>

                  <div className="divide-y divide-border/30 text-xs">
                    {searchCommands.map((cmd) => (
                      <div key={cmd.prefix} className="py-2.5 px-1 grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-5 font-mono text-[11px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10 w-fit">
                          {cmd.prefix.split(":")[0]}:
                        </div>
                        <div className="col-span-7 text-muted-foreground space-y-1">
                          <p className="font-medium text-foreground">{cmd.prefix}</p>
                          <p className="text-[10px] leading-tight text-muted-foreground/80">
                            e.g. <span className="font-mono text-muted-foreground select-all bg-muted px-1 py-0.5 rounded">{cmd.example}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Cyclic placeholder info banner */}
                  <div className="mt-4 p-3 bg-muted/60 border border-border/60 rounded-xl flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed">
                    <div className="shrink-0 text-primary mt-0.5">
                      <Search size={14} />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-[11px]">Cycling Search Placeholder Tips</p>
                      <p className="text-[10px] mt-0.5">
                        Our search bar cycles dynamically: 60s of standard search text, then 30s of rotating tips explaining commands (like <span className="font-mono text-primary bg-primary/5 px-1 rounded">try from:!username</span>). Just type <span className="font-mono text-primary bg-primary/5 px-1 rounded">/help</span> directly into search to redirect right back here!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Accordion Section */}
          <div
            id="faq-section"
            className="scroll-animate opacity-0 translate-y-8 transition-all duration-700 ease-out bg-card/25 backdrop-blur-md rounded-2xl border border-border/60 p-6 space-y-6 shadow-xl"
          >
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold flex items-center gap-2">
                <HelpCircle size={20} className="text-primary" />
                {t.helpFaqTitle}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t.helpFaqSubtitle}
              </p>
            </div>

            <div className="space-y-3">
              {[
                { q: t.helpFaqQ1, a: t.helpFaqA1 },
                { q: t.helpFaqQ2, a: t.helpFaqA2 },
                { q: t.helpFaqQ3, a: t.helpFaqA3 },
                { q: t.helpFaqQ4, a: t.helpFaqA4 },
              ].map((faq, idx) => {
                const isOpen = faqOpenIndex === idx;
                return (
                  <div
                    key={idx}
                    className="border border-border/60 rounded-xl overflow-hidden bg-card/30 hover:border-primary/25 transition-all shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(idx)}
                      className="w-full flex items-center justify-between p-4 text-left font-bold text-xs hover:text-primary transition-colors text-foreground select-none"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        size={14}
                        className={cn("text-muted-foreground transition-transform duration-300", isOpen && "rotate-180 text-primary")}
                      />
                    </button>

                    {/* Smooth height collapse animation */}
                    <div
                      className={cn(
                        "grid transition-all duration-300 ease-in-out",
                        isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                      )}
                    >
                      <div className="overflow-hidden">
                        <div className="p-4 pt-0 text-xs text-muted-foreground leading-relaxed border-t border-border/30 bg-muted/10">
                          {faq.a}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
