"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { logCrashFromClient } from "@/features/core/utils/crash-reporter-client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App Error Boundary]", error);
    logCrashFromClient(
      error.message || "Unknown error",
      error.stack,
      window.location.pathname,
      error.digest
    );
  }, [error]);

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="rounded-xl border border-border bg-card p-6 max-w-lg mx-4 w-full space-y-4 text-center">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle size={24} className="text-destructive" />
          </div>
        </div>
        <h2 className="text-lg sm:text-xl font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">
          An unexpected error occurred. Please try again.
        </p>
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
        <Button onClick={reset} variant="default">
          Try again
        </Button>
      </div>
    </div>
  );
}
