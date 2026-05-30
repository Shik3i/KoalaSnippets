"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalStorageState } from "../hooks/use-local-storage-state";
import { SaveToSnippetButton } from "./save-to-snippet-button";


export function UuidTool() {
  const [count, setCount] = useLocalStorageState<number>("koalatools_uuid_count", 1);
  const [format, setFormat] = useLocalStorageState<"plain" | "sql" | "json">("koalatools_uuid_format", "plain");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = () => {
    const uuids: string[] = [];
    for (let i = 0; i < count; i++) uuids.push(crypto.randomUUID());
    if (format === "sql") setOutput(uuids.map((id) => `'${id}'`).join(",\n  ") + ";");
    else if (format === "json") setOutput(JSON.stringify(uuids, null, 2));
    else setOutput(uuids.join("\n"));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Count</label>
          <input
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
            className="w-20 px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Format</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as typeof format)}
            className="px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="plain">Plain Text</option>
            <option value="sql">SQL Values</option>
            <option value="json">JSON Array</option>
          </select>
        </div>
        <Button onClick={generate}>Generate</Button>
      </div>
      {output && (
        <div className="relative animate-in fade-in slide-in-from-bottom-2 duration-200">
          <textarea
            readOnly
            value={output}
            rows={Math.min(20, output.split("\n").length)}
            className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg font-mono text-sm resize-none focus:outline-none"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <SaveToSnippetButton
              code={output}
              language={format === "sql" ? "sql" : format === "json" ? "json" : "text"}
              defaultTitle="generated-uuids"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                await navigator.clipboard.writeText(output);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              aria-label="Copy"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
