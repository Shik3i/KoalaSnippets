"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { Upload } from "lucide-react";
import { SnippetCard } from "./snippet-card";
import { SnippetTableRow } from "./snippet-table-row";
import { ViewToggle } from "./view-toggle";
import { SortSelect } from "./sort-select";
import { BulkActionBar } from "./bulk-action-bar";

interface SnippetData {
  id: string;
  title: string;
  description: string | null;
  language: string;
  tags: string[] | null;
  visibility: "PRIVATE" | "SHARED" | "PUBLIC";
  createdAt: Date;
  updatedAt: Date;
  highlightedCode?: string;
  authorUsername?: string;
}

interface DashboardContentProps {
  snippets: SnippetData[];
  viewMode: "grid" | "table";
  sort: "newest" | "oldest" | "alphabetical" | "size-asc" | "size-desc";
  density: "compact" | "preview" | "full";
}

export function DashboardContent({ snippets, viewMode, sort, density }: DashboardContentProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();

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
                authorUsername={s.authorUsername}
              />
            ))}
          </div>
        )}
      </div>

      {selectedIds.size > 0 && (
        <BulkActionBar selectedIds={Array.from(selectedIds)} onClear={clearSelection} />
      )}
    </div>
  );
}
