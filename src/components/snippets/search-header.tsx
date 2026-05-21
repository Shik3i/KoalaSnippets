"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, Code } from "lucide-react";

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

  return (
    <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm p-4 space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} suppressHydrationWarning />
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 h-9"
        />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-3 h-3 border border-muted-foreground border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
        <input
          type="checkbox"
          checked={includeCode}
          onChange={(e) => setIncludeCode(e.target.checked)}
          className="rounded border-border"
        />
        <Code size={12} suppressHydrationWarning />
        Include code in search
      </label>
    </div>
  );
}
