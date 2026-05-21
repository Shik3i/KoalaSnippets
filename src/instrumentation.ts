export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
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
