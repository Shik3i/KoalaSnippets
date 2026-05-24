"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bug, Trash2, Clock, User, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";

interface CrashReport {
  id: string;
  errorMessage: string;
  stackTrace: string | null;
  userId: string | null;
  route: string | null;
  metadata: string | null;
  createdAt: string;
  username: string | null;
}

export function AdminCrashReports() {
  const [mounted, setMounted] = useState(false);
  const [reports, setReports] = useState<CrashReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 0);
  }, []);

  const fetchReports = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/crash-reports")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setReports(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch crash reports:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReports();
  }, [fetchReports]);

  const handleClearAll = async () => {
    if (!confirm("Delete all crash reports? This cannot be undone.")) return;
    setClearing(true);
    try {
      const res = await fetch("/api/admin/crash-reports", { method: "DELETE" });
      if (res.ok) {
        setReports([]);
      }
    } catch (err) {
      console.error("Failed to clear crash reports:", err);
    } finally {
      setClearing(false);
    }
  };

  return (
    <Card className="border border-border/50 bg-card/60 backdrop-blur-xl shadow-lg">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bug size={18} className="text-rose-400" suppressHydrationWarning />
            Crash Reports
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            System errors logged from error boundaries and server-side failures.
          </p>
        </div>
        {reports.length > 0 && (
          <Button variant="destructive" size="sm" onClick={handleClearAll} disabled={clearing} className="gap-1.5">
            <Trash2 size={14} suppressHydrationWarning />
            {clearing ? "Clearing..." : "Clear All"}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted/20 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <AlertTriangle size={36} className="mb-2 opacity-40" suppressHydrationWarning />
            <p className="text-sm">No crash reports recorded.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reports.map((report) => (
              <div
                key={report.id}
                className="rounded-lg border border-border/50 bg-muted/10 overflow-hidden"
              >
                <button
                  className="w-full text-left p-3 flex items-start gap-3 hover:bg-muted/20 transition-colors"
                  onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
                >
                  <Bug size={16} className="text-rose-400 mt-0.5 shrink-0" suppressHydrationWarning />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-mono text-foreground truncate">
                      {report.errorMessage}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                      {report.route && <span>{report.route}</span>}
                      {report.username && (
                        <span className="flex items-center gap-1">
                          <User size={10} suppressHydrationWarning />
                          @{report.username}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock size={10} suppressHydrationWarning />
                        {mounted ? new Date(report.createdAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" }) : ""}
                      </span>
                    </div>
                  </div>
                  {expandedId === report.id ? (
                    <ChevronDown size={14} className="text-muted-foreground shrink-0" suppressHydrationWarning />
                  ) : (
                    <ChevronRight size={14} className="text-muted-foreground shrink-0" suppressHydrationWarning />
                  )}
                </button>
                {expandedId === report.id && report.stackTrace && (
                  <div className="px-3 pb-3">
                    <pre className="bg-background/80 rounded-md p-3 text-[10px] font-mono text-muted-foreground overflow-x-auto max-h-60 whitespace-pre-wrap break-all">
                      {report.stackTrace}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
