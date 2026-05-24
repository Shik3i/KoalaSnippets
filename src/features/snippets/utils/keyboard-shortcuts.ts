"use client";

import { useEffect, useCallback, type RefObject } from "react";
import { useRouter } from "next/navigation";

interface UseKeyboardShortcutsOptions {
  searchInputRef?: RefObject<HTMLInputElement | null>;
  onSave?: () => void;
}

export function useKeyboardShortcuts({ searchInputRef, onSave }: UseKeyboardShortcutsOptions = {}) {
  const router = useRouter();

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

      if (modifier && (e.key.toLowerCase() === "s" || e.key === "Enter")) {
        if (e.key === "Enter" && !e.metaKey && !e.ctrlKey) return;
        e.preventDefault();
        onSave?.();
      }

      if (e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        router.push("/dashboard/new");
      }
    },
    [searchInputRef, onSave, router]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
