"use client";

import { useMemo } from "react";
import { useLocalStorageState } from "../hooks/use-local-storage-state";

export function RegexTool() {
  const [pattern, setPattern] = useLocalStorageState<string>("koalatools_regex_pattern", "");
  const [flags, setFlags] = useLocalStorageState<string>("koalatools_regex_flags", "gi");
  const [testString, setTestString] = useLocalStorageState<string>("koalatools_regex_test_string", "");

  const regexResult = useMemo(() => {
    if (!pattern || !testString) return { matches: [] as { match: string; index: number }[], error: "", valid: false };
    try {
      const regex = new RegExp(pattern, flags);
      const matches = [...testString.matchAll(regex)].map((m) => ({ match: m[0], index: m.index! }));
      return { matches, error: "", valid: true };
    } catch (e) {
      return { matches: [] as { match: string; index: number }[], error: (e as Error).message, valid: false };
    }
  }, [pattern, flags, testString]);

  const highlighted = useMemo(() => {
    if (!pattern || !testString || regexResult.error) return testString;
    try {
      const regex = new RegExp(pattern, flags);
      const parts: { text: string; isMatch: boolean }[] = [];
      let lastIndex = 0;
      for (const m of testString.matchAll(regex)) {
        if (m.index! > lastIndex) parts.push({ text: testString.slice(lastIndex, m.index!), isMatch: false });
        parts.push({ text: m[0], isMatch: true });
        lastIndex = m.index! + m[0].length;
      }
      if (lastIndex < testString.length) parts.push({ text: testString.slice(lastIndex), isMatch: false });
      return parts;
    } catch {
      return testString;
    }
  }, [pattern, flags, testString, regexResult.error]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-xs text-muted-foreground mb-1 font-medium">Pattern</label>
          <input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="[a-z]+"
            className="w-full px-3 py-2 bg-card border border-border rounded-lg font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="w-24">
          <label className="block text-xs text-muted-foreground mb-1 font-medium">Flags</label>
          <input
            value={flags}
            onChange={(e) => setFlags(e.target.value.replace(/[^gimsuy]/g, ""))}
            placeholder="gi"
            className="w-full px-3 py-2 bg-card border border-border rounded-lg font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
      {regexResult.error && (
        <div className="px-3 py-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-sm text-rose-400">
          {regexResult.error}
        </div>
      )}
      <div>
        <label className="block text-xs text-muted-foreground mb-1 font-medium">Test String</label>
        <textarea
          value={testString}
          onChange={(e) => setTestString(e.target.value)}
          placeholder="Enter text to test against..."
          className="w-full h-32 px-4 py-3 bg-card border border-border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      {pattern && testString && !regexResult.error && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm">
            <span className="text-muted-foreground">
              {regexResult.matches.length} match{regexResult.matches.length !== 1 ? "es" : ""} found
            </span>
          </div>
          <div className="px-4 py-3 bg-muted/50 border border-border rounded-lg font-mono text-sm whitespace-pre-wrap break-all leading-relaxed max-h-60 overflow-auto">
            {Array.isArray(highlighted) ? (
              highlighted.map((part, i) => (
                <span
                  key={i}
                  className={part.isMatch ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded px-0.5" : ""}
                >
                  {part.text}
                </span>
              ))
            ) : (
              <span>{testString}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
