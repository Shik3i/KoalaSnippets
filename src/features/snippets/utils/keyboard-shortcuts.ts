"use client";

import { useEffect, useCallback, type RefObject } from "react";
import { useRouter } from "next/navigation";

interface UseKeyboardShortcutsOptions {
  searchInputRef?: RefObject<HTMLInputElement | null>;
  onSave?: () => void;
  onFormat?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onToggleFavorite?: () => void;
  onTogglePin?: () => void;
  onNewSnippet?: () => void;
}

export function useKeyboardShortcuts({
  searchInputRef,
  onSave,
  onFormat,
  onDelete,
  onDuplicate,
  onToggleFavorite,
  onTogglePin,
  onNewSnippet,
}: UseKeyboardShortcutsOptions = {}) {
  const router = useRouter();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement)?.isContentEditable;
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

      if (modifier && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        onFormat?.();
      }

      if (modifier && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        if (onDuplicate) {
          onDuplicate();
        } else {
          router.push("/dashboard");
        }
      }

      if (modifier && e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        if (onNewSnippet) {
          onNewSnippet();
        } else {
          router.push("/dashboard/new");
        }
      }

      if (modifier && e.shiftKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        router.push("/dashboard/trash");
      }

      if (e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        router.push("/dashboard/new");
      }

      if (!isInput && e.key.toLowerCase() === "j") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("navigate-snippets", { detail: { direction: "down" } }));
      }

      if (!isInput && e.key.toLowerCase() === "k" && !modifier) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("navigate-snippets", { detail: { direction: "up" } }));
      }

      if (!isInput && e.key.toLowerCase() === "enter") {
        window.dispatchEvent(new CustomEvent("navigate-snippets", { detail: { direction: "open" } }));
      }

      if (!isInput && e.key.toLowerCase() === "f" && !modifier) {
        onToggleFavorite?.();
      }

      if (!isInput && e.key.toLowerCase() === "p" && !modifier) {
        onTogglePin?.();
      }

      if (!isInput && e.key === "Delete") {
        onDelete?.();
      }

      if (e.key === "?" && !isInput) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("toggle-shortcut-help"));
      }
    },
    [searchInputRef, onSave, onFormat, onDelete, onDuplicate, onToggleFavorite, onTogglePin, onNewSnippet, router],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
