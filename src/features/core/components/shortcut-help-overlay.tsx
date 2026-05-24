"use client";

import { useState, useEffect } from "react";
import { ShortcutHelp } from "@/features/core/components/shortcut-help";

export function ShortcutHelpOverlay() {
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

  return <ShortcutHelp open={open} onClose={() => setOpen(false)} />;
}
