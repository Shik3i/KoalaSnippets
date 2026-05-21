"use client";

import { useEffect, useCallback, type RefObject } from "react";

interface UseKeyboardShortcutsOptions {
  searchInputRef?: RefObject<HTMLInputElement | null>;
  onSave?: () => void;
}

export function useKeyboardShortcuts({ searchInputRef, onSave }: UseKeyboardShortcutsOptions = {}) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (searchInputRef?.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
      }

      if (modifier && e.key.toLowerCase() === "s") {
        e.preventDefault();
        onSave?.();
      }
    },
    [searchInputRef, onSave]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
