import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { requireAdmin } from "@/features/admin/utils/admin-guard";
import { verifyCsrf } from "@/features/core/utils/security";
import { runBackupWithRetention, parseBackupDate } from "@/features/admin/utils/backup";

export const dynamic = "force-dynamic";

const BACKUP_DIR = process.env.BACKUP_DIR ?? path.join(process.cwd(), "backups");

interface BackupEntry {
  filename: string;
  size: number;
  createdAt: string;
}

export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if ("unauthorized" in guard) return guard.unauthorized;
  if ("forbidden" in guard) return guard.forbidden;

  const { searchParams } = new URL(request.url);
  const downloadFile = searchParams.get("download");

  if (downloadFile) {
    const safeName = path.basename(downloadFile);
    if (safeName !== downloadFile || !safeName.startsWith("backup-") || !safeName.endsWith(".db")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const filePath = path.join(BACKUP_DIR, safeName);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Backup not found" }, { status: 404 });
    }

    const resolved = path.resolve(filePath);
    const resolvedDir = path.resolve(BACKUP_DIR);
    if (!resolved.startsWith(resolvedDir)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const buffer = fs.readFileSync(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "Content-Length": String(buffer.length),
      },
    });
  }

  if (!fs.existsSync(BACKUP_DIR)) {
    return NextResponse.json({ backups: [] });
  }

  const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.startsWith("backup-") && f.endsWith(".db"));
  const backups: BackupEntry[] = files
    .map((filename) => {
      const filePath = path.join(BACKUP_DIR, filename);
      const stat = fs.statSync(filePath);
      let createdAt = stat.birthtime.toISOString();
      try {
        const parsed = parseBackupDate(filename);
        if (!isNaN(parsed.getTime())) {
          createdAt = parsed.toISOString();
        }
      } catch {
        // use file birthtime as fallback
      }
      return {
        filename,
        size: stat.size,
        createdAt,
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({ backups });
}

export async function POST(request: Request) {
  if (!verifyCsrf(request)) {
    return NextResponse.json({ error: "Invalid CSRF token or Origin" }, { status: 403 });
  }

  const guard = await requireAdmin(request);
  if ("unauthorized" in guard) return guard.unauthorized;
  if ("forbidden" in guard) return guard.forbidden;

  try {
    const result = runBackupWithRetention();
    return NextResponse.json({
      success: true,
      message: `Backup created: ${path.basename(result.backupPath)}`,
      deleted: result.deleted,
    });
  } catch (error) {
    console.error("[Admin Backups API Error]", error);
    return NextResponse.json({ error: "Backup failed" }, { status: 500 });
  }
}
