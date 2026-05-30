import { runBackupWithRetention, runWalCheckpoint } from "./backup";
import { cleanupExpiredSessions } from "@/features/auth/utils/session";

const BACKUP_INTERVAL_MS = 6 * 60 * 60 * 1000;

const globalForBackup = globalThis as unknown as {
  backupInterval?: NodeJS.Timeout;
};

export function startBackupScheduler() {
  if (globalForBackup.backupInterval) {
    return;
  }

  console.log("[backup] Starting automated backup scheduler (every 6 hours)");

  try {
    runWalCheckpoint();
    runBackupWithRetention();
    cleanupExpiredSessions().catch(console.error);
  } catch (err) {
    console.error("[backup] Initial backup failed:", err);
  }

  globalForBackup.backupInterval = setInterval(() => {
    try {
      runWalCheckpoint();
      const result = runBackupWithRetention();
      cleanupExpiredSessions().catch(console.error);
      console.log(`[backup] Backup completed: ${result.backupPath} (${result.deleted} old backups removed)`);
    } catch (err) {
      console.error("[backup] Backup failed:", err);
    }
  }, BACKUP_INTERVAL_MS).unref();
}

export function stopBackupScheduler() {
  if (globalForBackup.backupInterval) {
    clearInterval(globalForBackup.backupInterval);
    delete globalForBackup.backupInterval;
    console.log("[backup] Backup scheduler stopped");
  }
}
