"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Check, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UuidGeneratorPage() {
  const [count, setCount] = useState(1);
  const [format, setFormat] = useState<"plain" | "sql" | "json">("plain");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = () => {
    const uuids: string[] = [];
    for (let i = 0; i < count; i++) {
      uuids.push(crypto.randomUUID());
    }
    if (format === "sql") {
      setOutput(uuids.map((id) => `'${id}'`).join(",\n  ") + ";");
    } else if (format === "json") {
      setOutput(JSON.stringify(uuids, null, 2));
    } else {
      setOutput(uuids.join("\n"));
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="border-b border-border p-4">
        <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={14} /> Back to Tools
        </Link>
      </div>
      <div className="flex-1 p-6 md:p-8 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <Fingerprint size={20} className="text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold">UUID Generator</h1>
        </div>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Count</label>
              <input type="number" min={1} max={100} value={count} onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))} className="w-20 px-3 py-2 bg-card border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Format</label>
              <select value={format} onChange={(e) => setFormat(e.target.value as typeof format)} className="px-3 py-2 bg-card border border-border rounded-lg text-sm">
                <option value="plain">Plain Text</option>
                <option value="sql">SQL Values</option>
                <option value="json">JSON Array</option>
              </select>
            </div>
            <Button onClick={generate}>Generate</Button>
          </div>
          {output && (
            <div className="relative">
              <textarea readOnly value={output} rows={Math.min(20, output.split("\n").length)} className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg font-mono text-sm resize-none" />
              <Button variant="ghost" size="icon" onClick={handleCopy} className="absolute top-2 right-2" aria-label="Copy">
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
