"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { Upload, Plus, Globe, Trash2 } from "lucide-react";
import { SnippetCard } from "./snippet-card";
import { SnippetTableRow } from "./snippet-table-row";
import { BulkActionBar } from "./bulk-action-bar";
import { EmptyState } from "@/features/core/components/empty-state";

interface SnippetData {
  id: string;
  title: string;
  description: string | null;
  language: string;
  tags: string[] | null;
  visibility: "PRIVATE" | "SHARED" | "PUBLIC";
  createdAt: Date | string;
  highlightedCode?: string;
  authorUsername?: string;
  totalLines: number;
}

interface DashboardContentProps {
  snippets: SnippetData[];
  viewMode: "grid" | "table";
  density: "compact" | "preview" | "full";
  allowSelection?: boolean;
  isTrashView?: boolean;
  hasMoreInitial?: boolean;
}

export function DashboardContent({ snippets, viewMode, density, allowSelection = true, isTrashView = false, hasMoreInitial = false }: DashboardContentProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();

  const [localSnippets, setLocalSnippets] = useState<SnippetData[]>(snippets);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(hasMoreInitial);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Sync with prop changes (e.g. when searching or filtering)
  useEffect(() => {
    setTimeout(() => {
      setLocalSnippets(snippets);
      setPage(1);
      setHasMore(hasMoreInitial);
    }, 0);
  }, [snippets, hasMoreInitial]);

  const loadMoreRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const currentUrl = new URL(window.location.href);
      const searchParams = new URLSearchParams(currentUrl.search);
      searchParams.set("page", (page + 1).toString());
      if (isTrashView) searchParams.set("visibility", "TRASH");

      const res = await fetch(`/api/snippets?${searchParams.toString()}`);
      const data = await res.json();

      if (data.snippets && data.snippets.length > 0) {
        setLocalSnippets((prev) => [...prev, ...data.snippets]);
        setPage(data.page);
        setHasMore(data.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load more snippets:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, isTrashView, page]);

  useEffect(() => {
    if (!hasMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.5 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMore]);

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
    setSelectedIds(new Set(localSnippets.map((s) => s.id)));
  }, [localSnippets]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const allSelected = localSnippets.length > 0 && selectedIds.size === localSnippets.length;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addToast(`Importing ${e.dataTransfer.files.length} file(s)...`, "info");
      const fileObjects = [];
      
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        if (file.size > 1024 * 1024) {
          addToast(`File ${file.name} exceeds 1MB limit. Skipping.`, "error");
          continue;
        }
        try {
          const text = await file.text();
          const ext = file.name.split('.').pop()?.toLowerCase() || "txt";
          let lang = "plaintext";
          if (ext === "ts" || ext === "tsx") lang = "typescript";
          else if (ext === "js" || ext === "jsx") lang = "javascript";
          else if (ext === "py") lang = "python";
          else if (ext === "html") lang = "html";
          else if (ext === "css") lang = "css";
          else if (ext === "json") lang = "json";
          else if (ext === "md") lang = "markdown";
          else if (ext === "sh") lang = "shell";
          else if (ext === "go") lang = "go";
          else if (ext === "rs") lang = "rust";
          else if (ext === "php") lang = "php";
          else if (ext === "java") lang = "java";
          
          fileObjects.push({
            filename: file.name,
            code: text,
            language: lang
          });
        } catch (err) {
          console.error("Failed to read file", err);
        }
      }
      
      if (fileObjects.length > 0) {
        sessionStorage.setItem("koalasnippets_import", JSON.stringify({
          title: fileObjects.length === 1 ? fileObjects[0].filename : "Imported Snippet",
          files: fileObjects
        }));
        router.push("/dashboard/new?import=1");
      }
    }
  };

  return (
    <div 
      className="flex-1 flex flex-col relative h-full"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm border-2 border-dashed border-primary rounded-lg m-2 flex flex-col items-center justify-center text-primary animate-in fade-in duration-200">
          <Upload className="w-16 h-16 mb-4 opacity-80" />
          <h3 className="text-2xl font-semibold">Drop files here</h3>
          <p className="text-muted-foreground mt-2">to create a new snippet</p>
        </div>
      )}
      
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          {allowSelection && (
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
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        {localSnippets.length === 0 ? (
          isTrashView ? (
            <EmptyState
              icon={<Trash2 size={48} />}
              title="Trash is empty"
              description="Deleted snippets will appear here. You can restore them or permanently delete them."
            />
          ) : (
            <EmptyState
              title="No snippets yet"
              description="Create your first snippet or browse the public directory for inspiration."
              actions={[
                {
                  label: "New Snippet",
                  icon: <Plus size={14} />,
                  onClick: () => router.push("/dashboard/new"),
                },
                {
                  label: "Browse Public",
                  icon: <Globe size={14} />,
                  variant: "outline",
                  onClick: () => router.push("/public"),
                },
              ]}
            />
          )
        ) : viewMode === "table" ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  {allowSelection && (
                    <th className="w-10 px-2 py-2 text-xs font-medium text-muted-foreground">
                      <span className="sr-only">Select</span>
                    </th>
                  )}
                  <th className="px-3 py-2 text-xs font-medium text-muted-foreground min-w-[120px]">Title</th>
                  <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Language</th>
                  <th className="px-3 py-2 text-xs font-medium text-muted-foreground hidden md:table-cell">Tags</th>
                  <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Visibility</th>
                  <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {localSnippets.map((s) => (
                  <SnippetTableRow
                    key={s.id}
                    id={s.id}
                    title={s.title}
                    language={s.language}
                    tags={s.tags ?? undefined}
                    visibility={s.visibility}
                    createdAt={s.createdAt}
                    selected={selectedIds.has(s.id)}
                    onToggleSelect={allowSelection ? toggleSelect : undefined}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {localSnippets.map((s) => (
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
                onToggleSelect={allowSelection ? toggleSelect : undefined}
                authorUsername={s.authorUsername}
                totalLines={s.totalLines}
              />
            ))}
          </div>
        )}
        
        {hasMore && (
          <div ref={loadMoreRef} className="py-6 flex justify-center items-center">
            {isLoadingMore ? (
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <div className="h-6" /> 
            )}
          </div>
        )}
      </div>

      {allowSelection && selectedIds.size > 0 && (
        <BulkActionBar selectedIds={Array.from(selectedIds)} onClear={clearSelection} />
      )}
    </div>
  );
}
