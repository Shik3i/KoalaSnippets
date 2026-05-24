"use client";

import { useState, useMemo } from "react";
import { Diff, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DiffLine {
  type: "same" | "added" | "removed";
  text: string;
  lineNumA?: number;
  lineNumB?: number;
}

function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");

  const m = oldLines.length;
  const n = newLines.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const result: DiffLine[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.unshift({ type: "same", text: oldLines[i - 1], lineNumA: i, lineNumB: j });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: "added", text: newLines[j - 1], lineNumB: j });
      j--;
    } else if (i > 0) {
      result.unshift({ type: "removed", text: oldLines[i - 1], lineNumA: i });
      i--;
    }
  }

  return result;
}

function DiffView({ lines }: { lines: DiffLine[] }) {
  return (
    <div className="font-mono text-xs leading-6 overflow-auto border border-border rounded-lg">
      {lines.map((line, idx) => (
        <div
          key={idx}
          className={`flex ${line.type === "added" ? "bg-emerald-500/10" : line.type === "removed" ? "bg-rose-500/10" : ""}`}
        >
          <span className="w-10 text-right pr-2 text-muted-foreground shrink-0 select-none border-r border-border/50 py-0.5">
            {line.lineNumA ?? ""}
          </span>
          <span className="w-10 text-right pr-2 text-muted-foreground shrink-0 select-none border-r border-border/50 py-0.5">
            {line.lineNumB ?? ""}
          </span>
          <span className={`px-2 py-0.5 flex-1 whitespace-pre ${line.type === "added" ? "text-emerald-600 dark:text-emerald-400" : line.type === "removed" ? "text-rose-600 dark:text-rose-400" : ""}`}>
            {line.type === "added" ? "+ " : line.type === "removed" ? "- " : "  "}
            {line.text || " "}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function DiffCheckerPage() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");

  const diff = useMemo(() => computeDiff(left, right), [left, right]);
  const hasInput = left || right;

  return (
    <div className="flex-1 overflow-auto flex flex-col">
      <div className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full flex flex-col min-h-0">
        <div className="flex items-center gap-3 mb-6 shrink-0">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Diff size={20} className="text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold">Text Diff Checker</h1>
          <Button variant="ghost" size="icon" onClick={() => { setLeft(""); setRight(""); }} disabled={!hasInput} className="ml-auto">
            <ArrowRightLeft size={16} />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4 shrink-0">
          <div>
            <label className="block text-xs text-muted-foreground mb-1 font-medium">Original</label>
            <textarea
              value={left}
              onChange={(e) => setLeft(e.target.value)}
              placeholder="Paste original text here..."
              className="w-full h-40 px-4 py-3 bg-card border border-border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1 font-medium">Modified</label>
            <textarea
              value={right}
              onChange={(e) => setRight(e.target.value)}
              placeholder="Paste modified text here..."
              className="w-full h-40 px-4 py-3 bg-card border border-border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {hasInput && (
          <div className="flex-1 min-h-0 flex flex-col">
            <label className="block text-xs text-muted-foreground mb-1 font-medium shrink-0">
              Diff Result ({diff.filter((d) => d.type !== "same").length} changes)
            </label>
            <div className="flex-1 overflow-auto">
              <DiffView lines={diff} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
