"use client";

import { useState, useMemo } from "react";
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

function base64UrlDecode(str: string): string { str = str.replace(/-/g, "+").replace(/_/g, "/"); while (str.length % 4) str += "="; return atob(str); }
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

  const handleConvert = () => { setError(""); try { if (mode === "encode") setOutput(btoa(input)); else setOutput(atob(input)); } catch { setError(mode === "decode" ? "Invalid Base64 string." : "Encoding failed."); setOutput(""); } };

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

function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split("\n"), newLines = newText.split("\n");
  const m = oldLines.length, n = newLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) dp[i][j] = oldLines[i-1] === newLines[j-1] ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1]);
  const result: DiffLine[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i-1] === newLines[j-1]) { result.unshift({ type: "same", text: oldLines[i-1], lineNumA: i, lineNumB: j }); i--; j--; }
    else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) { result.unshift({ type: "added", text: newLines[j-1], lineNumB: j }); j--; }
    else if (i > 0) { result.unshift({ type: "removed", text: oldLines[i-1], lineNumA: i }); i--; }
  }
  return result;
}

function DiffTool() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const diff = useMemo(() => computeDiff(left, right), [left, right]);
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

// -- Headers and icons for each tool --

const toolMeta: Record<ToolId, { icon: typeof Fingerprint; title: string; color: string; bgColor: string }> = {
  uuid: { icon: Fingerprint, title: "UUID Generator", color: "text-violet-400", bgColor: "bg-violet-500/10" },
  password: { icon: Key, title: "Password Generator", color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
  diff: { icon: Diff, title: "Text Diff Checker", color: "text-amber-400", bgColor: "bg-amber-500/10" },
  hash: { icon: Hash, title: "Hash Generator", color: "text-cyan-400", bgColor: "bg-cyan-500/10" },
  json: { icon: Braces, title: "JSON Formatter", color: "text-orange-400", bgColor: "bg-orange-500/10" },
  jwt: { icon: FileKey, title: "JWT Decoder", color: "text-rose-400", bgColor: "bg-rose-500/10" },
  base64: { icon: Binary, title: "Base64 Encoder / Decoder", color: "text-blue-400", bgColor: "bg-blue-500/10" },
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
