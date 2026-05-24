import { useEffect, useRef, useState, useCallback } from "react";

export function useLocalStorageDraft<T>(key: string, data: T, delayMs: number = 3000) {
  const [hasDraft, setHasDraft] = useState(false);
  const dataRef = useRef(data);
  
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    try {
      const draft = localStorage.getItem(key);
      if (draft) {
        setTimeout(() => setHasDraft(true), 0);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [key]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify({ data: dataRef.current, timestamp: Date.now() }));
      } catch {
        // Ignore localStorage errors
      }
    }, delayMs);
    
    return () => clearTimeout(timeout);
  }, [data, key, delayMs]);

  const loadDraft = useCallback((): T | null => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.data as T;
      }
    } catch {
      // Ignore
    }
    return null;
  }, [key]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setHasDraft(false);
    } catch {
      // Ignore
    }
  }, [key]);

  return { hasDraft, loadDraft, clearDraft };
}
