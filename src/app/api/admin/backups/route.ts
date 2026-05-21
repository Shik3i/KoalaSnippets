import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { requireAdmin } from "@/lib/admin-guard";
import { runVacuumBackup } from "@/lib/backup";

const BACKUP_DIR = process.env.BACKUP_DIR ?? path.join(process.cwd(), "backups");

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if ("unauthorized" in guard) return guard.unauthorized;
  if ("forbidden" in guard) return guard.forbidden;

  const url = new URL(request.url);
  const download = url.searchParams.get("download");

  if (download) {
    const filePath = path.join(BACKUP_DIR, download);
    const resolved = path.resolve(filePath);
    const resolvedDir = path.resolve(BACKUP_DIR);

    if (!resolved.startsWith(resolvedDir)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    if (!fs.existsSync(resolved)) {
      return NextResponse.json({ error: "Backup not found" }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(resolved);
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${download}"`,
      },
    });
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
