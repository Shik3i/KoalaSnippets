"use client";

import { useState } from "react";
import { Copy, Check, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";

const ALGOS = ["SHA-256", "SHA-512", "SHA-1", "MD5"] as const;

async function computeHash(input: string, algo: (typeof ALGOS)[number]): Promise<string> {
  if (algo === "MD5") {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const buf = new Uint8Array(16);
    const k = new Uint32Array(buf.buffer);
    const b = data.length * 8;
    const words: number[] = [];
    for (let i = 0; i < data.length; i++) {
      words[i >> 2] |= data[i] << ((i % 4) * 8);
    }
    words[b >> 5] |= 0x80 << (b % 32);
    words[(((b + 64) >>> 9) << 4) + 14] = b;

    let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
    for (let i = 0; i < words.length; i += 16) {
      let A = a0, B = b0, C = c0, D = d0;
      const S = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
                 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
                 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
                 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
      const K = Array.from({ length: 64 }, (_, i) => Math.floor(2 ** 32 * Math.abs(Math.sin(i + 1))) | 0);
      for (let r = 0; r < 64; r++) {
        let F: number, g: number;
        if (r < 16) { F = (B & C) | (~B & D); g = r; }
        else if (r < 32) { F = (D & B) | (~D & C); g = (5 * r + 1) % 16; }
        else if (r < 48) { F = B ^ C ^ D; g = (3 * r + 5) % 16; }
        else { F = C ^ (B | ~D); g = (7 * r) % 16; }
        const temp = D;
        D = C;
        C = B;
        B = B + rotl(A + F + K[r] + (words[i + g] | 0), S[r]);
        A = temp;
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

function rotl(x: number, n: number): number {
  return ((x << n) | (x >>> (32 - n))) >>> 0;
}

export default function HashGeneratorPage() {
  const [input, setInput] = useState("");
  const [algo, setAlgo] = useState<(typeof ALGOS)[number]>("SHA-256");
  const [result, setResult] = useState("");
  const [computing, setComputing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!input) return;
    setComputing(true);
    const hash = await computeHash(input, algo);
    setResult(hash);
    setComputing(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 md:p-8 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
            <Hash size={20} className="text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold">Hash Generator</h1>
        </div>
        <div className="space-y-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter text to hash..."
            className="w-full h-32 px-4 py-3 bg-card border border-border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex flex-wrap gap-3 items-center">
            <select value={algo} onChange={(e) => setAlgo(e.target.value as typeof algo)} className="px-3 py-2 bg-card border border-border rounded-lg text-sm">
              {ALGOS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <Button onClick={handleGenerate} disabled={computing || !input}>
              {computing ? "Computing..." : "Generate Hash"}
            </Button>
          </div>
          {result && (
            <div className="relative">
              <input readOnly value={result} className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg font-mono text-sm" />
              <Button variant="ghost" size="icon" onClick={handleCopy} className="absolute top-1 right-1" aria-label="Copy">
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
