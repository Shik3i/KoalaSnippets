"use client";

import { useState, useEffect, useCallback, useRef, useMemo, useSyncExternalStore } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Code, Filter, X, ChevronDown, Check, Download, UserCheck, UserX, User, HelpCircle } from "lucide-react";
import Image from "next/image";
import KoalaSuche from "../../../../public/KoalaSuche.png";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/features/core/utils/utils";
import { SortSelect } from "./sort-select";
import { ViewToggle } from "./view-toggle";
import { useI18n } from "@/features/core/i18n";

interface SnippetSearchHeaderProps {
  placeholder?: string;
  availableTags?: string[];
  availableLanguages?: string[];
  availableAuthors?: string[];
  isAuthenticated?: boolean;
  sort?: "newest" | "oldest" | "alphabetical" | "size-asc" | "size-desc";
  viewMode?: "grid" | "table";
  resultCount?: number;
  onImportClick?: () => void;
}

function FilterDropdown({
  label,
  placeholder,
  noMatchesLabel,
  options,
  selected,
  onToggle,
}: {
  label: string;
  placeholder: string;
  noMatchesLabel: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  const filtered = options.filter(o =>
    o.toLowerCase().includes(search.toLowerCase())
  );

  const safeIndex = Math.min(activeIndex, Math.max(0, filtered.length - 1));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      setSearch("");
      return;
    }
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[safeIndex]) {
        onToggle(filtered[safeIndex]);
      }
    }
  };

  useEffect(() => {
    if (open && listRef.current) {
      const el = listRef.current.children[safeIndex] as HTMLElement | undefined;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [safeIndex, open]);

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => { setOpen(!open); setActiveIndex(0); }}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs transition-colors bg-muted/30 backdrop-blur-sm",
          selected.length > 0
            ? "border-primary/30 bg-primary/5 text-foreground"
            : "border-border bg-muted/30 text-muted-foreground hover:border-muted-foreground/30"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="font-medium">{label}</span>
        {selected.length > 0 && (
          <span className="bg-primary text-[9px] text-primary-foreground rounded-full px-1.5 py-px">{selected.length}</span>
        )}
        <ChevronDown size={12} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 w-56 bg-card border border-border rounded-lg shadow-xl z-50 p-1.5 space-y-1.5">
          <input
            type="text"
            id={`filter-${label.toLowerCase()}`}
            name={`filter-${label.toLowerCase()}`}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setActiveIndex(0); }}
            placeholder={placeholder}
            className="w-full h-7 px-2 text-[11px] bg-muted/50 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
            autoFocus
          />
          <div ref={listRef} className="max-h-40 overflow-y-auto space-y-0.5" role="listbox">
            {filtered.length === 0 ? (
              <div className="text-[11px] text-muted-foreground px-2 py-2 text-center">{noMatchesLabel}</div>
            ) : (
              filtered.map((option, i) => {
                const isSelected = selected.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => onToggle(option)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded text-[11px] text-left transition-colors",
                      i === safeIndex && "bg-muted",
                      isSelected
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted/50 text-foreground"
                    )}
                  >
                    <span className={cn(
                      "w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0",
                      isSelected ? "bg-primary border-primary" : "border-border"
                    )}>
                      {isSelected && <Check size={10} className="text-primary-foreground" />}
                    </span>
                    <span className={cn("truncate", label === "Languages" && "font-mono")}>{option}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function VisibilityDropdown({
  selected,
  onSelect,
  isAuthenticated,
}: {
  selected: string | null;
  onSelect: (value: string | null) => void;
  isAuthenticated: boolean;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  const options = useMemo(() => {
    const list = [
      { value: null, label: t.clearAll || "All" },
      { value: "PUBLIC", label: t.visibilityPublic },
    ];
    if (isAuthenticated) {
      list.push(
        { value: "PRIVATE", label: t.visibilityPrivate },
        { value: "SHARED", label: t.visibilityShared }
      );
    }
    return list;
  }, [isAuthenticated, t]);

  const selectedOption = options.find((o) => o.value === selected) || options[0];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs transition-colors bg-muted/30 backdrop-blur-sm h-8",
          selected
            ? "border-primary/30 bg-primary/5 text-foreground font-medium"
            : "border-border bg-muted/30 text-muted-foreground hover:border-muted-foreground/30"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="font-medium text-muted-foreground">{t.visibility || "Visibility"}:</span>
        <span>{selectedOption.label}</span>
        <ChevronDown size={12} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 w-40 bg-card border border-border rounded-lg shadow-xl z-50 p-1 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
          {options.map((option) => {
            const isSelected = selected === option.value;
            return (
              <button
                key={option.value ?? "all"}
                type="button"
                onClick={() => {
                  onSelect(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11px] text-left transition-colors",
                  isSelected ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50 text-foreground"
                )}
              >
                <span>{option.label}</span>
                {isSelected && <Check size={10} className="text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AuthorDropdown({
  options,
  selected,
  mode,
  onSelect,
  onToggleMode,
}: {
  options: string[];
  selected: string | null;
  mode: "include" | "exclude";
  onSelect: (value: string | null) => void;
  onToggleMode: (mode: "include" | "exclude") => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  const filtered = options.filter(o =>
    o.toLowerCase().includes(search.toLowerCase())
  );

  const safeIndex = Math.min(activeIndex, Math.max(0, filtered.length - 1));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      setSearch("");
      return;
    }
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[safeIndex]) {
        onSelect(filtered[safeIndex]);
        setOpen(false);
        setSearch("");
      }
    }
  };

  useEffect(() => {
    if (open && listRef.current) {
      const el = listRef.current.children[safeIndex] as HTMLElement | undefined;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [safeIndex, open]);

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      <div className="flex items-center">
        {/* Main dropdown button */}
        <button
          type="button"
          onClick={() => { setOpen(!open); setActiveIndex(0); }}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-l-md border border-r-0 text-xs transition-colors bg-muted/30 backdrop-blur-sm h-8",
            selected
              ? "border-primary/30 bg-primary/5 text-foreground font-medium"
              : "border-border bg-muted/30 text-muted-foreground hover:border-muted-foreground/30"
          )}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="font-medium text-muted-foreground">{t.creator || "Creator"}:</span>
          <span>{selected ? selected : (t.clearAll || "All")}</span>
        </button>

        {/* Include/Exclude mode toggle next to the button */}
        <button
          type="button"
          onClick={() => {
            const nextMode = mode === "include" ? "exclude" : "include";
            onToggleMode(nextMode);
          }}
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-r-md border text-xs transition-all bg-muted/30 backdrop-blur-sm shrink-0 border-l-0",
            selected
              ? mode === "exclude"
                ? "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
                : "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
              : "border-border text-muted-foreground hover:bg-muted/50 cursor-not-allowed"
          )}
          title={mode === "exclude" ? t.creatorModeExclude || "Exclude" : t.creatorModeInclude || "Include"}
          disabled={!selected}
        >
          {mode === "exclude" ? <UserX size={14} /> : <UserCheck size={14} />}
        </button>
      </div>

      {open && (
        <div className="absolute top-full mt-1 left-0 w-56 bg-card border border-border rounded-lg shadow-xl z-50 p-1.5 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-1.5 border-b border-border/50 pb-1.5">
            <input
              type="text"
              id="filter-creator"
              name="filter-creator"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setActiveIndex(0); }}
              placeholder={t.searchLabel.replace("{label}", t.creator || "Creator")}
              className="flex-1 h-7 px-2 text-[11px] bg-muted/50 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
            {selected && (
              <button
                type="button"
                onClick={() => {
                  onSelect(null);
                  setOpen(false);
                  setSearch("");
                }}
                className="text-[10px] text-muted-foreground hover:text-foreground font-medium shrink-0"
              >
                {t.clearAll || "Clear"}
              </button>
            )}
          </div>

          {/* Toggle inside the dropdown too for max usability */}
          {selected && (
            <div className="flex items-center justify-between border-b border-border pb-1 px-1">
              <span className="text-[9px] text-muted-foreground font-semibold uppercase">Mode:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onToggleMode("include")}
                  className={cn(
                    "flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium transition-colors",
                    mode === "include" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <UserCheck size={10} />
                  {t.creatorModeInclude}
                </button>
                <button
                  type="button"
                  onClick={() => onToggleMode("exclude")}
                  className={cn(
                    "flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium transition-colors",
                    mode === "exclude" ? "bg-destructive text-destructive-foreground font-semibold" : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <UserX size={10} />
                  {t.creatorModeExclude}
                </button>
              </div>
            </div>
          )}

          <div ref={listRef} className="max-h-40 overflow-y-auto space-y-0.5" role="listbox">
            {filtered.length === 0 ? (
              <div className="text-[11px] text-muted-foreground px-2 py-2 text-center">{t.noMatches}</div>
            ) : (
              filtered.map((option, i) => {
                const isSelected = selected === option;
                return (
                  <button
                    key={option}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onSelect(option);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-2 py-1.5 rounded-md text-[11px] text-left transition-colors",
                      i === safeIndex && "bg-muted",
                      isSelected
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted/50 text-foreground"
                    )}
                  >
                    <span className="truncate flex items-center gap-1.5">
                      <User size={10} className="text-muted-foreground" />
                      {option}
                    </span>
                    {isSelected && <Check size={10} className="text-primary" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function parseSearchCommands(text: string) {
  let cleanText = text;
  const parsedTags: string[] = [];
  const parsedLangs: string[] = [];
  let parsedVisibility: string | null = null;
  let parsedAuthor: string | null = null;
  let parsedAuthorMode: "include" | "exclude" | null = null;
  let parsedPinned: string | null = null;
  let parsedFavorited: string | null = null;
  let parsedMinLines: string | null = null;
  let parsedMaxLines: string | null = null;
  let parsedBefore: string | null = null;
  let parsedAfter: string | null = null;
  let parsedMinFiles: string | null = null;
  let parsedSort: string | null = null;
  let parsedTitle: string | null = null;

  // Regexes
  const tagRegex = /\btag:(!?)([a-zA-Z0-9#+-]+)\b/gi;
  const langRegex = /\blang:(!?)([a-zA-Z0-9+-]+)\b/gi;
  const isRegex = /\bis:(!?)(public|private|shared|pinned|favorited)\b/gi;
  const fromRegex = /\bfrom:(!?)([a-zA-Z0-9_.-]+)\b/gi;
  const linesRegex = /\blines:([<>])(\d+)\b/gi;
  const beforeRegex = /\bbefore:(\d{4}-\d{2}-\d{2})\b/gi;
  const afterRegex = /\bafter:(\d{4}-\d{2}-\d{2})\b/gi;
  const hasFilesRegex = /\bhas:files>(\d+)\b/gi;
  const sortRegex = /\bsort:(newest|oldest|alphabetical|alpha|size-asc|size-desc|size)\b/gi;
  const titleRegex = /\btitle:([a-zA-Z0-9#+-]+)\b/gi;

  let match;
  
  // Parse tags
  while ((match = tagRegex.exec(cleanText)) !== null) {
    const isExclude = match[1] === "!";
    parsedTags.push((isExclude ? "!" : "") + match[2].toLowerCase());
  }
  cleanText = cleanText.replace(tagRegex, "");

  // Parse languages
  while ((match = langRegex.exec(cleanText)) !== null) {
    const isExclude = match[1] === "!";
    parsedLangs.push((isExclude ? "!" : "") + match[2].toLowerCase());
  }
  cleanText = cleanText.replace(langRegex, "");

  // Parse visibility/pinned/favorited
  while ((match = isRegex.exec(cleanText)) !== null) {
    const isNegated = match[1] === "!";
    const term = match[2].toLowerCase();
    if (term === "pinned") {
      parsedPinned = isNegated ? "false" : "true";
    } else if (term === "favorited") {
      parsedFavorited = isNegated ? "false" : "true";
    } else {
      parsedVisibility = term.toUpperCase();
    }
  }
  cleanText = cleanText.replace(isRegex, "");

  // Parse author
  while ((match = fromRegex.exec(cleanText)) !== null) {
    const isExclude = match[1] === "!";
    parsedAuthor = match[2];
    parsedAuthorMode = isExclude ? "exclude" : "include";
  }
  cleanText = cleanText.replace(fromRegex, "");

  // Parse lines:>N or lines:<N
  while ((match = linesRegex.exec(cleanText)) !== null) {
    const op = match[1];
    const val = match[2];
    if (op === ">") {
      parsedMinLines = val;
    } else if (op === "<") {
      parsedMaxLines = val;
    }
  }
  cleanText = cleanText.replace(linesRegex, "");

  // Parse before:YYYY-MM-DD
  while ((match = beforeRegex.exec(cleanText)) !== null) {
    parsedBefore = match[1];
  }
  cleanText = cleanText.replace(beforeRegex, "");

  // Parse after:YYYY-MM-DD
  while ((match = afterRegex.exec(cleanText)) !== null) {
    parsedAfter = match[1];
  }
  cleanText = cleanText.replace(afterRegex, "");

  // Parse has:files>N
  while ((match = hasFilesRegex.exec(cleanText)) !== null) {
    parsedMinFiles = match[1];
  }
  cleanText = cleanText.replace(hasFilesRegex, "");

  // Parse sort:VALUE
  while ((match = sortRegex.exec(cleanText)) !== null) {
    const s = match[1].toLowerCase();
    if (s === "alpha") {
      parsedSort = "alphabetical";
    } else if (s === "size") {
      parsedSort = "size-desc";
    } else {
      parsedSort = s;
    }
  }
  cleanText = cleanText.replace(sortRegex, "");

  // Parse title:keyword
  while ((match = titleRegex.exec(cleanText)) !== null) {
    parsedTitle = match[1];
  }
  cleanText = cleanText.replace(titleRegex, "");

  const hasUpdates =
    parsedTags.length > 0 ||
    parsedLangs.length > 0 ||
    parsedVisibility !== null ||
    parsedAuthor !== null ||
    parsedPinned !== null ||
    parsedFavorited !== null ||
    parsedMinLines !== null ||
    parsedMaxLines !== null ||
    parsedBefore !== null ||
    parsedAfter !== null ||
    parsedMinFiles !== null ||
    parsedSort !== null ||
    parsedTitle !== null;

  return {
    cleanText: cleanText.trim().replace(/\s+/g, " "),
    parsedTags,
    parsedLangs,
    parsedVisibility,
    parsedAuthor,
    parsedAuthorMode,
    parsedPinned,
    parsedFavorited,
    parsedMinLines,
    parsedMaxLines,
    parsedBefore,
    parsedAfter,
    parsedMinFiles,
    parsedSort,
    parsedTitle,
    hasUpdates
  };
}

export function SnippetSearchHeader({ 
  placeholder,
  availableTags = [],
  availableLanguages = [],
  availableAuthors = [],
  isAuthenticated = false,
  sort = "newest",
  viewMode = "grid",
  resultCount,
  onImportClick,
}: SnippetSearchHeaderProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isMac = useSyncExternalStore(
    () => () => {},
    () => /Mac|iPod|iPhone|iPad/.test(navigator.platform),
    () => false
  );
  const router = useRouter();
  const { t, locale } = useI18n();
  const resolvedPlaceholder = placeholder ?? t.searchSnippets;
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [includeCode, setIncludeCode] = useState(searchParams.get("includeCode") === "true");
  const [filterMode, setFilterMode] = useState(searchParams.get("filterMode") ?? "and");
  const [searching, setSearching] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false);
  const cheatsheetRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (cheatsheetRef.current && !cheatsheetRef.current.contains(e.target as Node)) {
        setCheatsheetOpen(false);
      }
    }
    if (cheatsheetOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [cheatsheetOpen]);

  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isShowingTip, setIsShowingTip] = useState(false);

  const placeholderTips = useMemo(() => {
    return locale === "de" ? [
      "Tippe /help für Shortcuts und Anleitungen!",
      "Wusstest du, dass du mit tag:python filtern kannst?",
      "Filtere nach Ersteller mit from:username",
      "Schließe einen Ersteller aus mit from:!username",
      "Filtere nach Sichtbarkeit mit is:public oder is:private",
    ] : [
      "Try typing /help for shortcuts and guidance!",
      "Did you know you can filter with tag:python?",
      "Filter by creator using from:username",
      "Exclude a creator using from:!username",
      "Filter by visibility using is:public or is:private",
    ];
  }, [locale]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const cycle = () => {
      if (isShowingTip) {
        // We are currently showing a tip, show standard placeholder next after 30 seconds
        timer = setTimeout(() => {
          setIsShowingTip(false);
          setPlaceholderIndex((prev) => (prev + 1) % placeholderTips.length);
        }, 30000); // Tip displayed for 30s
      } else {
        // We are currently showing standard placeholder, show next tip next after 60 seconds
        timer = setTimeout(() => {
          setIsShowingTip(true);
        }, 60000); // Standard displayed for 60s
      }
    };

    cycle();

    return () => clearTimeout(timer);
  }, [isShowingTip, placeholderTips.length]);

  const activePlaceholder = isShowingTip ? placeholderTips[placeholderIndex] : resolvedPlaceholder;

  const searchParamsString = searchParams.toString();

  const activeTags = useMemo(
    () => searchParams.get("tags")?.split(",").filter(Boolean) || [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParamsString]
  );
  const activeLanguages = useMemo(
    () => searchParams.get("language")?.split(",").filter(Boolean) || [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParamsString]
  );
  const activeCollection = searchParams.get("collection");
  const activeVisibility = searchParams.get("visibility");
  const activeAuthor = searchParams.get("author");
  const activeAuthorMode = (searchParams.get("authorMode") === "exclude" ? "exclude" : "include") as "include" | "exclude";

  const activePinned = searchParams.get("pinned");
  const activeFavorited = searchParams.get("favorited");
  const activeMinLines = searchParams.get("minLines");
  const activeMaxLines = searchParams.get("maxLines");
  const activeBefore = searchParams.get("before");
  const activeAfter = searchParams.get("after");
  const activeMinFiles = searchParams.get("minFiles");
  const activeTitle = searchParams.get("title");

  const updateParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [pathname, router]);

  const toggleTag = useCallback((tag: string) => {
    const next = activeTags.includes(tag)
      ? activeTags.filter(t => t !== tag)
      : [...activeTags, tag];
    updateParams({ tags: next.length > 0 ? next.join(",") : null });
  }, [activeTags, updateParams]);

  const toggleLanguage = useCallback((lang: string) => {
    const next = activeLanguages.includes(lang)
      ? activeLanguages.filter(l => l !== lang)
      : [...activeLanguages, lang];
    updateParams({ language: next.length > 0 ? next.join(",") : null });
  }, [activeLanguages, updateParams]);

  const navigateSearch = useCallback((q: string, ic: boolean) => {
    setSearching(true);
    updateParams({
      q: q || null,
      includeCode: ic ? "true" : null,
    });
    setTimeout(() => setSearching(false), 300);
  }, [updateParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().toLowerCase() === "/help") {
        setQuery("");
        router.push("/help");
        return;
      }
      const parsed = parseSearchCommands(query);
      if (parsed.hasUpdates) {
        const updates: Record<string, string | null> = {
          q: parsed.cleanText || null,
        };

        if (parsed.parsedTags.length > 0) {
          const nextTags = [...new Set([...activeTags, ...parsed.parsedTags])];
          updates.tags = nextTags.join(",");
        }

        if (parsed.parsedLangs.length > 0) {
          const nextLangs = [...new Set([...activeLanguages, ...parsed.parsedLangs])];
          updates.language = nextLangs.join(",");
        }

        if (parsed.parsedVisibility) {
          updates.visibility = parsed.parsedVisibility;
        }

        if (parsed.parsedAuthor) {
          updates.author = parsed.parsedAuthor;
          updates.authorMode = parsed.parsedAuthorMode;
        }

        if (parsed.parsedPinned !== null) {
          updates.pinned = parsed.parsedPinned;
        }

        if (parsed.parsedFavorited !== null) {
          updates.favorited = parsed.parsedFavorited;
        }

        if (parsed.parsedMinLines !== null) {
          updates.minLines = parsed.parsedMinLines;
        }

        if (parsed.parsedMaxLines !== null) {
          updates.maxLines = parsed.parsedMaxLines;
        }

        if (parsed.parsedBefore !== null) {
          updates.before = parsed.parsedBefore;
        }

        if (parsed.parsedAfter !== null) {
          updates.after = parsed.parsedAfter;
        }

        if (parsed.parsedMinFiles !== null) {
          updates.minFiles = parsed.parsedMinFiles;
        }

        if (parsed.parsedSort !== null) {
          updates.sort = parsed.parsedSort;
        }

        if (parsed.parsedTitle !== null) {
          updates.title = parsed.parsedTitle;
        }

        setQuery(parsed.cleanText);
        updateParams(updates);
      } else {
        navigateSearch(query, includeCode);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, includeCode, navigateSearch, activeTags, activeLanguages, updateParams, router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const modifier = isMac ? e.metaKey : e.ctrlKey;
      if (modifier && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        setQuery("");
        navigateSearch("", includeCode);
      }
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [includeCode, navigateSearch]);

  const hasActiveFilters =
    activeTags.length > 0 ||
    activeLanguages.length > 0 ||
    activeCollection ||
    activeVisibility ||
    activeAuthor ||
    activePinned !== null ||
    activeFavorited !== null ||
    activeMinLines !== null ||
    activeMaxLines !== null ||
    activeBefore !== null ||
    activeAfter !== null ||
    activeMinFiles !== null ||
    activeTitle !== null;

  const activeFilterCount =
    activeTags.length +
    activeLanguages.length +
    (activeVisibility ? 1 : 0) +
    (activeAuthor ? 1 : 0) +
    (activePinned !== null ? 1 : 0) +
    (activeFavorited !== null ? 1 : 0) +
    (activeMinLines !== null ? 1 : 0) +
    (activeMaxLines !== null ? 1 : 0) +
    (activeBefore !== null ? 1 : 0) +
    (activeAfter !== null ? 1 : 0) +
    (activeMinFiles !== null ? 1 : 0) +
    (activeTitle !== null ? 1 : 0);

  return (
    <div className="sticky top-0 z-10 p-4 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <Image src={KoalaSuche} alt="Search" width={28} height={22} className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-50 z-10" />
          <Input
            ref={inputRef}
            id="snippet-search"
            name="q"
            placeholder={activePlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 h-9 pr-20 w-full border-0 shadow-none focus-visible:ring-0 bg-muted/40 backdrop-blur-sm"
            aria-label={t.searchSnippets}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searching ? (
              <div className="w-3.5 h-3.5 border border-muted-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setCheatsheetOpen(!cheatsheetOpen)}
                  className="flex items-center justify-center w-6 h-6 rounded text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                  aria-label={t.searchCheatSheet}
                  title={t.searchCheatSheetTitle}
                >
                  <HelpCircle size={13} suppressHydrationWarning />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
                  }}
                  className="flex items-center gap-0.5 text-[10px] font-mono text-muted-foreground hover:text-foreground hover:bg-muted/30 px-1.5 py-0.5 rounded border border-border bg-muted/20 transition-colors h-5 font-semibold shrink-0"
                  aria-label="Open Command Palette"
                >
                  {isMac ? "⌘K" : locale === "de" ? "Strg+K" : "Ctrl+K"}
                </button>
              </>
            )}
          </div>
        </div>

        {cheatsheetOpen && (
          <div className="absolute top-full left-4 right-4 mt-1 z-50 bg-card border border-border rounded-xl shadow-2xl p-4 animate-in fade-in slide-in-from-top-2 duration-150 max-w-[480px]" ref={cheatsheetRef}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">{t.searchCheatSheetTitle}</h3>
              <button
                type="button"
                onClick={() => setCheatsheetOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded"
                aria-label={t.close}
              >
                <X size={14} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-1.5 pr-3 text-muted-foreground font-medium uppercase tracking-wider text-[10px]">{t.searchCheatSheetPrefix}</th>
                    <th className="text-left py-1.5 pr-3 text-muted-foreground font-medium uppercase tracking-wider text-[10px]">{t.searchCheatSheetDesc}</th>
                    <th className="text-left py-1.5 text-muted-foreground font-medium uppercase tracking-wider text-[10px]">{t.searchCheatSheetExample}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { prefix: "pinned:true", desc: t.searchCheatSheetPinned, example: "pinned:true" },
                    { prefix: "pinned:false", desc: t.searchCheatSheetPinned, example: "pinned:false" },
                    { prefix: "favorited:true", desc: t.searchCheatSheetFavorited, example: "favorited:true" },
                    { prefix: "favorited:false", desc: t.searchCheatSheetFavorited, example: "favorited:false" },
                    { prefix: "tag:<tag>", desc: t.searchCheatSheetTag, example: "tag:python" },
                    { prefix: "lang:<lang>", desc: t.searchCheatSheetLanguage, example: "lang:typescript" },
                    { prefix: "from:<user>", desc: t.creator, example: "from:koala" },
                    { prefix: "from:!<user>", desc: t.creatorModeExclude, example: "from:!bots" },
                    { prefix: "is:public", desc: t.visibilityPublic, example: "is:public" },
                    { prefix: "is:private", desc: t.visibilityPrivate, example: "is:private" },
                    { prefix: "is:shared", desc: t.visibilityShared, example: "is:shared" },
                    { prefix: "lines:<n", desc: t.searchCheatSheetMinLines, example: "lines:\x3C 50" },
                    { prefix: "lines:>n", desc: t.searchCheatSheetMaxLines, example: "lines:\x3E 100" },
                    { prefix: "has:files>n", desc: t.searchCheatSheetMinFiles, example: "has:files>1" },
                    { prefix: "before:YYYY-MM-DD", desc: t.searchCheatSheetBefore, example: "before:2025-01-01" },
                    { prefix: "after:YYYY-MM-DD", desc: t.searchCheatSheetAfter, example: "after:2024-06-01" },
                    { prefix: "title:<text>", desc: t.searchCheatSheetTitleFilter, example: "title:config" },
                    { prefix: "sort:newest", desc: t.searchCheatSheetSort, example: "sort:newest" },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-1.5 pr-3 font-mono text-primary whitespace-nowrap">{row.prefix}</td>
                      <td className="py-1.5 pr-3 text-muted-foreground">{row.desc}</td>
                      <td className="py-1.5 font-mono text-blue-400 whitespace-nowrap">{row.example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-[11px] flex-shrink-0">
          <button
            type="button"
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors bg-muted/40 backdrop-blur-sm",
              filtersExpanded
                ? 'bg-accent/80 text-accent-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            )}
            aria-expanded={filtersExpanded}
            aria-label="Toggle filter panel"
          >
            <Filter size={12} />
            <span className="font-medium hidden sm:inline">{t.filters}</span>
            {hasActiveFilters && (
              <span className="min-w-[16px] h-4 rounded-full bg-primary text-[9px] text-primary-foreground flex items-center justify-center px-1">
                {activeFilterCount}
              </span>
            )}
          </button>

          {resultCount !== undefined && (
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              {resultCount} snippet{resultCount !== 1 ? "s" : ""}
            </span>
          )}


          <div className="flex items-center gap-2">
            <SortSelect current={sort} />
            <ViewToggle current={viewMode} />
          </div>

          <button
            type="button"
            onClick={() => setIncludeCode(!includeCode)}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors",
              includeCode
                ? 'bg-accent/80 text-accent-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 bg-muted/40 backdrop-blur-sm'
            )}
            aria-pressed={includeCode}
            aria-label="Include code in search"
          >
            <Code size={12} />
            <span className="hidden sm:inline font-medium">{t.code}</span>
          </button>

          {onImportClick && (
            <button
              type="button"
              onClick={onImportClick}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 bg-muted/40 backdrop-blur-sm transition-colors"
              aria-label="Import from URL"
            >
              <Download size={12} />
              <span className="hidden sm:inline font-medium">{t.import}</span>
            </button>
          )}
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          {activeTags.map(tag => {
            const isExclude = tag.startsWith("!");
            const displayTag = isExclude ? tag.slice(1) : tag;
            return (
              <Badge
                key={`t-${tag}`}
                variant="secondary"
                className={cn(
                  "gap-1 rounded-md py-0 px-2 h-5 flex items-center text-[11px]",
                  isExclude && "border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10"
                )}
              >
                {isExclude ? `!${displayTag}` : displayTag}
                <button type="button" onClick={() => toggleTag(tag)} className="hover:text-destructive ml-0.5" aria-label={`Remove ${tag}`}>
                  <X size={10} />
                </button>
              </Badge>
            );
          })}
          {activeLanguages.map(lang => {
            const isExclude = lang.startsWith("!");
            const displayLang = isExclude ? lang.slice(1) : lang;
            return (
              <Badge
                key={`l-${lang}`}
                variant="secondary"
                className={cn(
                  "gap-1 rounded-md py-0 px-2 h-5 flex items-center text-[11px] font-mono",
                  isExclude && "border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10"
                )}
              >
                {isExclude ? `!${displayLang}` : displayLang}
                <button type="button" onClick={() => toggleLanguage(lang)} className="hover:text-destructive ml-0.5" aria-label={`Remove ${lang}`}>
                  <X size={10} />
                </button>
              </Badge>
            );
          })}
          {activeCollection && (
            <Badge variant="secondary" className="gap-1 rounded-md py-0 px-2 h-5 flex items-center text-[11px]">
              {t.collection}
              <button type="button" onClick={() => updateParams({ collection: null })} className="hover:text-destructive ml-0.5" aria-label={`Remove ${t.collection}`}>
                <X size={10} />
              </button>
            </Badge>
          )}
          {activeVisibility && (
            <Badge variant="secondary" className="gap-1 rounded-md py-0 px-2 h-5 flex items-center text-[11px]">
              {t.visibility || "Visibility"}: {activeVisibility === "PUBLIC" ? t.visibilityPublic : activeVisibility === "PRIVATE" ? t.visibilityPrivate : t.visibilityShared}
              <button type="button" onClick={() => updateParams({ visibility: null })} className="hover:text-destructive ml-0.5" aria-label="Remove visibility filter">
                <X size={10} />
              </button>
            </Badge>
          )}
          {activeAuthor && (
            <Badge variant="secondary" className={cn("gap-1 rounded-md py-0 px-2 h-5 flex items-center text-[11px]", activeAuthorMode === "exclude" ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-primary/30 bg-primary/5 text-primary")}>
              {activeAuthorMode === "exclude" ? `${t.creator || "Creator"}: !${activeAuthor}` : `${t.creator || "Creator"}: ${activeAuthor}`}
              <button type="button" onClick={() => updateParams({ author: null, authorMode: null })} className="hover:text-destructive ml-0.5" aria-label="Remove creator filter">
                <X size={10} />
              </button>
            </Badge>
          )}
          {activePinned !== null && (
            <Badge variant="secondary" className="gap-1 rounded-md py-0 px-2 h-5 flex items-center text-[11px]">
              {activePinned === "true" ? t.filterPinned : t.filterUnpinned}
              <button type="button" onClick={() => updateParams({ pinned: null })} className="hover:text-destructive ml-0.5" aria-label="Remove pinned filter">
                <X size={10} />
              </button>
            </Badge>
          )}
          {activeFavorited !== null && (
            <Badge variant="secondary" className="gap-1 rounded-md py-0 px-2 h-5 flex items-center text-[11px]">
              {activeFavorited === "true" ? t.filterFavorited : t.filterUnfavorited}
              <button type="button" onClick={() => updateParams({ favorited: null })} className="hover:text-destructive ml-0.5" aria-label="Remove favorited filter">
                <X size={10} />
              </button>
            </Badge>
          )}
          {activeMinLines !== null && (
            <Badge variant="secondary" className="gap-1 rounded-md py-0 px-2 h-5 flex items-center text-[11px]">
              {t.filterMinLines.replace("{val}", activeMinLines)}
              <button type="button" onClick={() => updateParams({ minLines: null })} className="hover:text-destructive ml-0.5" aria-label="Remove min lines filter">
                <X size={10} />
              </button>
            </Badge>
          )}
          {activeMaxLines !== null && (
            <Badge variant="secondary" className="gap-1 rounded-md py-0 px-2 h-5 flex items-center text-[11px]">
              {t.filterMaxLines.replace("{val}", activeMaxLines)}
              <button type="button" onClick={() => updateParams({ maxLines: null })} className="hover:text-destructive ml-0.5" aria-label="Remove max lines filter">
                <X size={10} />
              </button>
            </Badge>
          )}
          {activeBefore !== null && (
            <Badge variant="secondary" className="gap-1 rounded-md py-0 px-2 h-5 flex items-center text-[11px]">
              {t.filterBefore.replace("{val}", activeBefore)}
              <button type="button" onClick={() => updateParams({ before: null })} className="hover:text-destructive ml-0.5" aria-label="Remove before date filter">
                <X size={10} />
              </button>
            </Badge>
          )}
          {activeAfter !== null && (
            <Badge variant="secondary" className="gap-1 rounded-md py-0 px-2 h-5 flex items-center text-[11px]">
              {t.filterAfter.replace("{val}", activeAfter)}
              <button type="button" onClick={() => updateParams({ after: null })} className="hover:text-destructive ml-0.5" aria-label="Remove after date filter">
                <X size={10} />
              </button>
            </Badge>
          )}
          {activeMinFiles !== null && (
            <Badge variant="secondary" className="gap-1 rounded-md py-0 px-2 h-5 flex items-center text-[11px]">
              {t.filterMinFiles.replace("{val}", activeMinFiles)}
              <button type="button" onClick={() => updateParams({ minFiles: null })} className="hover:text-destructive ml-0.5" aria-label="Remove min files filter">
                <X size={10} />
              </button>
            </Badge>
          )}
          {activeTitle !== null && (
            <Badge variant="secondary" className="gap-1 rounded-md py-0 px-2 h-5 flex items-center text-[11px]">
              {t.filterTitle.replace("{val}", activeTitle)}
              <button type="button" onClick={() => updateParams({ title: null })} className="hover:text-destructive ml-0.5" aria-label="Remove title filter">
                <X size={10} />
              </button>
            </Badge>
          )}
          <button
            type="button"
            onClick={() => updateParams({
              tags: null,
              language: null,
              collection: null,
              visibility: null,
              author: null,
              authorMode: null,
              pinned: null,
              favorited: null,
              minLines: null,
              maxLines: null,
              before: null,
              after: null,
              minFiles: null,
              title: null,
            })}
            className="text-[11px] text-muted-foreground hover:text-foreground hover:underline ml-1"
          >
            {t.clearAll}
          </button>
        </div>
      )}

      {filtersExpanded && (
        <>
          {/* Desktop: inline filter panel */}
          <div className="hidden md:block space-y-3 pt-2 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <FilterDropdown
                label={t.tags}
                placeholder={t.searchLabel.replace("{label}", t.tags)}
                noMatchesLabel={t.noMatches}
                options={availableTags}
                selected={activeTags}
                onToggle={toggleTag}
              />
              <FilterDropdown
                label={t.languages}
                placeholder={t.searchLabel.replace("{label}", t.languages)}
                noMatchesLabel={t.noMatches}
                options={availableLanguages}
                selected={activeLanguages}
                onToggle={toggleLanguage}
              />

              <VisibilityDropdown
                selected={activeVisibility}
                onSelect={(val) => updateParams({ visibility: val || null })}
                isAuthenticated={isAuthenticated}
              />

              <AuthorDropdown
                options={availableAuthors}
                selected={activeAuthor}
                mode={activeAuthorMode}
                onSelect={(val) => updateParams({ author: val || null })}
                onToggleMode={(m) => updateParams({ authorMode: m })}
              />

              <div className="flex items-center gap-1 bg-muted/30 rounded-md p-0.5">
                <button
                  type="button"
                  onClick={() => { setFilterMode("and"); updateParams({ filterMode: "and" }); }}
                  className={cn(
                    "px-2.5 py-1 rounded text-[11px] font-medium transition-colors",
                    filterMode === "and" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label="Match all filters (AND)"
                  aria-pressed={filterMode === "and"}
                >
                  AND
                </button>
                <button
                  type="button"
                  onClick={() => { setFilterMode("or"); updateParams({ filterMode: "or" }); }}
                  className={cn(
                    "px-2.5 py-1 rounded text-[11px] font-medium transition-colors",
                    filterMode === "or" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label="Match any filter (OR)"
                  aria-pressed={filterMode === "or"}
                >
                  OR
                </button>
              </div>
              <span className="text-[10px] text-muted-foreground hidden sm:inline">
                {filterMode === "or" ? t.matchAny : t.matchAll}
              </span>
            </div>
          </div>

          {/* Mobile: bottom sheet */}
          <div className="md:hidden fixed inset-0 z-50" onClick={() => setFiltersExpanded(false)}>
            <div className="absolute inset-0 bg-black/50 animate-in fade-in duration-200" />
            <div
              className="mobile-bottom-sheet bg-card border-t border-border p-4 space-y-3"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-label="Filter options"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{t.filters}</h3>
                <button
                  type="button"
                  onClick={() => setFiltersExpanded(false)}
                  className="p-2 rounded-md hover:bg-accent/50 touch-target"
                  aria-label="Close filters"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <FilterDropdown
                  label={t.tags}
                  placeholder={t.searchLabel.replace("{label}", t.tags)}
                  noMatchesLabel={t.noMatches}
                  options={availableTags}
                  selected={activeTags}
                  onToggle={toggleTag}
                />
                <FilterDropdown
                  label={t.languages}
                  placeholder={t.searchLabel.replace("{label}", t.languages)}
                  noMatchesLabel={t.noMatches}
                  options={availableLanguages}
                  selected={activeLanguages}
                  onToggle={toggleLanguage}
                />
                <VisibilityDropdown
                  selected={activeVisibility}
                  onSelect={(val) => updateParams({ visibility: val || null })}
                  isAuthenticated={isAuthenticated}
                />
                <AuthorDropdown
                  options={availableAuthors}
                  selected={activeAuthor}
                  mode={activeAuthorMode}
                  onSelect={(val) => updateParams({ author: val || null })}
                  onToggleMode={(m) => updateParams({ authorMode: m })}
                />
                <div className="flex items-center gap-1 bg-muted/30 rounded-md p-0.5">
                  <button
                    type="button"
                    onClick={() => { setFilterMode("and"); updateParams({ filterMode: "and" }); }}
                    className={cn(
                      "px-3 py-1.5 rounded text-xs font-medium transition-colors touch-target",
                      filterMode === "and" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                    aria-label="Match all filters (AND)"
                    aria-pressed={filterMode === "and"}
                  >
                    AND
                  </button>
                  <button
                    type="button"
                    onClick={() => { setFilterMode("or"); updateParams({ filterMode: "or" }); }}
                    className={cn(
                      "px-3 py-1.5 rounded text-xs font-medium transition-colors touch-target",
                      filterMode === "or" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                    aria-label="Match any filter (OR)"
                    aria-pressed={filterMode === "or"}
                  >
                    OR
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
