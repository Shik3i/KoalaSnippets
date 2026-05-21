export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startBackupScheduler } = await import("@/lib/backup-scheduler");
    const { seedAdminUser, seedStatistics } = await import("@/lib/seed");

    startBackupScheduler();
    await seedAdminUser();
    await seedStatistics();
  }
}
