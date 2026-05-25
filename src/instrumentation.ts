

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      console.log("[db] Running automated database migrations...");
      const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
      const { db } = await import("@/db");
      migrate(db, { migrationsFolder: "./src/db/migrations" });
      console.log("[db] Database migrations applied successfully.");
    } catch (err) {
      console.error("[db] Migration failed:", err);
      try {
        const { logCrash } = await import("@/features/core/utils/crash-reporter");
        await logCrash(err instanceof Error ? err : new Error(String(err)), "/migrations");
      } catch { /* ignore secondary crash */ }
    }

    try {
      const { startBackupScheduler } = await import("@/features/admin/utils/backup-scheduler");
      startBackupScheduler();
    } catch (err) {
      console.error("[instrumentation] Failed to start backup scheduler:", err);
    }

    try {
      const { startDbMaintenanceScheduler } = await import("@/features/admin/utils/db-maintenance-scheduler");
      startDbMaintenanceScheduler();
    } catch (err) {
      console.error("[instrumentation] Failed to start DB maintenance scheduler:", err);
    }

    try {
      const { seedAdminUser, seedStatistics, seedSiteSettings } = await import("@/features/core/utils/seed");
      await seedSiteSettings();
      await seedAdminUser();
      await seedStatistics();
    } catch (err) {
      console.error("[instrumentation] Failed to seed admin user or statistics:", err);
      try {
        const { logCrash } = await import("@/features/core/utils/crash-reporter");
        await logCrash(err instanceof Error ? err : new Error(String(err)), "/seed");
      } catch { /* ignore secondary crash */ }
    }
  }
}

export async function onRequestError(
  error: Error & { digest?: string },
  request: { url?: string; method?: string; headers?: Record<string, string> },
  context: { routerKind?: string; routerPath?: string; routePath?: string }
) {
  const digest = error?.digest || "";
  const errorMessage = error?.message || String(error);
  
  // Ignore Next.js internal bailout errors
  if (
    digest === "DYNAMIC_SERVER_USAGE" || 
    digest === "NEXT_REDIRECT" || 
    digest === "NEXT_NOT_FOUND" ||
    errorMessage.includes("DYNAMIC_SERVER_USAGE")
  ) {
    return;
  }

  // Log unstripped error to standard error
  console.error(`[Server Error] ${context?.routerKind} (${context?.routerPath || request?.url}):`, errorMessage);
  if (error.stack) {
    console.error(error.stack);
  }

  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { logCrash } = await import("@/features/core/utils/crash-reporter");
      await logCrash(
        error,
        context?.routerPath || request?.url || "unknown",
        undefined,
        { context, requestUrl: request?.url, requestMethod: request?.method }
      );
    } catch (err) {
      console.error("[onRequestError] Failed to log crash to DB:", err);
    }
  }
}
