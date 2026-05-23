"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  exiting?: boolean;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (message: string, type?: "success" | "error" | "info") => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_TOASTS = 5;
const TOAST_DURATION = 3000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.map((t) => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);
  }, []);

  const addToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    const id = crypto.randomUUID();
    setToasts((prev) => {
      const next = [...prev, { id, message, type }];
      if (next.length > MAX_TOASTS) {
        const oldest = next[0];
        next[0] = { ...oldest, exiting: true };
        setTimeout(() => {
          setToasts((current) => current.filter((t) => t.id !== oldest.id));
        }, 200);
      }
      return next;
    });
    setTimeout(() => {
      setToasts((prev) => {
        const toast = prev.find((t) => t.id === id);
        if (toast && !toast.exiting) {
          return prev.map((t) => t.id === id ? { ...t, exiting: true } : t);
        }
        return prev;
      });
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 200);
    }, TOAST_DURATION);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastContainer() {
  const { toasts, removeToast } = useContext(ToastContext)!;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && toasts.length > 0) {
        removeToast(toasts[toasts.length - 1].id);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toasts, removeToast]);

  if (toasts.length === 0) return null;

  const typeStyles = {
    success: "bg-emerald-600/95 text-white border-emerald-500/30",
    error: "bg-red-600/95 text-white border-red-500/30",
    info: "bg-primary/95 text-primary-foreground border-primary/30",
  };

  const typeRoles = {
    success: "status",
    error: "alert",
    info: "status",
  } as const;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-xs"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={typeRoles[toast.type]}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg text-sm font-medium transition-all duration-200 ${
            toast.exiting
              ? "opacity-0 translate-x-4 scale-95"
              : "opacity-100 translate-x-0 scale-100 animate-in slide-in-from-bottom-2"
          } ${typeStyles[toast.type]}`}
        >
          <span className="flex-1">{toast.message}</span>
          <button
            type="button"
            onClick={() => removeToast(toast.id)}
            className="opacity-70 hover:opacity-100 transition-opacity flex-shrink-0"
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
