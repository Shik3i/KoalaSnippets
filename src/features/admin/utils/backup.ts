import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const BACKUP_DIR = process.env.BACKUP_DIR ?? path.join(process.cwd(), "backups");

const GFS_RULES = {
  daily: 7,
  weekly: 4,
  monthly: 12,
};

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function getDbPath(): string {
  return process.env.DATABASE_URL?.replace("file:", "") ?? "./data/koalasnippets.db";
}

export function runVacuumBackup(): string {
  ensureBackupDir();

  const dbPath = getDbPath();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}.db`);

  const sourceDb = new Database(dbPath, { readonly: true });
  try {
    sourceDb.prepare(`VACUUM INTO '${backupPath}'`).run();
  } finally {
    sourceDb.close();
  }

  return backupPath;
}

export function parseBackupDate(filename: string): Date {
  const basename = path.basename(filename);
  const dateStr = basename.replace("backup-", "").replace(".db", "");
  const normalized = dateStr.replace(/T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z$/, "T$1:$2:$3.$4Z");
  return new Date(normalized);
}

export function applyGfsRetention(): number {
  ensureBackupDir();
  const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.startsWith("backup-") && f.endsWith(".db"));

  const backups = files
    .map((f) => ({ filename: f, date: parseBackupDate(f) }))
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const toKeep = new Set<string>();
  const now = new Date();

  const dailyBackups: typeof backups = [];
  const weeklyBackups: typeof backups = [];
  const monthlyBackups: typeof backups = [];

  for (const backup of backups) {
    const ageDays = (now.getTime() - backup.date.getTime()) / (1000 * 60 * 60 * 24);

    if (ageDays < 1) {
      if (dailyBackups.length === 0) {
        dailyBackups.push(backup);
      } else {
        const lastKept = dailyBackups[dailyBackups.length - 1];
        if (backup.date.getDate() !== lastKept.date.getDate()) {
          dailyBackups.push(backup);
        }
      }
    }

    const weekNum = getWeekNumber(backup.date);
    if (!weeklyBackups.find((b) => getWeekNumber(b.date) === weekNum && b.date.getFullYear() === backup.date.getFullYear())) {
      weeklyBackups.push(backup);
    }

    const monthKey = `${backup.date.getFullYear()}-${backup.date.getMonth()}`;
    if (!monthlyBackups.find((b) => `${b.date.getFullYear()}-${b.date.getMonth()}` === monthKey)) {
      monthlyBackups.push(backup);
    }
  }

  dailyBackups.slice(0, GFS_RULES.daily).forEach((b) => toKeep.add(b.filename));
  weeklyBackups.slice(0, GFS_RULES.weekly).forEach((b) => toKeep.add(b.filename));
  monthlyBackups.slice(0, GFS_RULES.monthly).forEach((b) => toKeep.add(b.filename));

  let deleted = 0;
  for (const backup of backups) {
    if (!toKeep.has(backup.filename)) {
      fs.unlinkSync(path.join(BACKUP_DIR, backup.filename));
      deleted++;
    }
  }

  return deleted;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function runBackupWithRetention(): { backupPath: string; deleted: number } {
  const backupPath = runVacuumBackup();
  const deleted = applyGfsRetention();
  return { backupPath, deleted };
}
