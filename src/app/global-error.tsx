"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { logCrashFromClient } from "@/features/core/utils/crash-reporter-client";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error Boundary]", error);
    logCrashFromClient(
      error.message || "Unknown error",
      error.stack,
      typeof window !== "undefined" ? window.location.pathname : undefined,
      error.digest
    );
  }, [error]);

  return (
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="antialiased font-sans">
        <div className="flex min-h-screen items-center justify-center">
          <div className="rounded-lg border border-border bg-card p-4 sm:p-6 md:p-8 text-center max-w-md mx-4 space-y-4">
            <h2 className="text-lg sm:text-xl font-semibold">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">
              A critical error occurred. Please try reloading the page.
            </p>
            <Button onClick={reset} variant="default">
              Try again
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
