"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalStorageState } from "../hooks/use-local-storage-state";

function base64ToUtf8(str: string): string {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return base64ToUtf8(str);
}

function tryParseJson(s: string): Record<string, unknown> | null {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

export function JwtTool() {
  const [input, setInput] = useLocalStorageState<string>("koalatools_jwt_input", "");
  const [header, setHeader] = useState("");
  const [payload, setPayload] = useState("");
  const [error, setError] = useState("");
  const [copiedHeader, setCopiedHeader] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  const decode = () => {
    setError("");
    setHeader("");
    setPayload("");
    const parts = input.trim().split(".");
    if (parts.length !== 3) {
      setError("Invalid JWT format. Expected header.payload.signature");
      return;
    }
    try {
      const h = tryParseJson(base64UrlDecode(parts[0]));
      const p = tryParseJson(base64UrlDecode(parts[1]));
      setHeader(h ? JSON.stringify(h, null, 2) : base64UrlDecode(parts[0]));
      setPayload(p ? JSON.stringify(p, null, 2) : base64UrlDecode(parts[1]));
    } catch {
      setError("Failed to decode JWT. Ensure the token is valid Base64URL.");
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Paste a JWT token below. Decoding happens entirely in your browser.</p>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        className="w-full h-24 px-4 py-3 bg-card border border-border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
      />
      {error && (
        <div className="px-4 py-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-sm text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}
      <Button onClick={decode} disabled={!input}>
        Decode JWT
      </Button>
      {(header || payload) && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-muted-foreground font-medium">Header</label>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(header);
                  setCopiedHeader(true);
                  setTimeout(() => setCopiedHeader(false), 2000);
                }}
                aria-label="Copy header"
              >
                {copiedHeader ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              </Button>
            </div>
            <pre className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg font-mono text-sm overflow-auto whitespace-pre-wrap">
              {header}
            </pre>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-muted-foreground font-medium">Payload</label>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(payload);
                  setCopiedPayload(true);
                  setTimeout(() => setCopiedPayload(false), 2000);
                }}
                aria-label="Copy payload"
              >
                {copiedPayload ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              </Button>
            </div>
            <pre className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg font-mono text-sm overflow-auto whitespace-pre-wrap">
              {payload}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
