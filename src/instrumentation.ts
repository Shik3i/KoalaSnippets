

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
    }

    try {
      const { startBackupScheduler } = await import("@/features/admin/utils/backup-scheduler");
      startBackupScheduler();
    } catch (err) {
      console.error("[instrumentation] Failed to start backup scheduler:", err);
    }

    try {
      const { seedAdminUser, seedStatistics } = await import("@/features/core/utils/seed");
      await seedAdminUser();
      await seedStatistics();
    } catch (err) {
      console.error("[instrumentation] Failed to seed admin user or statistics:", err);
    }
  }
}
