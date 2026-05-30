"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalStorageState } from "../hooks/use-local-storage-state";

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUtf8(str: string): string {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export function Base64Tool() {
  const [input, setInput] = useLocalStorageState<string>("koalatools_base64_input", "");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useLocalStorageState<"encode" | "decode">("koalatools_base64_mode", "encode");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleConvert = () => {
    setError("");
    try {
      if (mode === "encode") setOutput(utf8ToBase64(input));
      else setOutput(base64ToUtf8(input));
    } catch {
      setError(mode === "decode" ? "Invalid Base64 string." : "Encoding failed.");
      setOutput("");
    }
  };

  return (
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
        onChange={(e) => {
          setInput(e.target.value);
          setError("");
          setOutput("");
        }}
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
        <div className="relative animate-in fade-in slide-in-from-bottom-2 duration-200">
          <textarea
            readOnly
            value={output}
            rows={Math.min(15, output.split("\n").length)}
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
