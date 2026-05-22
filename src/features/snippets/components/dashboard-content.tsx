"use client";

import { useState, useCallback } from "react";
import { SnippetCard } from "./snippet-card";
import { SnippetTableRow } from "./snippet-table-row";
import { ViewToggle } from "./view-toggle";
import { SortSelect } from "./sort-select";
import { BulkActionBar } from "./bulk-action-bar";

interface SnippetData {
  id: string;
  title: string;
  description: string | null;
  code: string;
  language: string;
  tags: string[] | null;
  visibility: "PRIVATE" | "SHARED" | "PUBLIC";
  createdAt: Date;
  updatedAt: Date;
  highlightedCode?: string;
}

interface DashboardContentProps {
  snippets: SnippetData[];
  viewMode: "grid" | "table";
  sort: "newest" | "oldest" | "alphabetical";
  density: "compact" | "preview" | "full";
}

export function DashboardContent({ snippets, viewMode, sort, density }: DashboardContentProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(snippets.map((s) => s.id)));
  }, [snippets]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const allSelected = snippets.length > 0 && selectedIds.size === snippets.length;

  return (
    <>
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/20">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() => (allSelected ? clearSelection() : selectAll())}
              className="rounded border-border text-primary focus:ring-ring cursor-pointer"
              aria-label="Select all snippets"
            />
            {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all"}
          </label>
        </div>
        <div className="flex items-center gap-3">
          <SortSelect current={sort} />
          <ViewToggle current={viewMode} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {snippets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p className="text-lg mb-2">No snippets yet</p>
            <p className="text-sm">Click &quot;New Snippet&quot; to create your first one</p>
          </div>
        ) : viewMode === "table" ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="w-10 px-2 py-2 text-xs font-medium text-muted-foreground">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Title</th>
                  <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Language</th>
                  <th className="px-3 py-2 text-xs font-medium text-muted-foreground hidden md:table-cell">Tags</th>
                  <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Visibility</th>
                  <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {snippets.map((s) => (
                  <SnippetTableRow
                    key={s.id}
                    id={s.id}
                    title={s.title}
                    language={s.language}
                    tags={s.tags ?? undefined}
                    visibility={s.visibility}
                    createdAt={s.createdAt}
                    selected={selectedIds.has(s.id)}
                    onToggleSelect={toggleSelect}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {snippets.map((s) => (
              <SnippetCard
                key={s.id}
                id={s.id}
                title={s.title}
                description={s.description ?? undefined}
                language={s.language}
                tags={s.tags ?? undefined}
                visibility={s.visibility}
                createdAt={s.createdAt}
                snippetDensity={density}
                highlightedCode={s.highlightedCode}
                selected={selectedIds.has(s.id)}
                onToggleSelect={toggleSelect}
              />
            ))}
          </div>
        )}
      </div>

      {selectedIds.size > 0 && (
        <BulkActionBar selectedIds={Array.from(selectedIds)} onClear={clearSelection} />
      )}
    </>
  );
}
