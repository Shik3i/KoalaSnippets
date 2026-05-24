"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Check, Binary, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Base64Page() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleConvert = () => {
    setError("");
    try {
      if (mode === "encode") {
        setOutput(btoa(input));
      } else {
        setOutput(atob(input));
      }
    } catch {
      setError(mode === "decode" ? "Invalid Base64 string. Check the input." : "Encoding failed.");
      setOutput("");
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleMode = () => {
    setMode((prev) => (prev === "encode" ? "decode" : "encode"));
    setInput(output);
    setOutput("");
    setError("");
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
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Binary size={20} className="text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold">Base64 Encoder / Decoder</h1>
          <Button variant="ghost" size="icon" onClick={toggleMode} className="ml-auto" aria-label="Swap mode">
            <ArrowUpDown size={16} />
          </Button>
        </div>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant={mode === "encode" ? "default" : "outline"} size="sm" onClick={() => setMode("encode")}>
              Encode
            </Button>
            <Button variant={mode === "decode" ? "default" : "outline"} size="sm" onClick={() => setMode("decode")}>
              Decode
            </Button>
          </div>
          <textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(""); setOutput(""); }}
            placeholder={mode === "encode" ? "Enter text to encode..." : "Enter Base64 to decode..."}
            className="w-full h-40 px-4 py-3 bg-card border border-border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {error && (
            <div className="px-4 py-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-sm text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}
          <Button onClick={handleConvert} disabled={!input}>
            {mode === "encode" ? "Encode to Base64" : "Decode from Base64"}
          </Button>
          {output && (
            <div className="relative">
              <textarea readOnly value={output} rows={Math.min(15, output.split("\n").length)} className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg font-mono text-sm resize-none" />
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
