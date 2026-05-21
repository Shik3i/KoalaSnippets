export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startBackupScheduler } = await import("@/features/admin/utils/backup-scheduler");
    const { seedAdminUser, seedStatistics } = await import("@/features/core/utils/seed");

    startBackupScheduler();
    await seedAdminUser();
    await seedStatistics();
  }
}
