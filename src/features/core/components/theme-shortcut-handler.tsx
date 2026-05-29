"use client";

import { useKeyboardShortcuts } from "@/features/snippets/utils/keyboard-shortcuts";
import { useToast } from "@/components/ui/toast";

const THEMES = [
  { id: "theme-dark", name: "Default Dark" },
  { id: "theme-midnight", name: "Midnight Blue" },
  { id: "theme-nord", name: "Nordic Frost" },
  { id: "theme-dracula", name: "Dracula" },
  { id: "theme-terracotta", name: "Cozy Terracotta" },
  { id: "theme-hacker", name: "Hacker Green" },
  { id: "light", name: "Light Mode" },
];

export function ThemeShortcutHandler() {
  const { addToast } = useToast();

  useKeyboardShortcuts({
    onToggleTheme: () => {
      const html = document.documentElement;
      const currentTheme = Array.from(html.classList).find(
        (c) => c.startsWith("theme-") || c === "light"
      ) || "theme-midnight";

      const currentIndex = THEMES.findIndex((t) => t.id === currentTheme);
      const nextIndex = (currentIndex + 1) % THEMES.length;
      const nextTheme = THEMES[nextIndex];

      // Update HTML class list
      THEMES.forEach((theme) => {
        html.classList.remove(theme.id);
      });
      html.classList.add(nextTheme.id);

      // Update Cookie preserving other settings
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(";").shift();
        return null;
      };

      let prefs: Record<string, unknown> = {};
      const cookieVal = getCookie("koala_appearance");
      if (cookieVal) {
        try {
          prefs = JSON.parse(decodeURIComponent(cookieVal));
        } catch {}
      }
      prefs.appTheme = nextTheme.id;
      document.cookie = `koala_appearance=${encodeURIComponent(
        JSON.stringify(prefs)
      )}; path=/; max-age=31536000; SameSite=Lax`;

      // Persist to user profile
      fetch("/api/settings/appearance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appTheme: nextTheme.id }),
      }).catch(console.error);

      addToast(`Theme rotated to: ${nextTheme.name}`, "success");
    },
  });

  return null;
}
