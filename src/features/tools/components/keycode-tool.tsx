"use client";

import { useState, useEffect, useRef } from "react";
import { Keyboard, ShieldAlert, RotateCcw, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KeypressLog {
  id: string;
  key: string;
  code: string;
  keyCode: number;
  ctrl: boolean;
  meta: boolean;
  alt: boolean;
  shift: boolean;
  time: string;
}

export function KeycodeTool() {
  const [active, setActive] = useState(true);
  const [currentKey, setCurrentKey] = useState<KeypressLog | null>(null);
  const [history, setHistory] = useState<KeypressLog[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 1. Intercept event in capturing phase & block any global shortcuts (Ctrl+K, Vim, etc.)
      e.preventDefault();
      e.stopPropagation();

      const logItem: KeypressLog = {
        id: crypto.randomUUID(),
        key: e.key === " " ? "Space" : e.key,
        code: e.code,
        keyCode: e.keyCode,
        ctrl: e.ctrlKey,
        meta: e.metaKey,
        alt: e.altKey,
        shift: e.shiftKey,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };

      setCurrentKey(logItem);
      setHistory((prev) => [logItem, ...prev].slice(0, 8));
    };

    // Use capturing phase ({ capture: true }) to execute BEFORE KoalaSnippets' global shortcuts
    window.addEventListener("keydown", handleGlobalKeyDown, { capture: true });

    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown, { capture: true });
    };
  }, [active]);

  const clearInspector = () => {
    setCurrentKey(null);
    setHistory([]);
  };

  return (
    <div className="space-y-6" ref={containerRef}>
      {/* Top Banner Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-muted/30 border border-border p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${active ? "bg-primary/20" : "bg-muted"}`}>
            <Keyboard size={16} className={active ? "text-primary animate-pulse" : "text-muted-foreground"} />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Keyboard Capture Inspector</h3>
            <p className="text-xs text-muted-foreground">
              {active 
                ? "Global shortcuts are locked. Every key press is inspected below." 
                : "Capturing paused. Keyboard shortcuts will behave normally."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={active ? "destructive" : "default"}
            size="sm"
            onClick={() => setActive(!active)}
            className="gap-1.5 h-8 text-xs font-semibold"
          >
            {active ? <Square size={12} /> : <Play size={12} />}
            {active ? "Pause Capture" : "Resume Capture"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={clearInspector}
            className="gap-1.5 h-8 text-xs border-border"
          >
            <RotateCcw size={12} />
            Reset
          </Button>
        </div>
      </div>

      {active && (
        <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg">
          <ShieldAlert size={14} className="shrink-0" />
          <span>
            <strong>Anti-Trigger Guard Active:</strong> Global shortcuts (like ⌘K, Vim j/k, Escape) are safely intercepted and will not trigger while capturing is active.
          </span>
        </div>
      )}

      {/* Main Interactive Screen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Giant Key Display */}
        <div className="md:col-span-2 flex flex-col justify-center items-center bg-muted/20 border border-border rounded-2xl p-8 min-h-[300px] text-center relative overflow-hidden">
          {currentKey ? (
            <div className="w-full flex flex-col items-center animate-in zoom-in-95 duration-150">
              <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">
                Last Key Pressed
              </span>
              <div className="min-w-28 h-28 bg-card border border-border shadow-xl rounded-2xl flex items-center justify-center px-6 text-4xl font-extrabold font-mono text-primary select-none animate-in fade-in duration-200">
                {currentKey.key}
              </div>
              
              {/* Properties Grid */}
              <div className="grid grid-cols-2 gap-4 mt-8 w-full max-w-sm">
                <div className="bg-card border border-border rounded-xl p-3 flex flex-col items-center">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">e.code</span>
                  <span className="font-mono text-sm font-bold truncate max-w-full mt-0.5">{currentKey.code}</span>
                </div>
                <div className="bg-card border border-border rounded-xl p-3 flex flex-col items-center">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">e.keyCode</span>
                  <span className="font-mono text-sm font-bold text-primary mt-0.5">{currentKey.keyCode}</span>
                </div>
              </div>

              {/* Modifiers display */}
              <div className="flex flex-wrap gap-2.5 justify-center mt-6 w-full max-w-sm">
                <span className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md border transition-all ${
                  currentKey.ctrl ? "bg-violet-500/20 text-violet-400 border-violet-500/30 shadow-sm" : "bg-muted/55 text-muted-foreground border-transparent"
                }`}>
                  CTRL
                </span>
                <span className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md border transition-all ${
                  currentKey.meta ? "bg-sky-500/20 text-sky-400 border-sky-500/30 shadow-sm" : "bg-muted/55 text-muted-foreground border-transparent"
                }`}>
                  META / CMD
                </span>
                <span className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md border transition-all ${
                  currentKey.alt ? "bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-sm" : "bg-muted/55 text-muted-foreground border-transparent"
                }`}>
                  ALT
                </span>
                <span className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md border transition-all ${
                  currentKey.shift ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-sm" : "bg-muted/55 text-muted-foreground border-transparent"
                }`}>
                  SHIFT
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center mb-4 text-muted-foreground">
                <Keyboard size={32} />
              </div>
              <h3 className="font-bold text-muted-foreground">Tap keys on your keyboard</h3>
              <p className="text-xs text-muted-foreground max-w-xs mt-1 leading-relaxed">
                Click here or press any key on your keyboard to start inspecting key codes, mod states, and values.
              </p>
            </div>
          )}
        </div>

        {/* History / Sequence Log */}
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col h-[380px] overflow-hidden">
          <h3 className="text-sm font-bold mb-3 flex items-center justify-between border-b border-border pb-2 shrink-0">
            <span>Key Event Sequence</span>
            <span className="text-[10px] bg-muted px-2 py-0.5 rounded font-mono font-semibold tabular-nums text-muted-foreground">
              {history.length} captured
            </span>
          </h3>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {history.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                No key sequences registered
              </div>
            ) : (
              history.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-2 bg-muted/30 border border-border rounded-lg text-xs font-mono animate-in slide-in-from-right-2 duration-150"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="px-1.5 py-0.5 bg-card border border-border rounded font-bold text-primary shrink-0">
                      {log.key}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate" title={log.code}>
                      {log.code}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] bg-card border border-border px-1 rounded font-bold">
                      {log.keyCode}
                    </span>
                    <span className="text-[9px] opacity-60 tabular-nums">{log.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
