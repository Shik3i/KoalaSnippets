/* eslint-disable react-hooks/incompatible-library */
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { Upload, Plus, Globe, Trash2, Download } from "lucide-react";
import { SnippetCard } from "./snippet-card";
import { SnippetTableRow, TABLE_GRID_COLS } from "./snippet-table-row";
import { SnippetSkeleton } from "./snippet-skeleton";
import { SnippetTableSkeleton } from "./snippet-table-skeleton";
import { BulkActionBar } from "./bulk-action-bar";
import { EmptyState } from "@/features/core/components/empty-state";
import { ImportWizard } from "@/features/snippets/components/import-wizard";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Checkbox } from "@/components/ui/checkbox";
import { useI18n } from "@/features/core/i18n";

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
  isPinned?: boolean;
  isFavorited?: boolean;
}

interface DashboardContentProps {
  snippets: SnippetData[];
  viewMode: "grid" | "table";
  density: "compact" | "preview" | "full";
  allowSelection?: boolean;
  isTrashView?: boolean;
  hasMoreInitial?: boolean;
  importOpen?: boolean;
  onImportClose?: () => void;
}

const GRID_ITEM_HEIGHT = 220;
const TABLE_ROW_HEIGHT = 44;

export function DashboardContent({ snippets, viewMode, density, allowSelection = true, isTrashView = false, hasMoreInitial = false, importOpen: importOpenProp, onImportClose }: DashboardContentProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [importOpenInternal, setImportOpenInternal] = useState(false);
  const isControlled = importOpenProp !== undefined;
  const importOpen = isControlled ? importOpenProp : importOpenInternal;
  const closeImport = isControlled ? onImportClose! : () => setImportOpenInternal(false);
  const openImport = () => isControlled ? window.dispatchEvent(new CustomEvent("koalasnippets:open-import")) : setImportOpenInternal(true);
  const [isInitialLoading, setIsInitialLoading] = useState(snippets.length === 0);
  const router = useRouter();
  const { addToast } = useToast();
  const { t } = useI18n();

  const [localSnippets, setLocalSnippets] = useState<SnippetData[]>(snippets);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(hasMoreInitial);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLocalSnippets(snippets);
      setPage(1);
      setHasMore(hasMoreInitial);
      setIsInitialLoading(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [snippets, hasMoreInitial]);

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const loadMoreFnRef = useRef<(() => void) | null>(null);

  const loadMore = useCallback(async () => {
    if (isFetchingRef.current || !hasMore) return;
    isFetchingRef.current = true;
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
      isFetchingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [hasMore, isTrashView, page]);

  useEffect(() => {
    loadMoreFnRef.current = loadMore;
  });

  useEffect(() => {
    if (!hasMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && loadMoreFnRef.current) {
          loadMoreFnRef.current();
        }
      },
      { threshold: 0.5 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore]);

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
      addToast(t.importingFiles.replace("{count}", String(e.dataTransfer.files.length)), "info");
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

  // Shared scroll container
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Virtualizer for table view
  const tableVirtualizer = useVirtualizer({
    count: localSnippets.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => TABLE_ROW_HEIGHT,
    overscan: 10,
  });

  // Virtualizer for grid view
  const [gridColumns, setGridColumns] = useState(3);

  useEffect(() => {
    const updateColumns = () => {
      if (!scrollContainerRef.current) return;
      const width = scrollContainerRef.current.offsetWidth;
      if (width < 640) setGridColumns(1);
      else if (width < 1024) setGridColumns(2);
      else if (width < 1280) setGridColumns(3);
      else setGridColumns(4);
    };
    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  const gridVirtualizer = useVirtualizer({
    count: Math.ceil(localSnippets.length / gridColumns),
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => GRID_ITEM_HEIGHT,
    overscan: 5,
  });

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
          <h3 className="text-2xl font-semibold">{t.dropFilesHere}</h3>
          <p className="text-muted-foreground mt-2">{t.dropFilesDesc}</p>
        </div>
      )}
      
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          {allowSelection && (
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
              <Checkbox
                checked={allSelected}
                onChange={() => (allSelected ? clearSelection() : selectAll())}
                indeterminate={selectedIds.size > 0 && !allSelected}
                aria-label={t.selectAll}
              />
              {selectedIds.size > 0 ? `${selectedIds.size} ${t.selected}` : t.selectAll}
            </label>
          )}
        </div>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-3 sm:p-4">
        {isInitialLoading ? (
          viewMode === "table" ? (
            /* Table skeleton */
            <div role="table" className="w-full">
              <div
                role="rowgroup"
                className="sticky top-0 z-10 bg-card border-b border-border"
              >
                <div
                  role="row"
                  className="w-full grid items-center"
                  style={{ gridTemplateColumns: TABLE_GRID_COLS }}
                >
                  <div role="columnheader" className="px-2 py-2 text-xs font-medium text-muted-foreground"><span className="sr-only">{t.selectAll}</span></div>
                  <div role="columnheader" className="px-3 py-2 text-xs font-medium text-muted-foreground">{t.headerTitle}</div>
                  <div role="columnheader" className="px-3 py-2 text-xs font-medium text-muted-foreground">{t.headerLanguage}</div>
                  <div role="columnheader" className="px-3 py-2 text-xs font-medium text-muted-foreground hidden md:block">{t.headerTags}</div>
                  <div role="columnheader" className="px-3 py-2 text-xs font-medium text-muted-foreground">{t.headerVisibility}</div>
                  <div role="columnheader" className="px-3 py-2 text-xs font-medium text-muted-foreground">{t.headerDate}</div>
                </div>
              </div>
              <div role="rowgroup">
                {Array.from({ length: 9 }).map((_, i) => (
                  <SnippetTableSkeleton key={i} />
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <SnippetSkeleton key={i} />
              ))}
            </div>
          )
        ) : localSnippets.length === 0 ? (
          isTrashView ? (
            <EmptyState
              icon={<Trash2 size={48} />}
              title={t.trashEmpty}
              description={t.trashEmptyDesc}
            />
          ) : (
            <EmptyState
              title={t.noSnippets}
              description={t.noSnippetsDesc}
              actions={[
                {
                  label: t.createFirst,
                  icon: <Plus size={14} />,
                  onClick: () => router.push("/dashboard/new"),
                },
                {
                  label: t.importFromUrl,
                  icon: <Download size={14} />,
                  variant: "outline",
                  onClick: () => openImport(),
                },
                {
                  label: t.browsePublic,
                  icon: <Globe size={14} />,
                  variant: "outline",
                  onClick: () => router.push("/public"),
                },
              ]}
            />
          )
        ) : viewMode === "table" ? (
          /* ── Table / List View ─────────────────────────────────────────────
             div-based virtualised layout using CSS Grid.
             The header lives OUTSIDE the height container so sticky works
             correctly regardless of the virtualizer's total height.          */
          <div role="table" className="w-full">
            {/* Sticky header — outside the virtualizer height div */}
            <div
              role="rowgroup"
              className="sticky top-0 z-10 bg-card border-b border-border"
            >
              <div
                role="row"
                className="w-full grid items-center"
                style={{ gridTemplateColumns: TABLE_GRID_COLS }}
              >
                {allowSelection && (
                  <div role="columnheader" className="w-10 px-2 py-2 text-xs font-medium text-muted-foreground">
                    <span className="sr-only">{t.selectAll}</span>
                  </div>
                )}
                {!allowSelection && <div role="columnheader" className="px-2 py-2" />}
                <div role="columnheader" className="px-3 py-2 text-xs font-medium text-muted-foreground">{t.headerTitle}</div>
                <div role="columnheader" className="px-3 py-2 text-xs font-medium text-muted-foreground">{t.headerLanguage}</div>
                <div role="columnheader" className="px-3 py-2 text-xs font-medium text-muted-foreground hidden md:block">{t.headerTags}</div>
                <div role="columnheader" className="px-3 py-2 text-xs font-medium text-muted-foreground">{t.headerVisibility}</div>
                <div role="columnheader" className="px-3 py-2 text-xs font-medium text-muted-foreground">{t.headerDate}</div>
              </div>
            </div>

            {/* Virtualizer height container */}
            <div
              role="rowgroup"
              style={{
                height: `${tableVirtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {tableVirtualizer.getVirtualItems().map((virtualRow) => {
                const s = localSnippets[virtualRow.index];
                return (
                  <div
                    key={s.id}
                    data-index={virtualRow.index}
                    ref={(node) => tableVirtualizer.measureElement(node)}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <SnippetTableRow
                      id={s.id}
                      title={s.title}
                      language={s.language}
                      tags={s.tags ?? undefined}
                      visibility={s.visibility}
                      createdAt={s.createdAt}
                      selected={selectedIds.has(s.id)}
                      onToggleSelect={allowSelection ? toggleSelect : undefined}
                      isPinned={s.isPinned}
                      isFavorited={s.isFavorited}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ── Grid / Card View ──────────────────────────────────────────── */
          <div className="h-full relative">
            <div
              style={{
                height: `${gridVirtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {gridVirtualizer.getVirtualItems().map((virtualRow) => {
                const startIndex = virtualRow.index * gridColumns;
                const rowSnippets = localSnippets.slice(startIndex, startIndex + gridColumns);
                return (
                  <div
                    key={virtualRow.index}
                    data-index={virtualRow.index}
                    ref={(node) => gridVirtualizer.measureElement(node)}
                    className="grid gap-3 sm:gap-4"
                    style={{
                      transform: `translateY(${virtualRow.start}px)`,
                      position: "absolute",
                      left: 0,
                      right: 0,
                      gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
                    }}
                  >
                    {rowSnippets.map((s, idx) => (
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
                        isPinned={s.isPinned}
                        isFavorited={s.isFavorited}
                        cardIndex={startIndex + idx}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {hasMore && (
          <div ref={loadMoreRef} className="py-6">
            {isLoadingMore ? (
              viewMode === "table" ? (
                <div role="rowgroup">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <SnippetTableSkeleton key={`loading-${i}`} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <SnippetSkeleton key={`loading-${i}`} />
                  ))}
                </div>
              )
            ) : (
              <div className="h-6" />
            )}
          </div>
        )}
      </div>

      {allowSelection && selectedIds.size > 0 && (
        <BulkActionBar selectedIds={Array.from(selectedIds)} onClear={clearSelection} />
      )}

      <ImportWizard open={importOpen} onClose={closeImport} />
    </div>
  );
}
