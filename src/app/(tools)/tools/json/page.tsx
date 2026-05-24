"use client";

import { useState } from "react";
import { Copy, Check, Braces, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function JsonFormatterPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleBeautify = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
      setError("");
    } catch (e) {
      setError((e as Error).message);
      setOutput("");
    }
  };

  const handleMinify = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setError("");
    } catch (e) {
      setError((e as Error).message);
      setOutput("");
    }
  };

  const handleValidate = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
      setError("");
    } catch (e) {
      setError((e as Error).message);
      setOutput(input);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 md:p-8 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <Braces size={20} className="text-orange-400" />
          </div>
          <h1 className="text-2xl font-bold">JSON Formatter</h1>
        </div>
        <div className="space-y-4">
          <textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(""); setOutput(""); }}
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
            <div className="relative">
              <textarea readOnly value={output} rows={Math.min(25, output.split("\n").length)} className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg font-mono text-sm resize-none" />
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
