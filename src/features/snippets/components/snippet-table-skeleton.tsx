import { TABLE_GRID_COLS } from "./snippet-table-row";

export function SnippetTableSkeleton() {
  return (
    <div
      role="row"
      className="border-b border-border/50 w-full grid items-center relative overflow-hidden"
      style={{ gridTemplateColumns: TABLE_GRID_COLS, height: "44px" }}
    >
      {/* Shimmer */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-primary/5 to-transparent z-0 pointer-events-none" />

      {/* Checkbox placeholder */}
      <div className="px-2 py-2.5 flex items-center">
        <div className="h-3.5 w-3.5 rounded bg-muted/60 animate-pulse" />
      </div>

      {/* Title */}
      <div className="px-3 py-2.5">
        <div className="h-3.5 w-3/4 bg-muted/60 rounded animate-pulse" />
      </div>

      {/* Language */}
      <div className="px-3 py-2.5">
        <div className="h-4 w-16 bg-muted/60 rounded animate-pulse" />
      </div>

      {/* Tags */}
      <div className="px-3 py-2.5 hidden md:flex gap-1">
        <div className="h-4 w-10 bg-muted/60 rounded animate-pulse" />
        <div className="h-4 w-12 bg-muted/60 rounded animate-pulse" />
      </div>

      {/* Visibility */}
      <div className="px-3 py-2.5">
        <div className="h-3.5 w-14 bg-muted/60 rounded animate-pulse" />
      </div>

      {/* Date */}
      <div className="px-3 py-2.5">
        <div className="h-3.5 w-20 bg-muted/60 rounded animate-pulse" />
      </div>
    </div>
  );
}
