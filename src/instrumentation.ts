

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      console.log("[db] Running automated database migrations...");
      const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
      const { db } = await import("@/db");

      const { sql } = await import("drizzle-orm");
      const { snippets: s } = await import("@/db/schema");
      const before = db.select({ c: sql`count(*)` }).from(s).get() as { c: number };
      console.log(`[debug] Before migration: ${before.c} snippets`);

      migrate(db, { migrationsFolder: "./src/db/migrations" });
      console.log("[db] Database migrations applied successfully.");

      const after = db.select({ c: sql`count(*)` }).from(s).get() as { c: number };
      console.log(`[debug] After migration: ${after.c} snippets`);
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
  
  if (
    digest === "NEXT_REDIRECT" || 
    digest === "NEXT_NOT_FOUND"
  ) {
    return;
  }

  const route = context?.routerPath || request?.url || "unknown";
  const routerKind = context?.routerKind || "unknown";

  console.error(`[Server Error] ${routerKind} (${route}):`, errorMessage);
  if (error.stack) {
    console.error(error.stack);
  }

  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { logErrorToFile } = await import("@/features/core/utils/file-logger");
      logErrorToFile(error, `onRequestError:${routerKind}`, {
        route,
        digest,
        requestMethod: request?.method,
        requestUrl: request?.url,
      });
    } catch { /* ignore file logger errors */ }

    try {
      const { logCrash } = await import("@/features/core/utils/crash-reporter");
      await logCrash(
        error,
        route,
        undefined,
        { context, requestUrl: request?.url, requestMethod: request?.method, digest }
      );
    } catch (err) {
      console.error("[onRequestError] Failed to log crash to DB:", err);
    }
  }
}
