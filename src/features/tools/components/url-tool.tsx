"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalStorageState } from "../hooks/use-local-storage-state";

export function UrlTool() {
  const [input, setInput] = useLocalStorageState<string>("koalatools_url_input", "");
  const [mode, setMode] = useLocalStorageState<"encode" | "decode">("koalatools_url_mode", "encode");
  const [variant, setVariant] = useLocalStorageState<"component" | "full">("koalatools_url_variant", "component");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleConvert = () => {
    setError("");
    setOutput("");
    try {
      if (mode === "encode") {
        setOutput(variant === "component" ? encodeURIComponent(input) : encodeURI(input));
      } else {
        setOutput(decodeURIComponent(input));
      }
    } catch {
      setError(mode === "decode" ? "Invalid encoded string." : "Encoding failed.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Button variant={mode === "encode" ? "default" : "outline"} size="sm" onClick={() => setMode("encode")}>
          Encode
        </Button>
        <Button variant={mode === "decode" ? "default" : "outline"} size="sm" onClick={() => setMode("decode")}>
          Decode
        </Button>
        {mode === "encode" && (
          <>
            <Button
              variant={variant === "component" ? "outline" : "ghost"}
              size="sm"
              onClick={() => setVariant("component")}
            >
              Component
            </Button>
            <Button variant={variant === "full" ? "outline" : "ghost"} size="sm" onClick={() => setVariant("full")}>
              Full URL
            </Button>
          </>
        )}
      </div>
      <textarea
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setError("");
          setOutput("");
        }}
        placeholder={mode === "encode" ? "Enter text to encode..." : "Enter encoded string..."}
        className="w-full h-32 px-4 py-3 bg-card border border-border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
      />
      {error && (
        <div className="px-4 py-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-sm text-rose-400">
          {error}
        </div>
      )}
      <Button onClick={handleConvert} disabled={!input}>
        {mode === "encode" ? "Encode" : "Decode"}
      </Button>
      {output && (
        <div className="relative animate-in fade-in slide-in-from-bottom-2 duration-200">
          <textarea
            readOnly
            value={output}
            rows={Math.min(10, output.split("\n").length)}
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
