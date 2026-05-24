

export function SnippetSkeleton() {
  return (
    <div className="group block rounded-xl border border-border/50 bg-card/40 p-3 sm:p-4 relative overflow-hidden h-[180px]">
      {/* Shimmer Effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-primary/5 to-transparent z-0" />
      
      <div className="relative z-10 flex flex-col h-full">
        {/* Header (Title & Visibility Icon) */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="h-5 w-2/3 bg-muted/60 rounded-md animate-pulse" />
          <div className="h-4 w-4 bg-muted/60 rounded-full shrink-0 animate-pulse" />
        </div>

        {/* Metadata Badges */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <div className="h-4 w-12 bg-muted/60 rounded animate-pulse" />
          <div className="h-4 w-20 bg-muted/60 rounded animate-pulse" />
          <div className="h-4 w-24 bg-muted/60 rounded animate-pulse" />
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          <div className="h-4 w-10 bg-muted/60 rounded animate-pulse" />
          <div className="h-4 w-14 bg-muted/60 rounded animate-pulse" />
          <div className="h-4 w-12 bg-muted/60 rounded animate-pulse" />
        </div>

        {/* Code Preview Placeholder */}
        <div className="mt-auto h-16 w-full bg-muted/30 rounded-md border border-border/30 flex flex-col justify-center px-3 space-y-2">
          <div className="h-2 w-5/6 bg-muted/50 rounded-full animate-pulse" />
          <div className="h-2 w-3/6 bg-muted/50 rounded-full animate-pulse" />
          <div className="h-2 w-4/6 bg-muted/50 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
