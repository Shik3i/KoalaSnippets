"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useLocalStorageState } from "../hooks/use-local-storage-state";

export function TimestampTool() {
  const [input, setInput] = useLocalStorageState<string>("koalatools_ts_input", "");
  const [mode, setMode] = useLocalStorageState<"to-date" | "to-ts">("koalatools_ts_mode", "to-date");

  const result = useMemo(() => {
    if (!input.trim()) return null;
    if (mode === "to-date") {
      const ts = parseInt(input, 10);
      if (isNaN(ts)) return { error: "Invalid timestamp" };
      const ms = ts.toString().length <= 10 ? ts * 1000 : ts;
      const date = new Date(ms);
      if (isNaN(date.getTime())) return { error: "Invalid date" };
      return {
        iso: date.toISOString(),
        local: date.toLocaleString(),
        utc: date.toUTCString(),
        seconds: Math.floor(ms / 1000),
        milliseconds: ms,
      };
    } else {
      const date = new Date(input);
      if (isNaN(date.getTime())) return { error: "Invalid date string" };
      return {
        seconds: Math.floor(date.getTime() / 1000),
        milliseconds: date.getTime(),
        iso: date.toISOString(),
        local: date.toLocaleString(),
        utc: date.toUTCString(),
      };
    }
  }, [input, mode]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant={mode === "to-date" ? "default" : "outline"} size="sm" onClick={() => setMode("to-date")}>
          Timestamp → Date
        </Button>
        <Button variant={mode === "to-ts" ? "default" : "outline"} size="sm" onClick={() => setMode("to-ts")}>
          Date → Timestamp
        </Button>
      </div>
      <div>
        <label className="block text-xs text-muted-foreground mb-1">
          {mode === "to-date" ? "Unix Timestamp (sec or ms)" : "Date String (ISO, locale, etc.)"}
        </label>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === "to-date" ? "1700000000" : "2024-01-15T10:30:00Z"}
          className="w-full px-3 py-2 bg-card border border-border rounded-lg font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      {result && "error" in result && (
        <div className="px-3 py-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-sm text-rose-400">
          {result.error}
        </div>
      )}
      {result && !("error" in result) && (
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {"seconds" in result && (
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-muted/50 border border-border rounded-lg">
                <div className="text-[10px] text-muted-foreground uppercase">Unix (seconds)</div>
                <div className="font-mono text-sm mt-1">{result.seconds}</div>
              </div>
              <div className="p-3 bg-muted/50 border border-border rounded-lg">
                <div className="text-[10px] text-muted-foreground uppercase">Unix (milliseconds)</div>
                <div className="font-mono text-sm mt-1">{result.milliseconds}</div>
              </div>
            </div>
          )}
          {"iso" in result && (
            <div className="p-3 bg-muted/50 border border-border rounded-lg">
              <div className="text-[10px] text-muted-foreground uppercase">ISO 8601</div>
              <div className="font-mono text-sm mt-1">{result.iso}</div>
            </div>
          )}
          {"local" in result && (
            <div className="p-3 bg-muted/50 border border-border rounded-lg">
              <div className="text-[10px] text-muted-foreground uppercase">Local Time</div>
              <div className="font-mono text-sm mt-1">{result.local}</div>
            </div>
          )}
          {"utc" in result && (
            <div className="p-3 bg-muted/50 border border-border rounded-lg">
              <div className="text-[10px] text-muted-foreground uppercase">UTC</div>
              <div className="font-mono text-sm mt-1">{result.utc}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
