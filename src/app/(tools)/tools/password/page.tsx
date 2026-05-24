"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Check, Key, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const CHAR_SETS: Record<string, string> = {
  uppercase: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  lowercase: "abcdefghjkmnpqrstuvwxyz",
  digits: "23456789",
  symbols: "!@#$%^&*_-+=?",
};

export default function PasswordGeneratorPage() {
  const [length, setLength] = useState(24);
  const [sets, setSets] = useState(new Set(["uppercase", "lowercase", "digits", "symbols"]));
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [strength, setStrength] = useState("");

  const toggle = (key: string) => {
    setSets((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const generate = () => {
    const chars = [...sets].map((k) => CHAR_SETS[k]).join("");
    if (!chars) return;
    const buf = new Uint32Array(length);
    crypto.getRandomValues(buf);
    let pwd = "";
    for (let i = 0; i < length; i++) {
      pwd += chars[buf[i] % chars.length];
    }
    setOutput(pwd);
    const entropy = Math.log2(chars.length) * length;
    if (entropy >= 128) setStrength("Very Strong");
    else if (entropy >= 80) setStrength("Strong");
    else if (entropy >= 60) setStrength("Moderate");
    else setStrength("Weak");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Key size={20} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold">Password Generator</h1>
        </div>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Length: {length}</label>
              <input type="range" min={8} max={64} value={length} onChange={(e) => setLength(parseInt(e.target.value))} className="w-40" />
            </div>
            <Button onClick={generate} className="gap-1.5">
              <RefreshCw size={14} /> Generate
            </Button>
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
                <Button variant="ghost" size="icon" onClick={handleCopy} className="absolute top-1 right-1" aria-label="Copy">
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
      </div>
    </div>
  );
}
