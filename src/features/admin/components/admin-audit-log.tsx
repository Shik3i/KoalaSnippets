"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AutocompleteSearch } from "./AutocompleteSearch";
import { Calendar, User, Activity, Clock } from "lucide-react";

interface AuditLogEntry {
  id: string;
  userId: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "RESTORE" | "LOGIN" | "LOGOUT";
  targetType: "SNIPPET" | "COLLECTION" | "USER" | "SETTINGS";
  targetId: string | null;
  details: string | null;
  createdAt: string;
  username: string;
}

export function AdminAuditLog() {
  const [mounted, setMounted] = useState(false);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    setTimeout(() => setMounted(true), 0);
  }, []);

  const fetchLogs = useCallback((userId: string | null = null, signal?: AbortSignal) => {
    setLoading(true);
    const url = userId 
      ? `/api/admin/audit-logs?userId=${encodeURIComponent(userId)}` 
      : "/api/admin/audit-logs";

    fetch(url, { signal })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        setLogs(data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        console.error("Failed to fetch audit logs:", err);
        setLogs([]);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    fetchLogs(selectedUserId, abortController.signal);
    return () => abortController.abort();
  }, [selectedUserId, fetchLogs]);

  const handleSelectUser = (userId: string | null) => {
    setSelectedUserId(userId);
  };

  const getActionBadge = (action: AuditLogEntry["action"]) => {
    switch (action) {
      case "CREATE":
        return <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs">CREATE</Badge>;
      case "UPDATE":
        return <Badge className="bg-sky-500/10 text-sky-500 border border-sky-500/20 text-xs">UPDATE</Badge>;
      case "DELETE":
        return <Badge className="bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs">DELETE</Badge>;
      case "RESTORE":
        return <Badge className="bg-teal-500/10 text-teal-500 border border-teal-500/20 text-xs">RESTORE</Badge>;
      case "LOGIN":
        return <Badge className="bg-violet-500/10 text-violet-500 border border-violet-500/20 text-xs">LOGIN</Badge>;
      case "LOGOUT":
        return <Badge className="bg-muted text-muted-foreground border border-border text-xs">LOGOUT</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const getTargetEmoji = (targetType: AuditLogEntry["targetType"]) => {
    switch (targetType) {
      case "SNIPPET":
        return "📄";
      case "COLLECTION":
        return "📁";
      case "USER":
        return "👤";
      case "SETTINGS":
        return "⚙️";
      default:
        return "📝";
    }
  };

  return (
    <Card className="border border-border/50 bg-card/60 backdrop-blur-xl shadow-lg">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity size={18} className="text-primary" suppressHydrationWarning />
            User Action Audit Logs
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor real-time creations, deletions, updates, and login sessions.
          </p>
        </div>
        <AutocompleteSearch onSelectUser={handleSelectUser} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted/20 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Clock size={36} className="mb-2 opacity-40" suppressHydrationWarning />
            <p className="text-sm">No action logs found for this filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground text-[11px] uppercase tracking-wider font-bold">
                  <th className="text-left py-3 px-3 font-semibold">User</th>
                  <th className="text-left py-3 px-3 font-semibold">Action</th>
                  <th className="text-left py-3 px-3 font-semibold">Target</th>
                  <th className="text-left py-3 px-3 font-semibold">Details</th>
                  <th className="text-right py-3 px-3 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/5 transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-primary">
                      <span className="flex items-center gap-1.5">
                        <User size={12} className="text-muted-foreground/60" suppressHydrationWarning />
                        @{log.username}
                      </span>
                    </td>
                    <td className="py-3 px-3">{getActionBadge(log.action)}</td>
                    <td className="py-3 px-3">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                        {getTargetEmoji(log.targetType)} {log.targetType}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-foreground max-w-xs sm:max-w-sm md:max-w-md truncate">
                      {log.details}
                    </td>
                    <td className="py-3 px-3 text-right text-xs text-muted-foreground font-mono">
                      <span className="flex items-center justify-end gap-1.5">
                        <Calendar size={12} className="opacity-50" suppressHydrationWarning />
                        {mounted ? new Date(log.createdAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" }) : ""}
                      </span>
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
