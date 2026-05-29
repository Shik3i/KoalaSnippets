"use client";

import { useState, useMemo, useEffect } from "react";
import { Diff, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DiffLine {
  type: "same" | "added" | "removed";
  text: string;
  lineNumA?: number;
  lineNumB?: number;
}

function lcsLength(X: string[], Y: string[]): number[] {
  const m = X.length;
  const n = Y.length;
  let prevRow = new Array(n + 1).fill(0);
  let currRow = new Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    const temp = prevRow;
    prevRow = currRow;
    currRow = temp;
    currRow[0] = 0;

    for (let j = 1; j <= n; j++) {
      if (X[i - 1] === Y[j - 1]) {
        currRow[j] = prevRow[j - 1] + 1;
      } else {
        currRow[j] = Math.max(prevRow[j], currRow[j - 1]);
      }
    }
  }
  return currRow;
}

function hirschberg(X: string[], Y: string[], offsetI: number = 0, offsetJ: number = 0): DiffLine[] {
  const m = X.length;
  const n = Y.length;

  if (m === 0) {
    return Y.map((item, index) => ({ type: "added" as const, text: item, lineNumB: offsetJ + index + 1 }));
  } else if (n === 0) {
    return X.map((item, index) => ({ type: "removed" as const, text: item, lineNumA: offsetI + index + 1 }));
  } else if (m === 1) {
    const index = Y.indexOf(X[0]);
    if (index !== -1) {
      const addedBefore = Y.slice(0, index).map((item, idx) => ({ type: "added" as const, text: item, lineNumB: offsetJ + idx + 1 }));
      const same = [{ type: "same" as const, text: X[0], lineNumA: offsetI + 1, lineNumB: offsetJ + index + 1 }];
      const addedAfter = Y.slice(index + 1).map((item, idx) => ({ type: "added" as const, text: item, lineNumB: offsetJ + index + 2 + idx }));
      return [...addedBefore, ...same, ...addedAfter];
    } else {
      const removed = [{ type: "removed" as const, text: X[0], lineNumA: offsetI + 1 }];
      const added = Y.map((item, idx) => ({ type: "added" as const, text: item, lineNumB: offsetJ + idx + 1 }));
      return [...removed, ...added];
    }
  }

  const xMid = Math.floor(m / 2);
  const scoreL = lcsLength(X.slice(0, xMid), Y);
  const scoreR = lcsLength(X.slice(xMid).reverse(), Y.slice().reverse());

  let yMid = 0;
  let maxScore = -1;
  for (let j = 0; j <= n; j++) {
    const score = scoreL[j] + scoreR[n - j];
    if (score > maxScore) {
      maxScore = score;
      yMid = j;
    }
  }

  return [
    ...hirschberg(X.slice(0, xMid), Y.slice(0, yMid), offsetI, offsetJ),
    ...hirschberg(X.slice(xMid), Y.slice(yMid), offsetI + xMid, offsetJ + yMid)
  ];
}

function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  return hirschberg(oldLines, newLines);
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
  const [debouncedLeft, setDebouncedLeft] = useState("");
  const [debouncedRight, setDebouncedRight] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedLeft(left);
      setDebouncedRight(right);
    }, 200);

    return () => {
      clearTimeout(handler);
    };
  }, [left, right]);

  const diff = useMemo(() => computeDiff(debouncedLeft, debouncedRight), [debouncedLeft, debouncedRight]);
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
