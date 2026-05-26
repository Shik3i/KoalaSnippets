"use client";

import { useState, useEffect } from "react";
import { ShortcutHelp } from "@/features/core/components/shortcut-help";

export function ShortcutHelpOverlay() {
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

  return <ShortcutHelp open={open} onClose={() => setOpen(false)} />;
}
