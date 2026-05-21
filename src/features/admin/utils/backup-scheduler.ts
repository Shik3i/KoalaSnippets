import { runBackupWithRetention } from "./backup";

const BACKUP_INTERVAL_MS = 6 * 60 * 60 * 1000;

let backupInterval: NodeJS.Timeout | null = null;

export function startBackupScheduler() {
  if (backupInterval) {
    return;
  }

  console.log("[backup] Starting automated backup scheduler (every 6 hours)");

  try {
    runBackupWithRetention();
  } catch (err) {
    console.error("[backup] Initial backup failed:", err);
  }

  backupInterval = setInterval(() => {
    try {
      const result = runBackupWithRetention();
      console.log(`[backup] Backup completed: ${result.backupPath} (${result.deleted} old backups removed)`);
    } catch (err) {
      console.error("[backup] Backup failed:", err);
    }
  }, BACKUP_INTERVAL_MS);
}

export function stopBackupScheduler() {
  if (backupInterval) {
    clearInterval(backupInterval);
    backupInterval = null;
    console.log("[backup] Backup scheduler stopped");
  }
}
