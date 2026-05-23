import { SnippetSkeleton } from "@/features/snippets/components/snippet-skeleton";
import { Sidebar } from "@/features/core/components/sidebar";
import { SnippetSearchHeader } from "@/features/snippets/components/search-header";

export default function DashboardLoading() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isAuthenticated={true} isAdmin={false} />
      <div className="flex-1 flex flex-col min-w-0">
        <SnippetSearchHeader />
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/20">
          <div className="h-6 w-32 bg-muted rounded animate-pulse" />
          <div className="h-6 w-24 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SnippetSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
