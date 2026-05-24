"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { logCrashFromClient } from "@/features/core/utils/crash-reporter-client";

export default function SnippetsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Snippets Error]", error);
    logCrashFromClient(
      error.message || "Unknown error",
      error.stack,
      window.location.pathname,
      error.digest
    );
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="rounded-xl border border-border bg-card p-6 max-w-lg w-full space-y-4 text-center">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
            <AlertTriangle size={24} className="text-amber-400" />
          </div>
        </div>
        <h2 className="text-lg font-semibold">Snippet Error</h2>
        <p className="text-sm text-muted-foreground">
          Failed to load this snippet. It may have been deleted or the database is temporarily unavailable.
        </p>
        <div className="flex gap-2 justify-center">
          <Button onClick={reset} size="sm">Try Again</Button>
          <Button variant="outline" size="sm" onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    </div>
  );
}
