"use client";

import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import {
  Sun,
  Moon,
  Terminal,
  Compass,
  Check,
  RotateCcw,
  Save,
  Layers,
  Code,
  Eye,
  Grid,
} from "lucide-react";

interface UserPreferences {
  appTheme: string;
  snippetDensity: "compact" | "preview" | "full";
  syntaxTheme: string;
  bgPattern: string;
}

interface AppearanceSettingsFormProps {
  initialPreferences: UserPreferences;
}

interface SyntaxThemeColors {
  bg: string;
  keyword: string;
  string: string;
  comment: string;
  function: string;
  text: string;
}

const SYNTAX_THEME_COLORS: Record<string, SyntaxThemeColors> = {
  "github-dark": {
    bg: "#24292e",
    keyword: "#f97583",
    string: "#9ecbff",
    comment: "#6a737d",
    function: "#b392f0",
    text: "#e1e4e6",
  },
  dracula: {
    bg: "#282a36",
    keyword: "#ff79c6",
    string: "#f1fa8c",
    comment: "#6272a4",
    function: "#50fa7b",
    text: "#f8f8f2",
  },
  nord: {
    bg: "#2e3440",
    keyword: "#81a1c1",
    string: "#a3be8c",
    comment: "#4c566a",
    function: "#88c0d0",
    text: "#d8dee9",
  },
  poimandres: {
    bg: "#1b1e28",
    keyword: "#5fb3b3",
    string: "#5de4c7",
    comment: "#a6accd",
    function: "#addb67",
    text: "#e4f0fb",
  },
  "github-light": {
    bg: "#ffffff",
    keyword: "#d73a49",
    string: "#032f62",
    comment: "#6a737d",
    function: "#6f42c1",
    text: "#24292e",
  },
  monokai: {
    bg: "#272822",
    keyword: "#f92672",
    string: "#e6db74",
    comment: "#75715e",
    function: "#a6e22e",
    text: "#f8f8f2",
  },
};

const APP_THEMES = [
  {
    id: "theme-dark",
    name: "Default Dark",
    description: "Deep obsidian tones with crisp light elements",
    icon: Moon,
    class: "theme-dark",
    colors: ["bg-[#0a0c10]", "border-accent", "text-[#f0f3f6]"],
  },
  {
    id: "theme-midnight",
    name: "Midnight Blue",
    description: "Royal navy tones with elegant azure highlights",
    icon: Compass,
    class: "theme-midnight",
    colors: ["bg-[#0b101b]", "border-accent", "text-[#f0f5ff]"],
  },
  {
    id: "theme-nord",
    name: "Nordic Frost",
    description: "Cool gray-blue tones inspired by arctic elegance",
    icon: Compass,
    class: "theme-nord",
    colors: ["bg-[#2e3440]", "border-[#3b4252]", "text-[#eceff4]"],
  },
  {
    id: "theme-dracula",
    name: "Dracula",
    description: "Rich, vibrant plum tones with neon accents",
    icon: Terminal,
    class: "theme-dracula",
    colors: ["bg-[#282a36]", "border-[#bd93f9]", "text-[#f8f8f2]"],
  },
  {
    id: "theme-terracotta",
    name: "Cozy Terracotta",
    description: "Warm organic clay-brown tones with earthy accents",
    icon: Sun,
    class: "theme-terracotta",
    colors: ["bg-[#231c19]", "border-[#d35400]", "text-[#ede6e0]"],
  },
  {
    id: "theme-hacker",
    name: "Hacker Green",
    description: "High contrast terminal aesthetic with neon phosphor glow",
    icon: Terminal,
    class: "theme-hacker",
    colors: ["bg-[#010501]", "border-[#003300]", "text-[#4af626]"],
  },
  {
    id: "light",
    name: "Light Mode",
    description: "Clean, crisp, light-mode reading experience",
    icon: Sun,
    class: "light",
    colors: ["bg-white", "border-zinc-200", "text-zinc-900"],
  },
];

const DENSITIES = [
  {
    id: "compact",
    name: "Compact",
    description: "Optimized checklist of titles and tags",
    icon: Layers,
  },
  {
    id: "preview",
    name: "Preview (5 lines)",
    description: "Server-side dynamic 5-line syntax highlights",
    icon: Eye,
  },
  {
    id: "full",
    name: "Full Code",
    description: "Uncapped high-fidelity code display",
    icon: Code,
  },
];

const SYNTAX_THEMES = [
  { id: "github-dark", name: "GitHub Dark", type: "Dark" },
  { id: "dracula", name: "Dracula", type: "Dark" },
  { id: "nord", name: "Nord", type: "Dark" },
  { id: "poimandres", name: "Poimandres", type: "Dark" },
  { id: "monokai", name: "Monokai", type: "Dark" },
  { id: "github-light", name: "GitHub Light", type: "Light" },
];

const BG_PATTERNS = [
  {
    id: "flat",
    name: "Solid Flat",
    description: "Standard theme background without pattern",
  },
  {
    id: "dots",
    name: "Subtle Dots",
    description: "Premium engineering dotted grid matrix",
  },
  {
    id: "grid",
    name: "Mesh Grid",
    description: "Precise engineering overlapping coordinates",
  },
  {
    id: "gradient",
    name: "Soft Glow",
    description: "Ambient top radial light source depth fade",
  },
  {
    id: "drift",
    name: "Drifting Dust",
    description: "Slow hardware-accelerated drifting particle matrix",
  },
  {
    id: "aurora",
    name: "Breathing Aurora",
    description: "Extremely slow breathing ambient orb glow",
  },
  {
    id: "silk",
    name: "Flowing Silk",
    description: "Soft diagonal flowing silk animation back & forth",
  },
  {
    id: "topo",
    name: "Topographic Map",
    description: "Elegant contour lines mapping elevation",
  },
  {
    id: "nodes",
    name: "Constellation",
    description: "Floating network of connected nodes",
  },
  {
    id: "hex",
    name: "Hexagon Grid",
    description: "Cyberpunk structural honeycomb matrix",
  },
  {
    id: "matrix",
    name: "Binary Matrix",
    description: "Slow drifting vertical binary sequences",
  },
  {
    id: "circuit",
    name: "Circuit Board",
    description: "Tech-inspired orthogonal data paths",
  },
];

export function AppearanceSettingsForm({ initialPreferences }: AppearanceSettingsFormProps) {
  const { addToast } = useToast();
  const router = useRouter();

  const [appTheme, setAppTheme] = useState(initialPreferences.appTheme);
  const [snippetDensity, setSnippetDensity] = useState<"compact" | "preview" | "full">(initialPreferences.snippetDensity);
  const [syntaxTheme, setSyntaxTheme] = useState(initialPreferences.syntaxTheme);
  const [bgPattern, setBgPattern] = useState(initialPreferences.bgPattern ?? "flat");
  const [isSaving, setIsSaving] = useState(false);
  const isSavedRef = useRef(false);

  // Apply visual theme and pattern preview on HTML document tag dynamically
  useEffect(() => {
    document.documentElement.className = `${appTheme} bg-pattern-${bgPattern}`;
  }, [appTheme, bgPattern]);

  // Restore initial theme and pattern on cancel or unmount if not saved
  useEffect(() => {
    return () => {
      if (!isSavedRef.current) {
        document.documentElement.className = `${initialPreferences.appTheme} bg-pattern-${initialPreferences.bgPattern ?? "flat"}`;
      }
    };
  }, [initialPreferences.appTheme, initialPreferences.bgPattern]);

  const handleReset = () => {
    setAppTheme(initialPreferences.appTheme);
    setSnippetDensity(initialPreferences.snippetDensity);
    setSyntaxTheme(initialPreferences.syntaxTheme);
    setBgPattern(initialPreferences.bgPattern ?? "flat");
    addToast("Settings reverted to saved values", "info");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch("/api/settings/appearance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appTheme,
          snippetDensity,
          syntaxTheme,
          bgPattern,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      isSavedRef.current = true;
      addToast("Appearance settings saved successfully!", "success");
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Error saving settings";
      addToast(message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Render a live mockup of a code card snippet
  const mockColors = SYNTAX_THEME_COLORS[syntaxTheme] || SYNTAX_THEME_COLORS["github-dark"];

  return (
    <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left side: Controls */}
      <div className="lg:col-span-7 space-y-8">
        
        {/* APP THEME SECTION */}
        <div className="rounded-xl border border-border bg-card/40 p-6 backdrop-blur-md shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Sun className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Application Theme</h2>
              <p className="text-xs text-muted-foreground">Select the default background and styling for the entire interface</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {APP_THEMES.map((theme) => {
              const Icon = theme.icon;
              const isSelected = appTheme === theme.class;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setAppTheme(theme.class)}
                  className={`flex flex-col items-start text-left p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border bg-muted/10 hover:border-muted-foreground/30 hover:bg-muted/20"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-sm font-semibold">{theme.name}</span>
                    </div>
                    {isSelected && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                    {theme.description}
                  </p>
                  
                  {/* Theme swatch visual */}
                  <div className={`flex gap-1.5 p-1.5 w-full rounded-md border text-[9px] font-mono leading-none ${theme.colors[0]} ${theme.colors[1]} ${theme.colors[2]}`}>
                    <span className="opacity-50">#</span>
                    <span>{theme.id.replace("theme-", "")}</span>
                    <span className="ml-auto flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      <span className="h-2 w-2 rounded-full bg-accent" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* SNIPPET DENSITY SECTION */}
        <div className="rounded-xl border border-border bg-card/40 p-6 backdrop-blur-md shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">List Density & Preview</h2>
              <p className="text-xs text-muted-foreground">Configure how much code metadata is displayed in snippet listings</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {DENSITIES.map((density) => {
              const Icon = density.icon;
              const isSelected = snippetDensity === density.id;
              return (
                <button
                  key={density.id}
                  type="button"
                  onClick={() => setSnippetDensity(density.id as UserPreferences["snippetDensity"])}
                  className={`flex items-center text-left p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border bg-muted/10 hover:border-muted-foreground/30 hover:bg-muted/20"
                  }`}
                >
                  <div className="p-2 rounded-lg bg-muted border border-border text-muted-foreground mr-4">
                    <Icon className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-semibold block">{density.name}</span>
                    <span className="text-xs text-muted-foreground leading-normal mt-0.5 block">{density.description}</span>
                  </div>
                  {isSelected && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground ml-3 shrink-0">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* BACKGROUND PATTERN SECTION */}
        <div className="rounded-xl border border-border bg-card/40 p-6 backdrop-blur-md shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Grid className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Background Pattern</h2>
              <p className="text-xs text-muted-foreground">Choose a high-performance pure CSS backdrop pattern</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {BG_PATTERNS.map((pattern) => {
              const isSelected = bgPattern === pattern.id;
              return (
                <button
                  key={pattern.id}
                  type="button"
                  onClick={() => setBgPattern(pattern.id)}
                  className={`flex flex-col p-3 rounded-lg border text-left transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border bg-muted/10 hover:border-muted-foreground/30 hover:bg-muted/20"
                  }`}
                >
                  <span className="text-xs font-semibold block">{pattern.name}</span>
                  <span className="text-[10px] text-muted-foreground block mb-2">{pattern.description}</span>
                  
                  {/* Miniature swatch visual representing the pattern */}
                  <div
                    className={`mt-auto h-8 w-full rounded border border-border/40 bg-background bg-pattern-container bg-pattern-${pattern.id}`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* SYNTAX HIGHLIGHTING SECTION */}
        <div className="rounded-xl border border-border bg-card/40 p-6 backdrop-blur-md shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Code className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Syntax Highlighting Theme</h2>
              <p className="text-xs text-muted-foreground">Select the high-performance color theme for syntax highlighting</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {SYNTAX_THEMES.map((theme) => {
              const isSelected = syntaxTheme === theme.id;
              const themeColors = SYNTAX_THEME_COLORS[theme.id];
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSyntaxTheme(theme.id)}
                  className={`flex flex-col p-3 rounded-lg border text-left transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border bg-muted/10 hover:border-muted-foreground/30 hover:bg-muted/20"
                  }`}
                >
                  <span className="text-xs font-semibold truncate block">{theme.name}</span>
                  <span className="text-[9px] text-muted-foreground block mb-2">{theme.type} theme</span>
                  
                  {/* Miniature swatch visual representing the highlighting theme */}
                  <div
                    style={{ backgroundColor: themeColors.bg }}
                    className="mt-auto h-6 w-full rounded border border-white/5 flex items-center justify-around px-1.5"
                  >
                    <span style={{ color: themeColors.keyword }} className="text-[8px] font-bold">fn</span>
                    <span style={{ color: themeColors.function }} className="text-[8px] font-bold">()</span>
                    <span style={{ color: themeColors.string }} className="text-[8px] font-bold">{"\"\""}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-4 pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-border hover:bg-accent/40 text-sm font-medium transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Defaults
          </button>
          
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-sm font-medium shadow-md shadow-primary/10 transition-colors cursor-pointer disabled:opacity-50 flex-1 sm:flex-initial sm:ml-auto"
          >
            {isSaving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Settings
              </>
            )}
          </button>
        </div>

      </div>

      {/* Right side: Mockup Live Preview Card */}
      <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Live Preview (Interactive)</h3>
          <span className="px-2 py-0.5 rounded bg-success/10 text-success text-[10px] font-medium border border-success/20 animate-pulse">
            Active Mockup
          </span>
        </div>

        <div className={`p-1 rounded-2xl border border-border bg-background shadow-2xl relative overflow-hidden transition-all duration-300 bg-pattern-container bg-pattern-${bgPattern}`}>
          
          {/* Glassmorphic card frame */}
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-destructive/60" />
                <span className="h-3 w-3 rounded-full bg-warning/60" />
                <span className="h-3 w-3 rounded-full bg-success/60" />
              </div>
              <span className="text-[10px] text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded border border-border">
                Dashboard Snippet Preview
              </span>
            </div>

            {/* Simulated Snippet Card inside the dashboard */}
            <div className="border border-border/75 rounded-xl p-4 bg-muted/10 shadow-sm relative group overflow-hidden">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm leading-tight text-foreground">quickSort.js</h4>
                  <p className="text-[11px] text-muted-foreground leading-normal line-clamp-2">
                    An optimized recursive quicksort implementation with inline pivot selection.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-mono border border-primary/20 shrink-0 font-medium">
                  javascript
                </span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                <span className="px-1.5 py-0.5 rounded bg-muted/60 text-[9px] text-muted-foreground border border-border font-medium">
                  algorithm
                </span>
                <span className="px-1.5 py-0.5 rounded bg-muted/60 text-[9px] text-muted-foreground border border-border font-medium">
                  sorting
                </span>
                <span className="px-1.5 py-0.5 rounded bg-muted/60 text-[9px] text-muted-foreground border border-border font-medium">
                  recursion
                </span>
              </div>

              {/* Code display based on density */}
              {snippetDensity === "compact" ? (
                <div className="mt-3 p-2 bg-muted/50 rounded-lg text-[10px] border border-border/40 text-center text-muted-foreground flex items-center justify-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  <span>Code snippet hidden (Compact Density)</span>
                </div>
              ) : (
                <div className="mt-3 relative overflow-hidden rounded-lg">
                  <pre
                    style={{ backgroundColor: mockColors.bg, color: mockColors.text }}
                    className="p-3 font-mono text-[10px] overflow-x-auto leading-relaxed border border-border/60 shadow-inner select-none [&>span]:block"
                  >
                    {snippetDensity === "preview" ? (
                      <>
                        <span><span style={{ color: mockColors.comment }}>{"// Quick sort implementation"}</span></span>
                        <span><span style={{ color: mockColors.keyword }}>function</span> <span style={{ color: mockColors.function }}>quickSort</span>(arr) {'{'}</span>
                        <span>  <span style={{ color: mockColors.keyword }}>if</span> (arr.length &lt;= <span style={{ color: mockColors.string }}>1</span>) <span style={{ color: mockColors.keyword }}>return</span> arr;</span>
                        <span>  <span style={{ color: mockColors.keyword }}>const</span> pivot = arr[<span style={{ color: mockColors.string }}>0</span>];</span>
                        <span>  <span style={{ color: mockColors.keyword }}>const</span> left = arr.<span style={{ color: mockColors.function }}>slice</span>(<span style={{ color: mockColors.string }}>1</span>).<span style={{ color: mockColors.function }}>filter</span>(x =&gt; x &lt; pivot);</span>
                        <span className="opacity-40 italic text-[9px] pl-1"><span style={{ color: mockColors.comment }}>{"... (truncated to 5 lines)"}</span></span>
                      </>
                    ) : (
                      <>
                        <span><span style={{ color: mockColors.comment }}>{"// Quick sort implementation"}</span></span>
                        <span><span style={{ color: mockColors.keyword }}>function</span> <span style={{ color: mockColors.function }}>quickSort</span>(arr) {'{'}</span>
                        <span>  <span style={{ color: mockColors.keyword }}>if</span> (arr.length &lt;= <span style={{ color: mockColors.string }}>1</span>) <span style={{ color: mockColors.keyword }}>return</span> arr;</span>
                        <span>  <span style={{ color: mockColors.keyword }}>const</span> pivot = arr[<span style={{ color: mockColors.string }}>0</span>];</span>
                        <span>  <span style={{ color: mockColors.keyword }}>const</span> left = arr.<span style={{ color: mockColors.function }}>slice</span>(<span style={{ color: mockColors.string }}>1</span>).<span style={{ color: mockColors.function }}>filter</span>(x =&gt; x &lt; pivot);</span>
                        <span>  <span style={{ color: mockColors.keyword }}>const</span> right = arr.<span style={{ color: mockColors.function }}>slice</span>(<span style={{ color: mockColors.string }}>1</span>).<span style={{ color: mockColors.function }}>filter</span>(x =&gt; x &gt;= pivot);</span>
                        <span>  <span style={{ color: mockColors.keyword }}>return</span> [...<span style={{ color: mockColors.function }}>quickSort</span>(left), pivot, ...<span style={{ color: mockColors.function }}>quickSort</span>(right)];</span>
                        <span>{'}'}</span>
                      </>
                    )}
                  </pre>
                </div>
              )}

              {/* Card Footer info */}
              <div className="mt-3 flex items-center justify-between text-[9px] text-muted-foreground border-t border-border/50 pt-2 shrink-0">
                <span>Created 2 hours ago</span>
                <span>PUBLIC</span>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </form>
  );
}
