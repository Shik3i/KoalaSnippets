"use client";

import { useState } from "react";
import { SnippetSearchHeader } from "@/features/snippets/components/search-header";
import { DashboardContent } from "@/features/snippets/components/dashboard-content";

interface DashboardClientProps {
  sidebarTags: string[];
  sidebarLanguages: string[];
  availableAuthors?: string[];
  sortMode: "newest" | "oldest" | "alphabetical" | "size-asc" | "size-desc";
  viewMode: "grid" | "table";
  resultCount: number;
  highlightedSnippets: Array<{
    id: string;
    title: string;
    description: string | null;
    language: string;
    tags: string[] | null;
    visibility: "PRIVATE" | "SHARED" | "PUBLIC";
    authorUsername: string;
    totalLines: number;
    isPinned: boolean;
    isFavorited: boolean;
    createdAt: Date;
    highlightedCode?: string;
  }>;
  density: "compact" | "preview" | "full";
  hasMoreInitial: boolean;
}

export function DashboardClient({
  sidebarTags,
  sidebarLanguages,
  availableAuthors = [],
  sortMode,
  viewMode,
  resultCount,
  highlightedSnippets,
  density,
  hasMoreInitial,
}: DashboardClientProps) {
  const [importOpen, setImportOpen] = useState(false);

  return (
    <>
      <SnippetSearchHeader
        availableTags={sidebarTags}
        availableLanguages={sidebarLanguages}
        availableAuthors={availableAuthors}
        isAuthenticated={true}
        sort={sortMode}
        viewMode={viewMode}
        resultCount={resultCount}
        onImportClick={() => setImportOpen(true)}
      />
      <DashboardContent
        snippets={highlightedSnippets}
        viewMode={viewMode}
        density={density}
        hasMoreInitial={hasMoreInitial}
        importOpen={importOpen}
        onImportClose={() => setImportOpen(false)}
      />
    </>
  );
}
