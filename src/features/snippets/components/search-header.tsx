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
    <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm p-4 space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} suppressHydrationWarning />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 h-9 pr-16"
          aria-label="Search snippets"
        />
        {searching ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-3 h-3 border border-muted-foreground border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground pointer-events-none">
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded border border-border bg-background text-[10px]">
              <Command size={10} suppressHydrationWarning />
            </kbd>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded border border-border bg-background text-[10px]">
              K
            </kbd>
          </div>
        )}
      </div>
      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
        <input
          type="checkbox"
          checked={includeCode}
          onChange={(e) => setIncludeCode(e.target.checked)}
          className="rounded border-border"
          aria-label="Include code in search"
        />
        <Code size={12} suppressHydrationWarning />
        Include code in search
      </label>
    </div>
  );
}
