"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Users, FileCode } from "lucide-react";

interface MetricsData {
  totalUsersCreated: number;
  totalSnippetsCreated: number;
  dbSize: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function AdminMetrics() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then(setMetrics);
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
    { icon: Users, label: "Total Users Created", value: mounted ? metrics.totalUsersCreated.toLocaleString() : "", color: "text-success" },
    { icon: FileCode, label: "Total Snippets Created", value: mounted ? metrics.totalSnippetsCreated.toLocaleString() : "", color: "text-info" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
