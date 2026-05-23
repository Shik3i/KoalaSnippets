"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, Code, Command, Filter, X, ChevronDown, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/features/core/utils/utils";

interface SnippetSearchHeaderProps {
  placeholder?: string;
  availableTags?: string[];
  availableLanguages?: string[];
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
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs transition-colors",
          selected.length > 0
            ? "border-primary/30 bg-primary/5 text-foreground"
            : "border-border bg-muted/30 text-muted-foreground hover:border-muted-foreground/30"
        )}
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${label.toLowerCase()}...`}
            className="w-full h-7 px-2 text-[11px] bg-muted/50 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
            autoFocus
          />
          <div className="max-h-40 overflow-y-auto space-y-0.5">
            {filtered.length === 0 ? (
              <div className="text-[11px] text-muted-foreground px-2 py-2 text-center">No matches</div>
            ) : (
              filtered.map(option => {
                const isSelected = selected.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onToggle(option)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded text-[11px] text-left transition-colors",
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

  const activeTags = useMemo(
    () => searchParams.get("tags")?.split(",").filter(Boolean) || [],
    [searchParams]
  );
  const activeLanguages = useMemo(
    () => searchParams.get("language")?.split(",").filter(Boolean) || [],
    [searchParams]
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
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const hasActiveFilters = activeTags.length > 0 || activeLanguages.length > 0 || activeCollection;
  const activeFilterCount = activeTags.length + activeLanguages.length;

  return (
    <div className="sticky top-0 z-10 p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border space-y-2">
      <div className="relative flex items-center w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} suppressHydrationWarning />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 h-9 pr-28 sm:pr-56 w-full border-0 shadow-none focus-visible:ring-0"
          aria-label="Search snippets"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 sm:gap-3">
          {searching ? (
            <div className="w-3.5 h-3.5 border border-muted-foreground border-t-transparent rounded-full animate-spin" />
          ) : (
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
              }}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 px-2 py-1 rounded-md transition-colors"
              aria-label="Open Command Palette"
            >
              <Command size={14} suppressHydrationWarning />
              <span className="hidden sm:inline font-medium">Command</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-[11px] pt-1.5 border-t border-border/20">
        <button
          type="button"
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors",
            filtersExpanded
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
          aria-expanded={filtersExpanded}
          aria-label="Toggle filter panel"
        >
          <Filter size={12} />
          <span className="font-medium">Filters</span>
          {hasActiveFilters && (
            <span className="min-w-[16px] h-4 rounded-full bg-primary text-[9px] text-primary-foreground flex items-center justify-center px-1">
              {activeFilterCount}
            </span>
          )}
        </button>

        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors py-1 ml-auto">
          <input
            type="checkbox"
            checked={includeCode}
            onChange={(e) => setIncludeCode(e.target.checked)}
            className="rounded border-border text-primary focus:ring-ring focus:ring-offset-background"
            aria-label="Include code in search"
          />
          <Code size={14} className="text-muted-foreground" />
          <span className="hidden sm:inline font-medium">Include code</span>
        </label>
      </div>

      {filtersExpanded && (
        <div className="space-y-3 pt-2 pb-1 border-t border-border/20">
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
              >
                OR
              </button>
            </div>
            <span className="text-[10px] text-muted-foreground hidden sm:inline">
              {filterMode === "or" ? "Match any" : "Match all"}
            </span>
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
              <button
                type="button"
                onClick={() => updateParams({ tags: null, language: null, collection: null })}
                className="text-[11px] text-muted-foreground hover:text-foreground hover:underline ml-1"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
