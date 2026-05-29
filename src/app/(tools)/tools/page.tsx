"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Fingerprint,
  Key,
  Diff,
  Hash,
  Braces,
  FileKey,
  Binary,
  Copy,
  Check,
  X,
  RefreshCw,
  Maximize2,
  Minimize2,
  Regex,
  Clock,
  Link2,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const tools = [
  { id: "uuid", icon: Fingerprint, title: "UUID Generator", description: "Generate UUIDv4 identifiers individually or in bulk.", color: "text-violet-400", bgColor: "bg-violet-500/10" },
  { id: "password", icon: Key, title: "Password Generator", description: "Create strong passwords with custom length and character sets.", color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
  { id: "diff", icon: Diff, title: "Text Diff Checker", description: "Compare two text inputs side-by-side with highlighting.", color: "text-amber-400", bgColor: "bg-amber-500/10" },
  { id: "hash", icon: Hash, title: "Hash Generator", description: "Compute MD5, SHA-1, SHA-256, SHA-512 hashes via Web Crypto.", color: "text-cyan-400", bgColor: "bg-cyan-500/10" },
  { id: "json", icon: Braces, title: "JSON Formatter", description: "Beautify, minify, and validate JSON strings instantly.", color: "text-orange-400", bgColor: "bg-orange-500/10" },
  { id: "jwt", icon: FileKey, title: "JWT Decoder", description: "Decode JWT header and payload in your browser.", color: "text-rose-400", bgColor: "bg-rose-500/10" },
  { id: "base64", icon: Binary, title: "Base64 Encoder", description: "Encode/decode Base64 entirely in the browser.", color: "text-blue-400", bgColor: "bg-blue-500/10" },
  { id: "regex", icon: Regex, title: "Regex Tester", description: "Test regular expressions with live match highlighting and flags.", color: "text-pink-400", bgColor: "bg-pink-500/10" },
  { id: "timestamp", icon: Clock, title: "Timestamp Converter", description: "Convert Unix timestamps to human-readable dates and vice versa.", color: "text-teal-400", bgColor: "bg-teal-500/10" },
  { id: "url", icon: Link2, title: "URL Encoder / Decoder", description: "Encode and decode URLs, query parameters, and components.", color: "text-indigo-400", bgColor: "bg-indigo-500/10" },
  { id: "color", icon: Palette, title: "Color Converter", description: "Convert between HEX, RGB, and HSL color formats with live preview.", color: "text-fuchsia-400", bgColor: "bg-fuchsia-500/10" },
] as const;

type ToolId = (typeof tools)[number]["id"];

// -- Inline tool components --

function UuidTool() {
  const [count, setCount] = useState(1);
  const [format, setFormat] = useState<"plain" | "sql" | "json">("plain");
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
          <Button variant="ghost" size="icon" onClick={async () => { await navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="absolute top-2 right-2" aria-label="Copy">
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </Button>
        </div>
      )}
    </div>
  );
}

const CHAR_SETS: Record<string, string> = { uppercase: "ABCDEFGHJKLMNPQRSTUVWXYZ", lowercase: "abcdefghjkmnpqrstuvwxyz", digits: "23456789", symbols: "!@#$%^&*_-+=?" };

function PasswordTool() {
  const [length, setLength] = useState(24);
  const [sets, setSets] = useState(new Set(["uppercase", "lowercase", "digits", "symbols"]));
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [strength, setStrength] = useState("");

  const toggle = (key: string) => setSets((prev) => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });

  const generate = () => {
    const chars = [...sets].map((k) => CHAR_SETS[k]).join("");
    if (!chars) return;
    const buf = new Uint32Array(length);
    crypto.getRandomValues(buf);
    let pwd = "";
    for (let i = 0; i < length; i++) pwd += chars[buf[i] % chars.length];
    setOutput(pwd);
    const entropy = Math.log2(chars.length) * length;
    if (entropy >= 128) setStrength("Very Strong");
    else if (entropy >= 80) setStrength("Strong");
    else if (entropy >= 60) setStrength("Moderate");
    else setStrength("Weak");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Length: {length}</label>
          <input type="range" min={8} max={64} value={length} onChange={(e) => setLength(parseInt(e.target.value))} className="w-40" />
        </div>
        <Button onClick={generate} className="gap-1.5"><RefreshCw size={14} /> Generate</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.keys(CHAR_SETS).map((key) => (
          <label key={key} className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded-lg text-sm cursor-pointer select-none">
            <input type="checkbox" checked={sets.has(key)} onChange={() => toggle(key)} className="rounded" />
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </label>
        ))}
      </div>
      {output && (
        <div className="space-y-2">
          <div className="relative">
            <input readOnly value={output} className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg font-mono text-sm" />
            <Button variant="ghost" size="icon" onClick={async () => { await navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="absolute top-1 right-1" aria-label="Copy">
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </Button>
          </div>
          {strength && (
            <p className={`text-xs ${strength === "Very Strong" ? "text-emerald-400" : strength === "Strong" ? "text-cyan-400" : strength === "Moderate" ? "text-amber-400" : "text-rose-400"}`}>
              {strength} ({Math.round(Math.log2([...sets].map((k) => CHAR_SETS[k]).join("").length) * length)} bits entropy)
            </p>
          )}
        </div>
      )}
    </div>
  );
}

const ALGOS = ["SHA-256", "SHA-512", "SHA-1", "MD5"] as const;

function rotl(x: number, n: number): number { return ((x << n) | (x >>> (32 - n))) >>> 0; }

async function computeHash(input: string, algo: (typeof ALGOS)[number]): Promise<string> {
  if (algo === "MD5") {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const buf = new Uint8Array(16);
    const k = new Uint32Array(buf.buffer);
    const b = data.length * 8;
    const words: number[] = [];
    for (let i = 0; i < data.length; i++) words[i >> 2] |= data[i] << ((i % 4) * 8);
    words[b >> 5] |= 0x80 << (b % 32);
    words[(((b + 64) >>> 9) << 4) + 14] = b;
    let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
    for (let i = 0; i < words.length; i += 16) {
      let A = a0, B = b0, C = c0, D = d0;
      const S = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
      const K = Array.from({ length: 64 }, (_, i) => Math.floor(2 ** 32 * Math.abs(Math.sin(i + 1))) | 0);
      for (let r = 0; r < 64; r++) {
        let F: number, g: number;
        if (r < 16) { F = (B & C) | (~B & D); g = r; }
        else if (r < 32) { F = (D & B) | (~D & C); g = (5 * r + 1) % 16; }
        else if (r < 48) { F = B ^ C ^ D; g = (3 * r + 5) % 16; }
        else { F = C ^ (B | ~D); g = (7 * r) % 16; }
        const temp = D; D = C; C = B; B = B + rotl(A + F + K[r] + (words[i + g] | 0), S[r]); A = temp;
      }
      a0 = (a0 + A) | 0; b0 = (b0 + B) | 0; c0 = (c0 + C) | 0; d0 = (d0 + D) | 0;
    }
    k[0] = a0; k[1] = b0; k[2] = c0; k[3] = d0;
    return Array.from(buf).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  const enc = new TextEncoder().encode(input);
  const map: Record<string, string> = { "SHA-256": "SHA-256", "SHA-512": "SHA-512", "SHA-1": "SHA-1" };
  const hashBuf = await crypto.subtle.digest(map[algo], enc);
  return Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function HashTool() {
  const [input, setInput] = useState("");
  const [algo, setAlgo] = useState<(typeof ALGOS)[number]>("SHA-256");
  const [result, setResult] = useState("");
  const [computing, setComputing] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <div className="space-y-4">
      <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Enter text to hash..." className="w-full h-32 px-4 py-3 bg-card border border-border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
      <div className="flex flex-wrap gap-3 items-center">
        <select value={algo} onChange={(e) => setAlgo(e.target.value as typeof algo)} className="px-3 py-2 bg-card border border-border rounded-lg text-sm">
          {ALGOS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <Button onClick={async () => { if (!input) return; setComputing(true); const h = await computeHash(input, algo); setResult(h); setComputing(false); }} disabled={computing || !input}>
          {computing ? "Computing..." : "Generate Hash"}
        </Button>
      </div>
      {result && (
        <div className="relative">
          <input readOnly value={result} className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg font-mono text-sm" />
          <Button variant="ghost" size="icon" onClick={async () => { await navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="absolute top-1 right-1" aria-label="Copy">
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </Button>
        </div>
      )}
    </div>
  );
}

function JsonTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleBeautify = () => { try { const p = JSON.parse(input); setOutput(JSON.stringify(p, null, 2)); setError(""); } catch (e) { setError((e as Error).message); setOutput(""); } };
  const handleMinify = () => { try { const p = JSON.parse(input); setOutput(JSON.stringify(p)); setError(""); } catch (e) { setError((e as Error).message); setOutput(""); } };
  const handleValidate = () => { try { const p = JSON.parse(input); setOutput(JSON.stringify(p, null, 2)); setError(""); } catch (e) { setError((e as Error).message); setOutput(input); } };

  return (
    <div className="space-y-4">
      <textarea value={input} onChange={(e) => { setInput(e.target.value); setError(""); setOutput(""); }} placeholder='{"hello":"world"}' className="w-full h-40 px-4 py-3 bg-card border border-border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
      {error && <div className="px-4 py-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-sm text-rose-600 dark:text-rose-400">{error}</div>}
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleBeautify} disabled={!input} className="gap-1.5"><Maximize2 size={14} /> Beautify</Button>
        <Button onClick={handleMinify} disabled={!input} variant="outline" className="gap-1.5"><Minimize2 size={14} /> Minify</Button>
        <Button onClick={handleValidate} disabled={!input} variant="ghost">Validate</Button>
      </div>
      {output && (
        <div className="relative">
          <textarea readOnly value={output} rows={Math.min(25, output.split("\n").length)} className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg font-mono text-sm resize-none" />
          <Button variant="ghost" size="icon" onClick={async () => { await navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="absolute top-2 right-2" aria-label="Copy">
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </Button>
        </div>
      )}
    </div>
  );
}

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

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return base64ToUtf8(str);
}
function tryParseJson(s: string): Record<string, unknown> | null { try { return JSON.parse(s); } catch { return null; } }

function JwtTool() {
  const [input, setInput] = useState("");
  const [header, setHeader] = useState("");
  const [payload, setPayload] = useState("");
  const [error, setError] = useState("");
  const [copiedHeader, setCopiedHeader] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  const decode = () => {
    setError(""); setHeader(""); setPayload("");
    const parts = input.trim().split(".");
    if (parts.length !== 3) { setError("Invalid JWT format. Expected header.payload.signature"); return; }
    try {
      const h = tryParseJson(base64UrlDecode(parts[0]));
      const p = tryParseJson(base64UrlDecode(parts[1]));
      setHeader(h ? JSON.stringify(h, null, 2) : base64UrlDecode(parts[0]));
      setPayload(p ? JSON.stringify(p, null, 2) : base64UrlDecode(parts[1]));
    } catch { setError("Failed to decode JWT. Ensure the token is valid Base64URL."); }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Paste a JWT token below. Decoding happens entirely in your browser.</p>
      <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." className="w-full h-24 px-4 py-3 bg-card border border-border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
      {error && <div className="px-4 py-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-sm text-rose-600 dark:text-rose-400">{error}</div>}
      <Button onClick={decode} disabled={!input}>Decode JWT</Button>
      {(header || payload) && (
        <div className="space-y-3">
          <div><div className="flex items-center justify-between mb-1"><label className="text-xs text-muted-foreground font-medium">Header</label>
            <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(header); setCopiedHeader(true); setTimeout(() => setCopiedHeader(false), 2000); }} aria-label="Copy header">{copiedHeader ? <Check size={12} /> : <Copy size={12} />}</Button>
          </div><pre className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg font-mono text-sm overflow-auto whitespace-pre-wrap">{header}</pre></div>
          <div><div className="flex items-center justify-between mb-1"><label className="text-xs text-muted-foreground font-medium">Payload</label>
            <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(payload); setCopiedPayload(true); setTimeout(() => setCopiedPayload(false), 2000); }} aria-label="Copy payload">{copiedPayload ? <Check size={12} /> : <Copy size={12} />}</Button>
          </div><pre className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg font-mono text-sm overflow-auto whitespace-pre-wrap">{payload}</pre></div>
        </div>
      )}
    </div>
  );
}

function Base64Tool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleConvert = () => { setError(""); try { if (mode === "encode") setOutput(utf8ToBase64(input)); else setOutput(base64ToUtf8(input)); } catch { setError(mode === "decode" ? "Invalid Base64 string." : "Encoding failed."); setOutput(""); } };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant={mode === "encode" ? "default" : "outline"} size="sm" onClick={() => setMode("encode")}>Encode</Button>
        <Button variant={mode === "decode" ? "default" : "outline"} size="sm" onClick={() => setMode("decode")}>Decode</Button>
      </div>
      <textarea value={input} onChange={(e) => { setInput(e.target.value); setError(""); setOutput(""); }} placeholder={mode === "encode" ? "Enter text to encode..." : "Enter Base64 to decode..."} className="w-full h-40 px-4 py-3 bg-card border border-border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
      {error && <div className="px-4 py-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-sm text-rose-600 dark:text-rose-400">{error}</div>}
      <Button onClick={handleConvert} disabled={!input}>{mode === "encode" ? "Encode to Base64" : "Decode from Base64"}</Button>
      {output && (
        <div className="relative">
          <textarea readOnly value={output} rows={Math.min(15, output.split("\n").length)} className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg font-mono text-sm resize-none" />
          <Button variant="ghost" size="icon" onClick={async () => { await navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="absolute top-2 right-2" aria-label="Copy">
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </Button>
        </div>
      )}
    </div>
  );
}

interface DiffLine { type: "same" | "added" | "removed"; text: string; lineNumA?: number; lineNumB?: number; }

function lcsLength(X: string[], Y: string[]): number[] {
  const m = X.length;
  const n = Y.length;
  let prevRow = new Array(n + 1).fill(0);
  let currRow = new Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    const temp = prevRow;
    prevRow = currRow;
    currRow = temp;
    currRow[0] = 0;

    for (let j = 1; j <= n; j++) {
      if (X[i - 1] === Y[j - 1]) {
        currRow[j] = prevRow[j - 1] + 1;
      } else {
        currRow[j] = Math.max(prevRow[j], currRow[j - 1]);
      }
    }
  }
  return currRow;
}

function hirschberg(X: string[], Y: string[], offsetI: number = 0, offsetJ: number = 0): DiffLine[] {
  const m = X.length;
  const n = Y.length;

  if (m === 0) {
    return Y.map((item, index) => ({ type: "added" as const, text: item, lineNumB: offsetJ + index + 1 }));
  } else if (n === 0) {
    return X.map((item, index) => ({ type: "removed" as const, text: item, lineNumA: offsetI + index + 1 }));
  } else if (m === 1) {
    const index = Y.indexOf(X[0]);
    if (index !== -1) {
      const addedBefore = Y.slice(0, index).map((item, idx) => ({ type: "added" as const, text: item, lineNumB: offsetJ + idx + 1 }));
      const same = [{ type: "same" as const, text: X[0], lineNumA: offsetI + 1, lineNumB: offsetJ + index + 1 }];
      const addedAfter = Y.slice(index + 1).map((item, idx) => ({ type: "added" as const, text: item, lineNumB: offsetJ + index + 2 + idx }));
      return [...addedBefore, ...same, ...addedAfter];
    } else {
      const removed = [{ type: "removed" as const, text: X[0], lineNumA: offsetI + 1 }];
      const added = Y.map((item, idx) => ({ type: "added" as const, text: item, lineNumB: offsetJ + idx + 1 }));
      return [...removed, ...added];
    }
  }

  const xMid = Math.floor(m / 2);
  const scoreL = lcsLength(X.slice(0, xMid), Y);
  const scoreR = lcsLength(X.slice(xMid).reverse(), Y.slice().reverse());

  let yMid = 0;
  let maxScore = -1;
  for (let j = 0; j <= n; j++) {
    const score = scoreL[j] + scoreR[n - j];
    if (score > maxScore) {
      maxScore = score;
      yMid = j;
    }
  }

  return [
    ...hirschberg(X.slice(0, xMid), Y.slice(0, yMid), offsetI, offsetJ),
    ...hirschberg(X.slice(xMid), Y.slice(yMid), offsetI + xMid, offsetJ + yMid)
  ];
}

function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  return hirschberg(oldLines, newLines);
}

function DiffTool() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [debouncedLeft, setDebouncedLeft] = useState("");
  const [debouncedRight, setDebouncedRight] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedLeft(left);
      setDebouncedRight(right);
    }, 200);

    return () => {
      clearTimeout(handler);
    };
  }, [left, right]);

  const diff = useMemo(() => computeDiff(debouncedLeft, debouncedRight), [debouncedLeft, debouncedRight]);
  const hasInput = left || right;

  return (
    <div className="space-y-4 min-h-0 flex flex-col">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div><label className="block text-xs text-muted-foreground mb-1 font-medium">Original</label>
          <textarea value={left} onChange={(e) => setLeft(e.target.value)} placeholder="Paste original text here..." className="w-full h-40 px-4 py-3 bg-card border border-border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary" /></div>
        <div><label className="block text-xs text-muted-foreground mb-1 font-medium">Modified</label>
          <textarea value={right} onChange={(e) => setRight(e.target.value)} placeholder="Paste modified text here..." className="w-full h-40 px-4 py-3 bg-card border border-border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary" /></div>
      </div>
      {hasInput && (
        <div className="flex-1 min-h-0 flex flex-col">
          <label className="text-xs text-muted-foreground mb-1 font-medium">Diff Result ({diff.filter((d) => d.type !== "same").length} changes)</label>
          <div className="overflow-auto border border-border rounded-lg font-mono text-xs leading-6">
            {diff.map((line, idx) => (
              <div key={idx} className={`flex ${line.type === "added" ? "bg-emerald-500/10" : line.type === "removed" ? "bg-rose-500/10" : ""}`}>
                <span className="w-10 text-right pr-2 text-muted-foreground shrink-0 select-none border-r border-border/50 py-0.5">{line.lineNumA ?? ""}</span>
                <span className="w-10 text-right pr-2 text-muted-foreground shrink-0 select-none border-r border-border/50 py-0.5">{line.lineNumB ?? ""}</span>
                <span className={`px-2 py-0.5 flex-1 whitespace-pre ${line.type === "added" ? "text-emerald-600 dark:text-emerald-400" : line.type === "removed" ? "text-rose-600 dark:text-rose-400" : ""}`}>{line.type === "added" ? "+ " : line.type === "removed" ? "- " : "  "}{line.text || " "}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RegexTool() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("gi");
  const [testString, setTestString] = useState("");

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
  }, [pattern, flags, testString, regexResult.error]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-xs text-muted-foreground mb-1">Pattern</label>
          <input value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="[a-z]+" className="w-full px-3 py-2 bg-card border border-border rounded-lg font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div className="w-24">
          <label className="block text-xs text-muted-foreground mb-1">Flags</label>
          <input value={flags} onChange={(e) => setFlags(e.target.value.replace(/[^gimsuy]/g, ""))} placeholder="gi" className="w-full px-3 py-2 bg-card border border-border rounded-lg font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
      </div>
      {regexResult.error && <div className="px-3 py-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-sm text-rose-400">{regexResult.error}</div>}
      <div>
        <label className="block text-xs text-muted-foreground mb-1">Test String</label>
        <textarea value={testString} onChange={(e) => setTestString(e.target.value)} placeholder="Enter text to test against..." className="w-full h-32 px-4 py-3 bg-card border border-border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
      </div>
      {pattern && testString && !regexResult.error && (
        <>
          <div className="px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm">
            <span className="text-muted-foreground">{regexResult.matches.length} match{regexResult.matches.length !== 1 ? "es" : ""} found</span>
          </div>
          <div className="px-4 py-3 bg-muted/50 border border-border rounded-lg font-mono text-sm whitespace-pre-wrap break-all leading-relaxed">
            {(highlighted as { text: string; isMatch: boolean }[]).map((part, i) => (
              <span key={i} className={part.isMatch ? "bg-emerald-500/20 text-emerald-400 rounded px-0.5" : ""}>{part.text}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TimestampTool() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"to-date" | "to-ts">("to-date");

  const result = useMemo(() => {
    if (!input.trim()) return null;
    if (mode === "to-date") {
      const ts = parseInt(input, 10);
      if (isNaN(ts)) return { error: "Invalid timestamp" };
      const ms = ts.toString().length <= 10 ? ts * 1000 : ts;
      const date = new Date(ms);
      if (isNaN(date.getTime())) return { error: "Invalid date" };
      return {
        iso: date.toISOString(),
        local: date.toLocaleString(),
        utc: date.toUTCString(),
        seconds: Math.floor(ms / 1000),
        milliseconds: ms,
      };
    } else {
      const date = new Date(input);
      if (isNaN(date.getTime())) return { error: "Invalid date string" };
      return {
        seconds: Math.floor(date.getTime() / 1000),
        milliseconds: date.getTime(),
        iso: date.toISOString(),
        local: date.toLocaleString(),
        utc: date.toUTCString(),
      };
    }
  }, [input, mode]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant={mode === "to-date" ? "default" : "outline"} size="sm" onClick={() => setMode("to-date")}>Timestamp → Date</Button>
        <Button variant={mode === "to-ts" ? "default" : "outline"} size="sm" onClick={() => setMode("to-ts")}>Date → Timestamp</Button>
      </div>
      <div>
        <label className="block text-xs text-muted-foreground mb-1">{mode === "to-date" ? "Unix Timestamp (sec or ms)" : "Date String (ISO, locale, etc.)"}</label>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode === "to-date" ? "1700000000" : "2024-01-15T10:30:00Z"} className="w-full px-3 py-2 bg-card border border-border rounded-lg font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
      </div>
      {result && "error" in result && <div className="px-3 py-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-sm text-rose-400">{result.error}</div>}
      {result && !("error" in result) && (
        <div className="space-y-2">
          {("seconds" in result) && (
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-muted/50 border border-border rounded-lg">
                <div className="text-[10px] text-muted-foreground uppercase">Unix (seconds)</div>
                <div className="font-mono text-sm mt-1">{result.seconds}</div>
              </div>
              <div className="p-3 bg-muted/50 border border-border rounded-lg">
                <div className="text-[10px] text-muted-foreground uppercase">Unix (milliseconds)</div>
                <div className="font-mono text-sm mt-1">{result.milliseconds}</div>
              </div>
            </div>
          )}
          {("iso" in result) && (
            <div className="p-3 bg-muted/50 border border-border rounded-lg">
              <div className="text-[10px] text-muted-foreground uppercase">ISO 8601</div>
              <div className="font-mono text-sm mt-1">{result.iso}</div>
            </div>
          )}
          {("local" in result) && (
            <div className="p-3 bg-muted/50 border border-border rounded-lg">
              <div className="text-[10px] text-muted-foreground uppercase">Local Time</div>
              <div className="font-mono text-sm mt-1">{result.local}</div>
            </div>
          )}
          {("utc" in result) && (
            <div className="p-3 bg-muted/50 border border-border rounded-lg">
              <div className="text-[10px] text-muted-foreground uppercase">UTC</div>
              <div className="font-mono text-sm mt-1">{result.utc}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function UrlTool() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [variant, setVariant] = useState<"component" | "full">("component");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleConvert = () => {
    setError(""); setOutput("");
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
        <Button variant={mode === "encode" ? "default" : "outline"} size="sm" onClick={() => setMode("encode")}>Encode</Button>
        <Button variant={mode === "decode" ? "default" : "outline"} size="sm" onClick={() => setMode("decode")}>Decode</Button>
        {mode === "encode" && (
          <>
            <Button variant={variant === "component" ? "outline" : "ghost"} size="sm" onClick={() => setVariant("component")}>Component</Button>
            <Button variant={variant === "full" ? "outline" : "ghost"} size="sm" onClick={() => setVariant("full")}>Full URL</Button>
          </>
        )}
      </div>
      <textarea value={input} onChange={(e) => { setInput(e.target.value); setError(""); setOutput(""); }} placeholder={mode === "encode" ? "Enter text to encode..." : "Enter encoded string..."} className="w-full h-32 px-4 py-3 bg-card border border-border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
      {error && <div className="px-4 py-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-sm text-rose-400">{error}</div>}
      <Button onClick={handleConvert} disabled={!input}>{mode === "encode" ? "Encode" : "Decode"}</Button>
      {output && (
        <div className="relative">
          <textarea readOnly value={output} rows={Math.min(10, output.split("\n").length)} className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg font-mono text-sm resize-none" />
          <Button variant="ghost" size="icon" onClick={async () => { await navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="absolute top-2 right-2" aria-label="Copy">
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </Button>
        </div>
      )}
    </div>
  );
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 3 && cleaned.length !== 6) return null;
  const hexStr = cleaned.length === 3 ? cleaned.split("").map((c) => c + c).join("") : cleaned;
  const num = parseInt(hexStr, 16);
  if (isNaN(num)) return null;
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360; s /= 100; l /= 100;
  let r: number, g: number, b: number;
  if (s === 0) { r = g = b = l; }
  else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
}

function ColorTool() {
  const [hex, setHex] = useState("#3b82f6");
  const [rgb, setRgb] = useState({ r: 59, g: 130, b: 246 });
  const [hsl, setHsl] = useState({ h: 217, s: 91, l: 60 });
  const [copied, setCopied] = useState("");

  const updateFromHex = (value: string) => {
    setHex(value);
    const parsed = hexToRgb(value);
    if (parsed) {
      setRgb(parsed);
      setHsl(rgbToHsl(parsed.r, parsed.g, parsed.b));
    }
  };

  const updateFromRgb = (r: number, g: number, b: number) => {
    const clamped = { r: Math.min(255, Math.max(0, r)), g: Math.min(255, Math.max(0, g)), b: Math.min(255, Math.max(0, b)) };
    setRgb(clamped);
    setHex(rgbToHex(clamped.r, clamped.g, clamped.b));
    setHsl(rgbToHsl(clamped.r, clamped.g, clamped.b));
  };

  const updateFromHsl = (h: number, s: number, l: number) => {
    const clamped = { h: ((h % 360) + 360) % 360, s: Math.min(100, Math.max(0, s)), l: Math.min(100, Math.max(0, l)) };
    setHsl(clamped);
    const rgbVal = hslToRgb(clamped.h, clamped.s, clamped.l);
    setRgb(rgbVal);
    setHex(rgbToHex(rgbVal.r, rgbVal.g, rgbVal.b));
  };

  const copyValue = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-24 h-24 rounded-xl border border-border shadow-inner" style={{ backgroundColor: hex }} />
        <div className="flex-1 space-y-2">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">HEX</label>
            <div className="flex gap-1">
              <input value={hex} onChange={(e) => updateFromHex(e.target.value)} className="flex-1 px-3 py-2 bg-card border border-border rounded-lg font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              <Button variant="ghost" size="sm" onClick={() => copyValue("hex", hex)} aria-label="Copy HEX">{copied === "hex" ? <Check size={14} /> : <Copy size={14} />}</Button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">RGB</label>
            <div className="flex gap-1">
              <input value={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`} onChange={(e) => { const m = e.target.value.match(/(\d+)/g); if (m?.length === 3) updateFromRgb(parseInt(m[0]), parseInt(m[1]), parseInt(m[2])); }} className="flex-1 px-3 py-2 bg-card border border-border rounded-lg font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              <Button variant="ghost" size="sm" onClick={() => copyValue("rgb", `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)} aria-label="Copy RGB">{copied === "rgb" ? <Check size={14} /> : <Copy size={14} />}</Button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">HSL</label>
            <div className="flex gap-1">
              <input value={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`} onChange={(e) => { const m = e.target.value.match(/(\d+)/g); if (m?.length === 3) updateFromHsl(parseInt(m[0]), parseInt(m[1]), parseInt(m[2])); }} className="flex-1 px-3 py-2 bg-card border border-border rounded-lg font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              <Button variant="ghost" size="sm" onClick={() => copyValue("hsl", `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)} aria-label="Copy HSL">{copied === "hsl" ? <Check size={14} /> : <Copy size={14} />}</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// -- Headers and icons for each tool --

const toolMeta: Record<ToolId, { icon: typeof Fingerprint; title: string; color: string; bgColor: string }> = {
  uuid: { icon: Fingerprint, title: "UUID Generator", color: "text-violet-400", bgColor: "bg-violet-500/10" },
  password: { icon: Key, title: "Password Generator", color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
  diff: { icon: Diff, title: "Text Diff Checker", color: "text-amber-400", bgColor: "bg-amber-500/10" },
  hash: { icon: Hash, title: "Hash Generator", color: "text-cyan-400", bgColor: "bg-cyan-500/10" },
  json: { icon: Braces, title: "JSON Formatter", color: "text-orange-400", bgColor: "bg-orange-500/10" },
  jwt: { icon: FileKey, title: "JWT Decoder", color: "text-rose-400", bgColor: "bg-rose-500/10" },
  base64: { icon: Binary, title: "Base64 Encoder / Decoder", color: "text-blue-400", bgColor: "bg-blue-500/10" },
  regex: { icon: Regex, title: "Regex Tester", color: "text-pink-400", bgColor: "bg-pink-500/10" },
  timestamp: { icon: Clock, title: "Timestamp Converter", color: "text-teal-400", bgColor: "bg-teal-500/10" },
  url: { icon: Link2, title: "URL Encoder / Decoder", color: "text-indigo-400", bgColor: "bg-indigo-500/10" },
  color: { icon: Palette, title: "Color Converter", color: "text-fuchsia-400", bgColor: "bg-fuchsia-500/10" },
};

// -- Main page component --

export default function ToolsHubPage() {
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);

  const renderTool = () => {
    if (!activeTool) return null;
    switch (activeTool) {
      case "uuid": return <UuidTool />;
      case "password": return <PasswordTool />;
      case "diff": return <DiffTool />;
      case "hash": return <HashTool />;
      case "json": return <JsonTool />;
      case "jwt": return <JwtTool />;
      case "base64": return <Base64Tool />;
      case "regex": return <RegexTool />;
      case "timestamp": return <TimestampTool />;
      case "url": return <UrlTool />;
      case "color": return <ColorTool />;
    }
  };

  const meta = activeTool ? toolMeta[activeTool] : null;
  const MetaIcon = meta?.icon;

  return (
    <>
      <div className="flex-1 overflow-auto">
        <div className="p-6 md:p-8 max-w-6xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Developer Tools</h1>
            <p className="text-muted-foreground">Privacy-first utilities. All computations run 100% in your browser. No data is ever sent to the server.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className="group block text-left p-6 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
                >
                  <div className={`w-10 h-10 rounded-lg ${tool.bgColor} flex items-center justify-center mb-3`}>
                    <Icon size={20} className={tool.color} />
                  </div>
                  <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">{tool.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{tool.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {activeTool && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 sm:pt-12 pb-6 px-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setActiveTool(null)} />
          <div className="relative z-10 w-full max-w-4xl max-h-[90vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                {MetaIcon && (
                  <div className={`w-10 h-10 rounded-lg ${meta!.bgColor} flex items-center justify-center`}>
                    <MetaIcon size={20} className={meta!.color} />
                  </div>
                )}
                <h2 className="text-xl font-bold">{meta?.title}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setActiveTool(null)} aria-label="Close">
                <X size={20} />
              </Button>
            </div>
            <div className="overflow-auto p-6 flex-1">
              {renderTool()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
