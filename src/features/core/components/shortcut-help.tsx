"use client";

import { useEffect, useSyncExternalStore } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const shortcuts = [
  { keys: ["⌘K", "CtrlK"], description: "Command Palette" },
  { keys: ["⌘S", "CtrlS"], description: "Save (in editor)" },
  { keys: ["⌘⇧F", "CtrlShiftF"], description: "Format Code (in editor)" },
  { keys: ["⌘⇧N", "CtrlShiftN"], description: "New Snippet" },
  { keys: ["⌘⇧D", "CtrlShiftD"], description: "Duplicate Snippet" },
  { keys: ["⌘⇧T", "CtrlShiftT"], description: "Open Trash" },
  { keys: ["⌘⇧H", "CtrlShiftH"], description: "Cycle Theme" },
  { keys: ["⌘G", "CtrlG"], description: "Go to Line (in snippet view)" },
  { keys: ["/"], description: "Focus search" },
  { keys: ["J"], description: "Next snippet (grid/table)" },
  { keys: ["K"], description: "Previous snippet (grid/table)" },
  { keys: ["Enter"], description: "Open selected snippet" },
  { keys: ["F"], description: "Toggle favorite" },
  { keys: ["P"], description: "Toggle pin" },
  { keys: ["Delete"], description: "Delete snippet" },
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
  const isMac = useSyncExternalStore(
    () => () => {},
    () => /Mac|iPod|iPhone|iPad/.test(navigator.platform),
    () => false
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
                : key === "⌘⇧F" || key === "CtrlShiftF"
                  ? (isMac ? "⌘⇧F" : "Ctrl+Shift+F")
                  : key === "⌘⇧N" || key === "CtrlShiftN"
                    ? (isMac ? "⌘⇧N" : "Ctrl+Shift+N")
                    : key === "⌘⇧D" || key === "CtrlShiftD"
                      ? (isMac ? "⌘⇧D" : "Ctrl+Shift+D")
                      : key === "⌘⇧T" || key === "CtrlShiftT"
                        ? (isMac ? "⌘⇧T" : "Ctrl+Shift+T")
                        : key === "⌘⇧H" || key === "CtrlShiftH"
                          ? (isMac ? "⌘⇧H" : "Ctrl+Shift+H")
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

        <div className="py-2 max-h-[60vh] overflow-y-auto">
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
