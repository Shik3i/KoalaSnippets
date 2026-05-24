"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard Error]", error);
  }, [error]);

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="rounded-xl border border-border bg-card p-6 max-w-lg w-full space-y-4 text-center">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
            <AlertTriangle size={24} className="text-amber-400" />
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Dashboard Error</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Something went wrong while loading your snippets. This could be a temporary database issue.
          </p>
        </div>
        {isDev && (
          <div className="bg-muted/50 rounded-lg p-3 text-left">
            <p className="text-xs font-mono text-muted-foreground break-all mb-1">
              {error.message || "Unknown error"}
            </p>
            {error.digest && (
              <p className="text-[10px] font-mono text-muted-foreground/60">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}
        <div className="flex gap-2 justify-center">
          <Button onClick={reset} size="sm">
            Try Again
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      </div>
    </div>
  );
}
