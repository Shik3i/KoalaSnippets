import { NextResponse } from "next/server";
import { requireAdmin } from "@/features/admin/utils/admin-guard";
import { runBackupWithRetention } from "@/features/admin/utils/backup";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const BACKUP_DIR = process.env.BACKUP_DIR ?? path.join(process.cwd(), "backups");

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if ("unauthorized" in guard) return guard.unauthorized;
  if ("forbidden" in guard) return guard.forbidden;

  const { searchParams } = new URL(request.url);
  const download = searchParams.get("download");

  if (download) {
    const sanitized = path.basename(download);
    if (sanitized !== download || !sanitized.startsWith("backup-") || !sanitized.endsWith(".db")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const filePath = path.join(BACKUP_DIR, sanitized);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Backup not found" }, { status: 404 });
    }

    const stat = fs.statSync(filePath);
    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${sanitized}"`,
        "Content-Length": String(stat.size),
      },
    });
  }

  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      return NextResponse.json({ backups: [] });
    }

    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith("backup-") && f.endsWith(".db"))
      .map((f) => {
        const filePath = path.join(BACKUP_DIR, f);
        const stat = fs.statSync(filePath);
        return {
          filename: f,
          size: stat.size,
          sizeFormatted: formatBytes(stat.size),
          createdAt: stat.birthtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ backups: files });
  } catch (error) {
    console.error("[Backups API Error]", error);
    return NextResponse.json({ error: "Failed to list backups" }, { status: 500 });
  }
}

export async function POST() {
  const guard = await requireAdmin();
  if ("unauthorized" in guard) return guard.unauthorized;
  if ("forbidden" in guard) return guard.forbidden;

  try {
    const { backupPath, deleted } = runBackupWithRetention();
    return NextResponse.json({
      success: true,
      backupPath,
      deleted,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Backups API Error]", message);
    return NextResponse.json({ error: "Failed to create backup", details: message }, { status: 500 });
  }
}
