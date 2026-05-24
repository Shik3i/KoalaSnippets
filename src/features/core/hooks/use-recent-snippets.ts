"use client";

import { useState, useEffect } from "react";

export interface RecentSnippet {
  id: string;
  title: string;
  timestamp: number;
}

const STORAGE_KEY = "koalasnippets_recent";
const MAX_RECENT = 10;

export function useRecentSnippets() {
  const [recentSnippets, setRecentSnippets] = useState<RecentSnippet[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        // eslint-disable-next-line
        setRecentSnippets(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to load recent snippets", err);
    }
  }, []);

  const addRecentSnippet = (id: string, title: string) => {
    setRecentSnippets((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      const newRecent = [{ id, title, timestamp: Date.now() }, ...filtered].slice(0, MAX_RECENT);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecent));
      } catch (err) {
        console.error("Failed to save recent snippet", err);
      }
      return newRecent;
    });
  };

  return { recentSnippets, addRecentSnippet };
}
