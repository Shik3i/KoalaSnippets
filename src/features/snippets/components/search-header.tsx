"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Code, Command, Filter, X, ChevronDown, Check } from "lucide-react";
import Image from "next/image";
import KoalaSuche from "../../../../public/KoalaSuche.png";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/features/core/utils/utils";
import { SortSelect } from "./sort-select";
import { ViewToggle } from "./view-toggle";

interface SnippetSearchHeaderProps {
  placeholder?: string;
  availableTags?: string[];
  availableLanguages?: string[];
  sort?: "newest" | "oldest" | "alphabetical" | "size-asc" | "size-desc";
  viewMode?: "grid" | "table";
  resultCount?: number;
}

function FilterDropdown({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
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
            placeholder={`Search ${label.toLowerCase()}...`}
            className="w-full h-7 px-2 text-[11px] bg-muted/50 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
            autoFocus
          />
          <div ref={listRef} className="max-h-40 overflow-y-auto space-y-0.5" role="listbox">
            {filtered.length === 0 ? (
              <div className="text-[11px] text-muted-foreground px-2 py-2 text-center">No matches</div>
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

export function SnippetSearchHeader({ 
  placeholder = "Search snippets...",
  availableTags = [],
  availableLanguages = [],
  sort = "newest",
  viewMode = "grid",
  resultCount,
}: SnippetSearchHeaderProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [includeCode, setIncludeCode] = useState(searchParams.get("includeCode") === "true");
  const [filterMode, setFilterMode] = useState(searchParams.get("filterMode") ?? "and");
  const [searching, setSearching] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
      navigateSearch(query, includeCode);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, includeCode, navigateSearch]);

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

  const hasActiveFilters = activeTags.length > 0 || activeLanguages.length > 0 || activeCollection;
  const activeFilterCount = activeTags.length + activeLanguages.length;

  return (
    <div className="sticky top-0 z-10 p-4 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <Image src={KoalaSuche} alt="Search" width={28} height={22} className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-50 z-10" />
          <Input
            ref={inputRef}
            id="snippet-search"
            name="q"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 h-9 pr-14 w-full border-0 shadow-none focus-visible:ring-0 bg-muted/40 backdrop-blur-sm"
            aria-label="Search snippets"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {searching ? (
              <div className="w-3.5 h-3.5 border border-muted-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
                }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 px-1.5 py-0.5 rounded transition-colors"
                aria-label="Open Command Palette"
              >
                <Command size={14} suppressHydrationWarning />
              </button>
            )}
          </div>
        </div>

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
            <span className="font-medium hidden sm:inline">Filters</span>
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

          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors py-1">
            <input
              type="checkbox"
              id="include-code"
              name="includeCode"
              checked={includeCode}
              onChange={(e) => setIncludeCode(e.target.checked)}
              className="rounded border-border text-primary focus:ring-ring focus:ring-offset-background"
              aria-label="Include code in search"
            />
            <Code size={14} className="text-muted-foreground" />
            <span className="hidden sm:inline font-medium">Include code</span>
          </label>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          {activeTags.map(tag => (
            <Badge key={`t-${tag}`} variant="secondary" className="gap-1 rounded-md py-0 px-2 h-5 flex items-center text-[11px]">
              {tag}
              <button type="button" onClick={() => toggleTag(tag)} className="hover:text-destructive ml-0.5" aria-label={`Remove ${tag}`}>
                <X size={10} />
              </button>
            </Badge>
          ))}
          {activeLanguages.map(lang => (
            <Badge key={`l-${lang}`} variant="secondary" className="gap-1 rounded-md py-0 px-2 h-5 flex items-center text-[11px] font-mono">
              {lang}
              <button type="button" onClick={() => toggleLanguage(lang)} className="hover:text-destructive ml-0.5" aria-label={`Remove ${lang}`}>
                <X size={10} />
              </button>
            </Badge>
          ))}
          {activeCollection && (
            <Badge variant="secondary" className="gap-1 rounded-md py-0 px-2 h-5 flex items-center text-[11px]">
              Collection
              <button type="button" onClick={() => updateParams({ collection: null })} className="hover:text-destructive ml-0.5" aria-label="Remove collection filter">
                <X size={10} />
              </button>
            </Badge>
          )}
          <button
            type="button"
            onClick={() => updateParams({ tags: null, language: null, collection: null })}
            className="text-[11px] text-muted-foreground hover:text-foreground hover:underline ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {filtersExpanded && (
        <>
          {/* Desktop: inline filter panel */}
          <div className="hidden md:block space-y-3 pt-2 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <FilterDropdown
                label="Tags"
                options={availableTags}
                selected={activeTags}
                onToggle={toggleTag}
              />
              <FilterDropdown
                label="Languages"
                options={availableLanguages}
                selected={activeLanguages}
                onToggle={toggleLanguage}
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
                {filterMode === "or" ? "Match any" : "Match all"}
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
                <h3 className="text-sm font-semibold">Filters</h3>
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
                  label="Tags"
                  options={availableTags}
                  selected={activeTags}
                  onToggle={toggleTag}
                />
                <FilterDropdown
                  label="Languages"
                  options={availableLanguages}
                  selected={activeLanguages}
                  onToggle={toggleLanguage}
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
