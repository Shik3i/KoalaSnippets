"use client";

import { useEffect, useState, useMemo } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const shortcuts = [
  { keys: ["⌘K", "CtrlK"], description: "Command Palette" },
  { keys: ["⌘G", "CtrlG"], description: "Go to Line (in snippet view)" },
  { keys: ["⌘S", "CtrlS"], description: "Save (in editor)" },
  { keys: ["/"], description: "Focus search" },
  { keys: ["Escape"], description: "Close modals, clear search, dismiss toasts" },
  { keys: ["?"], description: "Show this help" },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-[11px] font-mono bg-muted/60 border border-border rounded shadow-sm">
      {children}
    </kbd>
  );
}

function ShortcutRow({ shortcut }: { shortcut: (typeof shortcuts)[number] }) {
  const isMac = useMemo(
    () => typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform),
    []
  );

  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.03] transition-colors">
      <span className="text-sm text-muted-foreground">{shortcut.description}</span>
      <div className="flex items-center gap-1.5 shrink-0 ml-4">
        {shortcut.keys.map((key, i) => {
          const displayKey = key === "⌘K" || key === "CtrlK"
            ? (isMac ? "⌘K" : "Ctrl+K")
            : key === "⌘G" || key === "CtrlG"
              ? (isMac ? "⌘G" : "Ctrl+G")
              : key === "⌘S" || key === "CtrlS"
                ? (isMac ? "⌘S" : "Ctrl+S")
                : key;
          return (
            <span key={key} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-muted-foreground/50 text-xs">or</span>}
              <Kbd>{displayKey}</Kbd>
            </span>
          );
        })}
      </div>
    </div>
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
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-sm mx-4 backdrop-blur-xl bg-card/95 border border-border/50 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <h2 className="text-sm font-semibold text-foreground">Keyboard Shortcuts</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close shortcuts">
            <X size={14} />
          </Button>
        </div>

        <div className="py-2">
          {shortcuts.map((shortcut) => (
            <ShortcutRow key={shortcut.description} shortcut={shortcut} />
          ))}
        </div>

        <div className="flex items-center justify-between px-4 py-2 bg-white/[0.02] border-t border-border/50 text-[10px] text-muted-foreground">
          <span>Press ? to toggle</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}

export function useShortcutHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = document.activeElement?.tagName;
      const isEditable = tag === "INPUT" || tag === "TEXTAREA" || (document.activeElement as HTMLElement)?.isContentEditable;
      if (e.key === "?" && !isEditable) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { open, setOpen, ShortcutHelpOverlay: () => <ShortcutHelp open={open} onClose={() => setOpen(false)} /> };
}
