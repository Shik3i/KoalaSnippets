"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, Code, Command } from "lucide-react";

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

  const navigateSearch = useCallback((q: string, ic: boolean) => {
    setSearching(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (ic) params.set("includeCode", "true");
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
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm p-4">
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
    </div>
  );
}
