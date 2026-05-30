"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalStorageState } from "../hooks/use-local-storage-state";

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 3 && cleaned.length !== 6) return null;
  const hexStr = cleaned.length === 3 ? cleaned.split("").map((c) => c + c).join("") : cleaned;
  const num = parseInt(hexStr, 16);
  if (isNaN(num)) return null;
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0,
    s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
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

export function ColorTool() {
  const [hex, setHex] = useLocalStorageState<string>("koalatools_color_hex", "#3b82f6");
  const [rgb, setRgb] = useLocalStorageState<{ r: number; g: number; b: number }>("koalatools_color_rgb", {
    r: 59,
    g: 130,
    b: 246,
  });
  const [hsl, setHsl] = useLocalStorageState<{ h: number; s: number; l: number }>("koalatools_color_hsl", {
    h: 217,
    s: 91,
    l: 60,
  });
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
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div
          className="w-24 h-24 rounded-xl border border-border shadow-inner shrink-0"
          style={{ backgroundColor: hex }}
        />
        <div className="flex-1 w-full space-y-2">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">HEX</label>
            <div className="flex gap-1">
              <input
                value={hex}
                onChange={(e) => updateFromHex(e.target.value)}
                className="flex-1 px-3 py-2 bg-card border border-border rounded-lg font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Button variant="ghost" size="sm" onClick={() => copyValue("hex", hex)} aria-label="Copy HEX">
                {copied === "hex" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">RGB</label>
            <div className="flex gap-1">
              <input
                value={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`}
                onChange={(e) => {
                  const m = e.target.value.match(/(\d+)/g);
                  if (m?.length === 3) updateFromRgb(parseInt(m[0]), parseInt(m[1]), parseInt(m[2]));
                }}
                className="flex-1 px-3 py-2 bg-card border border-border rounded-lg font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyValue("rgb", `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)}
                aria-label="Copy RGB"
              >
                {copied === "rgb" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">HSL</label>
            <div className="flex gap-1">
              <input
                value={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`}
                onChange={(e) => {
                  const m = e.target.value.match(/(\d+)/g);
                  if (m?.length === 3) updateFromHsl(parseInt(m[0]), parseInt(m[1]), parseInt(m[2]));
                }}
                className="flex-1 px-3 py-2 bg-card border border-border rounded-lg font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyValue("hsl", `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)}
                aria-label="Copy HSL"
              >
                {copied === "hsl" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
