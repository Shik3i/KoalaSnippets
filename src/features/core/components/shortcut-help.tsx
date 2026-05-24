"use client";

import { useState, useEffect } from "react";
import { X, Command } from "lucide-react";
import { Button } from "@/components/ui/button";

const shortcuts = [
  { category: "Navigation", items: [
    { keys: ["Ctrl", "K"], description: "Open Command Palette" },
    { keys: ["Ctrl", "N"], description: "New Snippet" },
    { keys: ["Ctrl", "Shift", "T"], description: "Open Trash" },
    { keys: ["Ctrl", "Shift", "D"], description: "Go to Dashboard" },
    { keys: ["Alt", "N"], description: "New Snippet (alt)" },
  ]},
  { category: "Editing", items: [
    { keys: ["Ctrl", "S"], description: "Save Snippet" },
    { keys: ["Ctrl", "Enter"], description: "Save Snippet" },
  ]},
  { category: "Search & Filters", items: [
    { keys: ["/"], description: "Focus Search (when not in input)" },
    { keys: ["Escape"], description: "Clear Search / Close Toast" },
    { keys: ["↑", "↓"], description: "Navigate Filter Dropdowns" },
    { keys: ["Enter"], description: "Toggle Filter Option" },
  ]},
  { category: "Modals", items: [
    { keys: ["Escape"], description: "Close Modal / Overlay" },
    { keys: ["Enter"], description: "Confirm Action" },
    { keys: ["?"], description: "Toggle this Help" },
  ]},
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-[11px] font-mono bg-muted border border-border rounded-md shadow-sm">
      {children}
    </kbd>
  );
}

export function ShortcutHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-lg mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close shortcuts">
            <X size={18} />
          </Button>
        </div>
        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {shortcuts.map((group) => (
            <div key={group.category}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{group.category}</h3>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <div key={item.description} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{item.description}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, i) => (
                        <span key={key} className="flex items-center gap-1">
                          {i > 0 && <span className="text-muted-foreground text-xs">+</span>}
                          <Kbd>{key}</Kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between px-6 py-3 bg-muted/30 border-t border-border text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1"><Command className="w-3 h-3" /> + K to launch palette</div>
          <div>Press ? to toggle this overlay</div>
        </div>
      </div>
    </div>
  );
}

export function useShortcutHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "?" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { open, setOpen, ShortcutHelpOverlay: () => <ShortcutHelp open={open} onClose={() => setOpen(false)} /> };
}
