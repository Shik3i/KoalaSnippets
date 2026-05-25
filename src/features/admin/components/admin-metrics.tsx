"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Users, FileCode, BarChart3, Clock, HardDrive, Calendar } from "lucide-react";

interface LanguageStat {
  language: string;
  count: number;
}

interface MetricsData {
  totalUsersCreated: number;
  totalSnippetsCreated: number;
  dbSize: number;
  uptimeSeconds: number;
  lastBackup: string | null;
  languageBreakdown?: LanguageStat[];
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return `${Math.floor(diff / 60000)}m ago`;
}

export function AdminMetrics() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [metrics, setMetrics] = useState<MetricsData | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then(setMetrics)
      .catch(console.error);
  }, []);

  if (!metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-8 bg-muted/30 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    { icon: Database, label: "Database Size", value: formatBytes(metrics.dbSize), color: "text-primary" },
    { icon: Users, label: "Total Users", value: mounted ? metrics.totalUsersCreated.toLocaleString() : "", color: "text-success" },
    { icon: FileCode, label: "Total Snippets", value: mounted ? metrics.totalSnippetsCreated.toLocaleString() : "", color: "text-info" },
    { icon: Clock, label: "Uptime", value: formatUptime(metrics.uptimeSeconds), color: "text-muted-foreground" },
    { icon: Calendar, label: "Last Backup", value: metrics.lastBackup ? formatRelativeTime(metrics.lastBackup) : "Never", color: metrics.lastBackup ? "text-emerald-400" : "text-amber-400" },
    { icon: HardDrive, label: "DB Path", value: process.env.DATABASE_URL?.replace("file:", "") ?? "./data/koalasnippets.db", color: "text-muted-foreground" },
  ];

  const languageBreakdown = metrics.languageBreakdown ?? [];
  const maxLanguageCount = languageBreakdown.length > 0 ? Math.max(...languageBreakdown.map((l) => l.count)) : 1;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Icon size={16} suppressHydrationWarning />
                  {card.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-xl font-bold truncate ${card.color}`}>{card.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {languageBreakdown.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 size={16} suppressHydrationWarning />
              Most Used Languages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {languageBreakdown.map((lang) => (
                <div key={lang.language} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-muted-foreground w-20 truncate">
                    {lang.language}
                  </span>
                  <div className="flex-1 h-5 bg-muted/50 rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-primary/60 rounded-sm transition-all"
                      style={{ width: `${(lang.count / maxLanguageCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right tabular-nums">
                    {lang.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
