import { runDbMaintenance } from "./db-maintenance";

const MAINTENANCE_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

let maintenanceInterval: NodeJS.Timeout | null = null;

export function startDbMaintenanceScheduler() {
  if (maintenanceInterval) {
    return;
  }

  console.log("[db-maintenance] Starting automated DB maintenance scheduler (weekly)");

  try {
    const result = runDbMaintenance();
    const status = [
      result.vacuum.success ? "VACUUM OK" : `VACUUM FAIL: ${result.vacuum.message}`,
      result.analyze.success ? "ANALYZE OK" : `ANALYZE FAIL: ${result.analyze.message}`,
      result.integrity.ok ? "INTEGRITY OK" : `INTEGRITY FAIL: ${result.integrity.message}`,
    ].join(" | ");
    console.log(`[db-maintenance] Initial maintenance completed: ${status}`);
  } catch (err) {
    console.error("[db-maintenance] Initial maintenance failed:", err);
  }

  maintenanceInterval = setInterval(() => {
    try {
      const result = runDbMaintenance();
      const status = [
        result.vacuum.success ? "VACUUM OK" : `VACUUM FAIL: ${result.vacuum.message}`,
        result.analyze.success ? "ANALYZE OK" : `ANALYZE FAIL: ${result.analyze.message}`,
        result.integrity.ok ? "INTEGRITY OK" : `INTEGRITY FAIL: ${result.integrity.message}`,
      ].join(" | ");
      console.log(`[db-maintenance] Weekly maintenance completed: ${status}`);
    } catch (err) {
      console.error("[db-maintenance] Maintenance failed:", err);
    }
  }, MAINTENANCE_INTERVAL_MS).unref();
}

export function stopDbMaintenanceScheduler() {
  if (maintenanceInterval) {
    clearInterval(maintenanceInterval);
    maintenanceInterval = null;
    console.log("[db-maintenance] Maintenance scheduler stopped");
  }
}
