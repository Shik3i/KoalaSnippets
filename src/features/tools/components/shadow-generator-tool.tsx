"use client";

import { useState, useMemo } from "react";
import { Copy, Check, Sliders, Eye, Code, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalStorageState } from "../hooks/use-local-storage-state";

interface Preset {
  name: string;
  h: number;
  v: number;
  blur: number;
  spread: number;
  color: string;
  opacity: number;
  inset: boolean;
  glass: boolean;
}

const PRESETS: Record<string, Preset> = {
  soft: { name: "Modern Soft", h: 0, v: 12, blur: 24, spread: -4, color: "#000000", opacity: 0.12, inset: false, glass: false },
  harsh: { name: "Retro Harsh", h: 6, v: 6, blur: 0, spread: 0, color: "#3b82f6", opacity: 1, inset: false, glass: false },
  glass: { name: "Glassmorphic Glow", h: 0, v: 8, blur: 32, spread: 0, color: "#6366f1", opacity: 0.25, inset: false, glass: true },
  inner: { name: "Inner Glow", h: 0, v: 0, blur: 16, spread: 4, color: "#10b981", opacity: 0.5, inset: true, glass: false },
};

export function ShadowGeneratorTool() {
  const [h, setH] = useLocalStorageState<number>("koalatools_shadow_h", 0);
  const [v, setV] = useLocalStorageState<number>("koalatools_shadow_v", 12);
  const [blur, setBlur] = useLocalStorageState<number>("koalatools_shadow_blur", 24);
  const [spread, setSpread] = useLocalStorageState<number>("koalatools_shadow_spread", -4);
  const [color, setColor] = useLocalStorageState<string>("koalatools_shadow_color", "#000000");
  const [opacity, setOpacity] = useLocalStorageState<number>("koalatools_shadow_opacity", 0.12);
  const [inset, setInset] = useLocalStorageState<boolean>("koalatools_shadow_inset", false);
  const [glass, setGlass] = useLocalStorageState<boolean>("koalatools_shadow_glass", false);
  const [previewBg, setPreviewBg] = useState<"light" | "dark" | "pattern">("light");

  const [copiedCss, setCopiedCss] = useState(false);
  const [copiedTailwind, setCopiedTailwind] = useState(false);

  // Convert hex + opacity to rgba
  const rgbaColor = useMemo(() => {
    const hex = color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }, [color, opacity]);

  const shadowString = useMemo(() => {
    return `${inset ? "inset " : ""}${h}px ${v}px ${blur}px ${spread}px ${rgbaColor}`;
  }, [inset, h, v, blur, spread, rgbaColor]);

  const tailwindClass = useMemo(() => {
    const cleanedString = shadowString.replace(/\s+/g, "_").replace(/,/g, "");
    return `shadow-[${cleanedString}]`;
  }, [shadowString]);

  const cssRule = useMemo(() => {
    return `box-shadow: ${shadowString};`;
  }, [shadowString]);

  const applyPreset = (presetKey: keyof typeof PRESETS) => {
    const p = PRESETS[presetKey];
    setH(p.h);
    setV(p.v);
    setBlur(p.blur);
    setSpread(p.spread);
    setColor(p.color);
    setOpacity(p.opacity);
    setInset(p.inset);
    setGlass(p.glass);
  };

  const copyText = async (text: string, setCopied: (v: boolean) => void) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Controls Column */}
      <div className="lg:col-span-3 space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-2">
          <Sliders className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Adjust Parameters</h3>
        </div>

        {/* Presets */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" /> Quick Presets
          </label>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(PRESETS).map(([key, p]) => (
              <Button key={key} variant="outline" size="sm" onClick={() => applyPreset(key as keyof typeof PRESETS)}>
                {p.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium">
              <span>Horizontal Offset ({h}px)</span>
            </div>
            <input
              type="range"
              min={-50}
              max={50}
              value={h}
              onChange={(e) => setH(parseInt(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium">
              <span>Vertical Offset ({v}px)</span>
            </div>
            <input
              type="range"
              min={-50}
              max={50}
              value={v}
              onChange={(e) => setV(parseInt(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium">
              <span>Blur Radius ({blur}px)</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={blur}
              onChange={(e) => setBlur(parseInt(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium">
              <span>Spread Radius ({spread}px)</span>
            </div>
            <input
              type="range"
              min={-50}
              max={50}
              value={spread}
              onChange={(e) => setSpread(parseInt(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium">Color</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 rounded border border-border cursor-pointer bg-transparent"
                />
                <span className="font-mono text-xs uppercase">{color}</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span>Opacity ({Math.round(opacity * 100)}%)</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inset}
                onChange={(e) => setInset(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary bg-background"
              />
              Inset Shadow
            </label>
            <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={glass}
                onChange={(e) => setGlass(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary bg-background"
              />
              Glassmorphism Preview
            </label>
          </div>
        </div>
      </div>

      {/* Visual Preview Column */}
      <div className="lg:col-span-2 space-y-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Live Preview</h3>
            </div>
            <div className="flex gap-1">
              {(["light", "dark", "pattern"] as const).map((bg) => (
                <button
                  key={bg}
                  onClick={() => setPreviewBg(bg)}
                  className={`px-1.5 py-0.5 text-[10px] font-bold rounded capitalize border ${
                    previewBg === bg
                      ? "bg-foreground text-background border-foreground"
                      : "bg-card border-border hover:bg-muted"
                  }`}
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>

          <div
            className={`w-full h-48 rounded-xl flex items-center justify-center border border-border/60 transition-all ${
              previewBg === "light"
                ? "bg-slate-100"
                : previewBg === "dark"
                ? "bg-slate-900"
                : "bg-checkered"
            }`}
          >
            <div
              style={{ boxShadow: shadowString }}
              className={`w-28 h-28 rounded-2xl flex flex-col items-center justify-center p-3 text-center transition-all ${
                glass
                  ? "bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-md"
                  : "bg-card border border-border"
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Preview</span>
              {glass && <span className="text-[9px] font-medium text-emerald-400 mt-1 font-mono">Backdrop</span>}
            </div>
          </div>
        </div>

        {/* Code Output Box */}
        <div className="space-y-3 pt-3">
          <div className="flex items-center gap-2 border-b border-border/60 pb-2">
            <Code className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Generated Code</h3>
          </div>

          <div className="space-y-2">
            <div className="space-y-1">
              <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-muted-foreground uppercase">Tailwind v4</span>
                <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px] gap-1" onClick={() => copyText(tailwindClass, setCopiedTailwind)}>
                  {copiedTailwind ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />} {copiedTailwind ? "Copied" : "Copy"}
                </Button>
              </div>
              <input readOnly value={tailwindClass} className="w-full px-3 py-1.5 bg-muted/60 border border-border rounded-lg font-mono text-[10px] focus:outline-none" />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-muted-foreground uppercase">Standard CSS</span>
                <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px] gap-1" onClick={() => copyText(cssRule, setCopiedCss)}>
                  {copiedCss ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />} {copiedCss ? "Copied" : "Copy"}
                </Button>
              </div>
              <input readOnly value={cssRule} className="w-full px-3 py-1.5 bg-muted/60 border border-border rounded-lg font-mono text-[10px] focus:outline-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
