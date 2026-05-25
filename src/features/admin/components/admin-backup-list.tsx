"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, HardDrive } from "lucide-react";

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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(backup.filename)}
                        aria-label={`Download backup ${backup.filename}`}
                      >
                        <Download size={14} suppressHydrationWarning />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
