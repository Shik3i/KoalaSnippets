"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Search, Code, Lock, Globe, Link2 } from "lucide-react";

interface SnippetListItem {
  id: string;
  title: string;
  language: string;
  tags?: string[];
  visibility: "PRIVATE" | "SHARED" | "PUBLIC";
  createdAt: Date;
}

interface ListViewProps {
  snippets: SnippetListItem[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  apiEndpoint: string;
}

const visibilityIcons = {
  PRIVATE: Lock,
  SHARED: Link2,
  PUBLIC: Globe,
};

const visibilityColors = {
  PRIVATE: "text-muted-foreground",
  SHARED: "text-info",
  PUBLIC: "text-success",
};

export function ListView({ snippets: initialSnippets, selectedId, onSelect, apiEndpoint }: ListViewProps) {
  const [snippets, setSnippets] = useState<SnippetListItem[]>(
    initialSnippets.map((s) => ({ ...s, createdAt: new Date(s.createdAt) }))
  );
  const [search, setSearch] = useState("");
  const [includeCode, setIncludeCode] = useState(false);
  const [searching, setSearching] = useState(false);

  const searchSnippets = useCallback(async (q: string, includeCodeSearch: boolean) => {
    if (!q) {
      setSnippets(initialSnippets.map((s) => ({ ...s, createdAt: new Date(s.createdAt) })));
      return;
    }

    setSearching(true);
    try {
      const params = new URLSearchParams({
        q,
        includeCode: String(includeCodeSearch),
        visibility: apiEndpoint.includes("/public") ? "PUBLIC" : "",
      });

      const res = await fetch(`/api/snippets?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSnippets(data.snippets.map((s: SnippetListItem) => ({ ...s, createdAt: new Date(s.createdAt) })));
      }
    } catch {
      // ignore
    } finally {
      setSearching(false);
    }
  }, [initialSnippets, apiEndpoint]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchSnippets(search, includeCode);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, includeCode, searchSnippets]);

  return (
    <div className="flex flex-col h-full border-r border-border bg-card/50">
      <div className="sticky top-0 z-10 p-3 space-y-2 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} suppressHydrationWarning />
          <Input
            placeholder="Search snippets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
          {searching && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
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

      <div className="flex-1 overflow-y-auto">
        {snippets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm p-6">
            <Search size={24} className="mb-2 opacity-50" suppressHydrationWarning />
            No snippets found
          </div>
        ) : (
          <div className="divide-y divide-border">
            {snippets.map((snippet) => {
              const Icon = visibilityIcons[snippet.visibility];
              return (
                <button
                  key={snippet.id}
                  onClick={() => onSelect?.(snippet.id)}
                  className={cn(
                    "w-full text-left p-3 hover:bg-accent/50 transition-colors",
                    selectedId === snippet.id && "bg-accent"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-sm truncate">{snippet.title}</h3>
                    <Icon size={12} className={cn("shrink-0 mt-1", visibilityColors[snippet.visibility])} suppressHydrationWarning />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                      {snippet.language}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {snippet.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                  {snippet.tags && snippet.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {snippet.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[10px] h-4 px-1">
                          {tag}
                        </Badge>
                      ))}
                      {snippet.tags.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">+{snippet.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
