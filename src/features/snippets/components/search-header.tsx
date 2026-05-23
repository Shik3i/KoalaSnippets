"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, Code, Command } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SnippetSearchHeaderProps {
  placeholder?: string;
}

export function SnippetSearchHeader({ placeholder = "Search snippets..." }: SnippetSearchHeaderProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [includeCode, setIncludeCode] = useState(searchParams.get("includeCode") === "true");
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeTags = searchParams.get("tags")?.split(",").filter(Boolean) || [];
  const activeLanguage = searchParams.get("language");
  const activeCollection = searchParams.get("collection");

  const navigateSearch = useCallback((q: string, ic: boolean) => {
    setSearching(true);
    const params = new URLSearchParams(window.location.search);
    if (q) {
      params.set("q", q);
    } else {
      params.delete("q");
    }
    if (ic) {
      params.set("includeCode", "true");
    } else {
      params.delete("includeCode");
    }
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    setTimeout(() => setSearching(false), 300);
  }, [pathname, router]);

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

  const handleClearTag = (tagToClear: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const nextTags = activeTags.filter(t => t !== tagToClear);
    if (nextTags.length > 0) {
      params.set("tags", nextTags.join(","));
    } else {
      params.delete("tags");
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleClearLanguage = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("language");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleClearCollection = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("collection");
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="sticky top-0 z-10 p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border space-y-2">
      <div className="relative flex items-center w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} suppressHydrationWarning />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 h-9 pr-28 sm:pr-56 w-full"
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
          
          <div className="h-4 w-[1px] bg-border" />
          
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors py-1">
            <input
              type="checkbox"
              checked={includeCode}
              onChange={(e) => setIncludeCode(e.target.checked)}
              className="rounded border-border text-primary focus:ring-ring focus:ring-offset-background"
              aria-label="Include code in search"
            />
            <Code size={14} suppressHydrationWarning className="text-muted-foreground" />
            <span className="hidden sm:inline font-medium">Include code</span>
          </label>
        </div>
      </div>

      {(activeTags.length > 0 || activeLanguage || activeCollection) && (
        <div className="flex flex-wrap items-center gap-2 text-[11px] pt-1.5 border-t border-border/20">
          <span className="text-muted-foreground font-medium">Active filters:</span>
          {activeLanguage && (
            <Badge variant="secondary" className="gap-1 rounded-md py-0 px-2 h-5 flex items-center">
              Language: {activeLanguage}
              <button type="button" onClick={handleClearLanguage} className="hover:text-destructive font-bold ml-1 text-xs" aria-label="Clear language filter">×</button>
            </Badge>
          )}
          {activeTags.map(tag => (
            <Badge key={tag} variant="secondary" className="gap-1 rounded-md py-0 px-2 h-5 flex items-center">
              Tag: {tag}
              <button type="button" onClick={() => handleClearTag(tag)} className="hover:text-destructive font-bold ml-1 text-xs" aria-label={`Clear tag ${tag} filter`}>×</button>
            </Badge>
          ))}
          {activeCollection && (
            <Badge variant="secondary" className="gap-1 rounded-md py-0 px-2 h-5 flex items-center">
              Collection Active
              <button type="button" onClick={handleClearCollection} className="hover:text-destructive font-bold ml-1 text-xs" aria-label="Clear collection filter">×</button>
            </Badge>
          )}
          <button
            type="button"
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.delete("tags");
              params.delete("language");
              params.delete("collection");
              router.replace(`${pathname}?${params.toString()}`);
            }}
            className="text-primary hover:underline ml-2 text-[11px] font-medium"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
