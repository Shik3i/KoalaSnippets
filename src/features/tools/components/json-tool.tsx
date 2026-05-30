"use client";

import { useState } from "react";
import { Maximize2, Minimize2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalStorageState } from "../hooks/use-local-storage-state";

export function JsonTool() {
  const [input, setInput] = useLocalStorageState<string>("koalatools_json_input", "");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleBeautify = () => {
    try {
      const p = JSON.parse(input);
      setOutput(JSON.stringify(p, null, 2));
      setError("");
    } catch (e) {
      setError((e as Error).message);
      setOutput("");
    }
  };

  const handleMinify = () => {
    try {
      const p = JSON.parse(input);
      setOutput(JSON.stringify(p));
      setError("");
    } catch (e) {
      setError((e as Error).message);
      setOutput("");
    }
  };

  const handleValidate = () => {
    try {
      const p = JSON.parse(input);
      setOutput(JSON.stringify(p, null, 2));
      setError("");
    } catch (e) {
      setError((e as Error).message);
      setOutput(input);
    }
  };

  return (
    <div className="space-y-4">
      <textarea
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setError("");
          setOutput("");
        }}
        placeholder='{"hello":"world"}'
        className="w-full h-40 px-4 py-3 bg-card border border-border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
      />
      {error && (
        <div className="px-4 py-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-sm text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleBeautify} disabled={!input} className="gap-1.5">
          <Maximize2 size={14} /> Beautify
        </Button>
        <Button onClick={handleMinify} disabled={!input} variant="outline" className="gap-1.5">
          <Minimize2 size={14} /> Minify
        </Button>
        <Button onClick={handleValidate} disabled={!input} variant="ghost">
          Validate
        </Button>
      </div>
      {output && (
        <div className="relative animate-in fade-in slide-in-from-bottom-2 duration-200">
          <textarea
            readOnly
            value={output}
            rows={Math.min(25, output.split("\n").length)}
            className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg font-mono text-sm resize-none focus:outline-none"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={async () => {
              await navigator.clipboard.writeText(output);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="absolute top-2 right-2"
            aria-label="Copy"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </Button>
        </div>
      )}
    </div>
  );
}
