"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Check, FileKey } from "lucide-react";
import { Button } from "@/components/ui/button";

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return atob(str);
}

function tryParseJson(s: string): Record<string, unknown> | null {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

export default function JwtDecoderPage() {
  const [input, setInput] = useState("");
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
      const headerStr = base64UrlDecode(parts[0]);
      const payloadStr = base64UrlDecode(parts[1]);
      const headerJson = tryParseJson(headerStr);
      const payloadJson = tryParseJson(payloadStr);
      setHeader(headerJson ? JSON.stringify(headerJson, null, 2) : headerStr);
      setPayload(payloadJson ? JSON.stringify(payloadJson, null, 2) : payloadStr);
    } catch {
      setError("Failed to decode JWT. Ensure the token is valid Base64URL.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="border-b border-border p-4">
        <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={14} /> Back to Tools
        </Link>
      </div>
      <div className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
            <FileKey size={20} className="text-rose-400" />
          </div>
          <h1 className="text-2xl font-bold">JWT Decoder</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Paste a JWT token below. Decoding happens entirely in your browser — the token is never sent to any server.
        </p>
        <div className="space-y-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0..."
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
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-muted-foreground font-medium">Header</label>
                  <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(header); setCopiedHeader(true); setTimeout(() => setCopiedHeader(false), 2000); }} aria-label="Copy header">
                    {copiedHeader ? <Check size={12} /> : <Copy size={12} />}
                  </Button>
                </div>
                <pre className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg font-mono text-sm overflow-auto whitespace-pre-wrap">{header}</pre>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-muted-foreground font-medium">Payload</label>
                  <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(payload); setCopiedPayload(true); setTimeout(() => setCopiedPayload(false), 2000); }} aria-label="Copy payload">
                    {copiedPayload ? <Check size={12} /> : <Copy size={12} />}
                  </Button>
                </div>
                <pre className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg font-mono text-sm overflow-auto whitespace-pre-wrap">{payload}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
