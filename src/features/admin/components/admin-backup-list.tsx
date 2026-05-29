"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, HardDrive, RotateCcw, Copy, Check } from "lucide-react";

interface BackupFile {
  filename: string;
  size: number;
  createdAt: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function AdminBackupList() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 0); }, []);
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [restoreFilename, setRestoreFilename] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchBackups = useCallback(() => {
    fetch("/api/admin/backups")
      .then((res) => res.json())
      .then((data) => {
        setBackups(data.backups);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch backups", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const handleTriggerBackup = async () => {
    setTriggering(true);
    try {
      const res = await fetch("/api/admin/backups", { method: "POST" });
      if (res.ok) {
        fetchBackups();
      }
    } catch (err) {
      console.error("Failed to trigger backup", err);
    } finally {
      setTriggering(false);
    }
  };

  const handleDownload = (filename: string) => {
    window.open(`/api/admin/backups?download=${encodeURIComponent(filename)}`, "_blank");
  };

  const getRestoreCommand = (filename: string) => {
    return `# 1. Docker-Container stoppen
docker compose stop koalasnippets

# 2. Backup überschreibt die Live-Datenbank
cp ./backups/${filename} ./data/koalasnippets.db

# 3. Container neu starten
docker compose start koalasnippets`;
  };

  const handleCopyCommand = (filename: string) => {
    navigator.clipboard.writeText(getRestoreCommand(filename));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-10 bg-muted/30 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Backups ({backups.length})</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleTriggerBackup}
          disabled={triggering}
          aria-label="Trigger manual backup"
        >
          <RefreshCw size={14} className={triggering ? "animate-spin" : ""} suppressHydrationWarning />
          {triggering ? "Backing up..." : "Manual Backup"}
        </Button>
      </CardHeader>
      <CardContent>
        {backups.length === 0 ? (
          <div className="flex items-center gap-2 text-muted-foreground py-4">
            <HardDrive size={16} suppressHydrationWarning />
            <span className="text-sm">No backups yet. Trigger one manually or wait for the automated scheduler.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2 px-3 font-medium">Filename</th>
                  <th className="text-left py-2 px-3 font-medium">Size</th>
                  <th className="text-left py-2 px-3 font-medium">Created</th>
                  <th className="text-right py-2 px-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup) => (
                  <tr key={backup.filename} className="border-b border-border/50">
                    <td className="py-2.5 px-3 font-mono text-xs">{backup.filename}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{formatBytes(backup.size)}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {mounted ? new Date(backup.createdAt).toLocaleString() : ""}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(backup.filename)}
                          aria-label={`Download backup ${backup.filename}`}
                        >
                          <Download size={14} suppressHydrationWarning />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setRestoreFilename(restoreFilename === backup.filename ? null : backup.filename)}
                          aria-label={`Restore backup ${backup.filename}`}
                        >
                          <RotateCcw size={14} suppressHydrationWarning />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {restoreFilename && (
          <div className="mt-4 p-4 rounded-lg border border-border bg-muted/30 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <RotateCcw size={14} className="text-primary" suppressHydrationWarning />
                Restore: {restoreFilename}
              </h4>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyCommand(restoreFilename)}
                  className="gap-1.5"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? "Copied!" : "Copy Command"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setRestoreFilename(null)}
                  aria-label="Close"
                >
                  ×
                </Button>
              </div>
            </div>
            <pre className="text-xs font-mono text-emerald-400 bg-black/40 p-3 rounded overflow-x-auto leading-relaxed border border-emerald-500/10 whitespace-pre">
              {getRestoreCommand(restoreFilename)}
            </pre>
            <p className="text-[11px] text-muted-foreground">
              Führe diesen Befehl auf dem Server aus, wo auch die Docker-Compose-Datei liegt. Das aktuelle Backup wird automatisch vor der Überschreibung erstellt.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
