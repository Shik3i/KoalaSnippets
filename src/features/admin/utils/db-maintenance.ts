import Database from "better-sqlite3";
import path from "path";

function getDbPath(): string {
  const dbPath = process.env.DATABASE_URL?.replace("file:", "") ?? "./data/koalasnippets.db";
  return path.resolve(process.cwd(), dbPath);
}

export function runVacuum(): { success: boolean; message: string } {
  try {
    const dbPath = getDbPath();
    const db = new Database(dbPath);
    try {
      db.pragma("journal_mode = WAL");
      db.exec("VACUUM");
      return { success: true, message: "VACUUM completed successfully" };
    } finally {
      db.close();
    }
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Unknown error" };
  }
}

export function runAnalyze(): { success: boolean; message: string } {
  try {
    const dbPath = getDbPath();
    const db = new Database(dbPath);
    try {
      db.exec("ANALYZE");
      return { success: true, message: "ANALYZE completed successfully" };
    } finally {
      db.close();
    }
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Unknown error" };
  }
}

export function runIntegrityCheck(): { ok: boolean; message: string } {
  try {
    const dbPath = getDbPath();
    const db = new Database(dbPath);
    try {
      const result = db.pragma("integrity_check") as Array<{ integrity_check: string }>;
      const ok = result.length === 1 && result[0].integrity_check === "ok";
      return { ok, message: ok ? "Database integrity check passed" : result.map(r => r.integrity_check).join(", ") };
    } finally {
      db.close();
    }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Unknown error" };
  }
}

export function runDbMaintenance(): { vacuum: { success: boolean; message: string }; analyze: { success: boolean; message: string }; integrity: { ok: boolean; message: string } } {
  const vacuum = runVacuum();
  const analyze = runAnalyze();
  const integrity = runIntegrityCheck();
  return { vacuum, analyze, integrity };
}
