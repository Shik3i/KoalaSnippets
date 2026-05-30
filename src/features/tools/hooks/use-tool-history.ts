"use client";

import { useLocalStorageState } from "./use-local-storage-state";

export interface ToolHistoryItem<T> {
  id: string;
  timestamp: number;
  payload: T;
}

export function useToolHistory<T>(key: string, maxItems = 10) {
  const [history, setHistory] = useLocalStorageState<ToolHistoryItem<T>[]>(key, []);

  const addToHistory = (payload: T) => {
    const newItem: ToolHistoryItem<T> = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      payload,
    };
    
    setHistory((prev) => {
      // Filter out exact duplicates based on stringified payload
      const strNew = JSON.stringify(payload);
      const filtered = prev.filter((item) => JSON.stringify(item.payload) !== strNew);
      return [newItem, ...filtered].slice(0, maxItems);
    });
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return {
    history,
    addToHistory,
    clearHistory,
  };
}
