import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { requireAdmin } from "@/features/admin/utils/admin-guard";
import { runVacuumBackup } from "@/features/admin/utils/backup";

export const dynamic = "force-dynamic";

const BACKUP_DIR = process.env.BACKUP_DIR ?? path.join(process.cwd(), "backups");

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if ("unauthorized" in guard) return guard.unauthorized;
  if ("forbidden" in guard) return guard.forbidden;

  const url = new URL(request.url);
  const download = url.searchParams.get("download");

  if (download) {
    try {
      const filePath = path.join(BACKUP_DIR, download);
      const resolved = path.resolve(filePath);
      const resolvedDir = path.resolve(BACKUP_DIR);
      const resolvedDirWithSep = resolvedDir.endsWith(path.sep) ? resolvedDir : resolvedDir + path.sep;

      if (!resolved.startsWith(resolvedDirWithSep) && resolved !== resolvedDir) {
        return NextResponse.json({ error: "Invalid path" }, { status: 400 });
      }

      if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
        return NextResponse.json({ error: "Backup not found" }, { status: 404 });
      }

      const fileStream = fs.createReadStream(resolved);
      return new NextResponse(fileStream as unknown as ReadableStream, {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="${download}"`,
        },
      });
    } catch {
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }

  if (!fs.existsSync(BACKUP_DIR)) {
    return NextResponse.json({ backups: [] });
  }

  const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.startsWith("backup-") && f.endsWith(".db"));
  const backups = files.map((f) => {
    const stat = fs.statSync(path.join(BACKUP_DIR, f));
    return {
      filename: f,
      size: stat.size,
      createdAt: stat.birthtime.toISOString(),
    };
  });

  return NextResponse.json({ backups });
}

export async function POST() {
  const guard = await requireAdmin();
  if ("unauthorized" in guard) return guard.unauthorized;
  if ("forbidden" in guard) return guard.forbidden;

  try {
    const backupPath = runVacuumBackup();
    return NextResponse.json({ success: true, backupPath });
  } catch {
    return NextResponse.json({ error: "Backup failed" }, { status: 500 });
  }
}
