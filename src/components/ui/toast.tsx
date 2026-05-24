"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  action?: ToastAction;
  exiting?: boolean;
  createdAt: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (message: string, type?: "success" | "error" | "info" | "warning", action?: ToastAction) => void;
  removeToast: (id: string) => void;
  pauseToast: (id: string) => void;
  resumeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_TOASTS = 5;
const TOAST_DURATION = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const pausedRef = useRef<Map<string, number>>(new Map());

  const clearTimer = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const scheduleDismiss = useCallback((id: string, delay: number) => {
    const timer = setTimeout(() => {
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
      timersRef.current.delete(id);
    }, delay);
    timersRef.current.set(id, timer);
  }, []);

  const removeToast = useCallback((id: string) => {
    clearTimer(id);
    pausedRef.current.delete(id);
    setToasts((prev) => prev.map((t) => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);
  }, [clearTimer]);

  const pauseToast = useCallback((id: string) => {
    clearTimer(id);
    const toast = toasts.find((t) => t.id === id);
    if (toast) {
      const elapsed = Date.now() - toast.createdAt;
      const previouslyPaused = pausedRef.current.get(id) ?? 0;
      pausedRef.current.set(id, elapsed + previouslyPaused);
    }
  }, [toasts, clearTimer]);

  const resumeToast = useCallback((id: string) => {
    const toast = toasts.find((t) => t.id === id);
    if (!toast || toast.action) return;
    const pausedTime = pausedRef.current.get(id) ?? 0;
    const remaining = TOAST_DURATION - pausedTime;
    if (remaining > 0) {
      scheduleDismiss(id, remaining);
    }
    pausedRef.current.delete(id);
  }, [toasts, scheduleDismiss]);

  const addToast = useCallback((message: string, type: "success" | "error" | "info" | "warning" = "success", action?: ToastAction) => {
    const id = crypto.randomUUID();
    const createdAt = Date.now();
    setToasts((prev) => {
      const next = [...prev, { id, message, type, action, createdAt }];
      if (next.length > MAX_TOASTS) {
        const oldest = next[0];
        next[0] = { ...oldest, exiting: true };
        setTimeout(() => {
          setToasts((current) => current.filter((t) => t.id !== oldest.id));
        }, 200);
      }
      return next;
    });

    if (!action) {
      scheduleDismiss(id, TOAST_DURATION);
    }
  }, [scheduleDismiss]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, pauseToast, resumeToast }}>
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

function ToastItem({ toast, removeToast, onPause, onResume }: {
  toast: Toast;
  removeToast: (id: string) => void;
  onPause: () => void;
  onResume: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const typeStyles = {
    success: "bg-emerald-950/90 text-emerald-100 border-emerald-500/30",
    error: "bg-red-950/90 text-red-100 border-red-500/30",
    warning: "bg-amber-950/90 text-amber-100 border-amber-500/30",
    info: "bg-slate-900/90 text-slate-100 border-slate-700/50",
  };

  const TypeIcon = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }[toast.type];

  const typeRoles = {
    success: "status",
    error: "alert",
    warning: "alert",
    info: "status",
  } as const;

  const isLongMessage = toast.message.length > 80 || toast.message.includes('\n');

  return (
    <div
      role={typeRoles[toast.type]}
      onMouseEnter={onPause}
      onMouseLeave={onResume}
      className={`flex flex-col gap-2 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md text-sm transition-all duration-200 w-full pointer-events-auto ${
        toast.exiting
          ? "opacity-0 translate-x-4 scale-95"
          : "opacity-100 translate-x-0 scale-100 animate-in slide-in-from-bottom-2"
      } ${typeStyles[toast.type]}`}
    >
      <div className="flex items-start gap-3">
        <TypeIcon size={18} className="mt-0.5 shrink-0 opacity-80" />
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <div className={`whitespace-pre-wrap break-words ${expanded ? "" : "line-clamp-2"}`}>
            {toast.message}
          </div>
          {isLongMessage && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs opacity-70 hover:opacity-100 flex items-center gap-1 w-fit mt-1"
            >
              {expanded ? <><ChevronUp size={12}/> Show less</> : <><ChevronDown size={12}/> Show more</>}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => removeToast(toast.id)}
          className="opacity-50 hover:opacity-100 transition-opacity shrink-0 p-0.5 rounded-md hover:bg-white/10"
          aria-label="Dismiss notification"
        >
          <X size={16} />
        </button>
      </div>

      {toast.action && (
        <div className="flex justify-end mt-1">
          <button
            onClick={() => {
              toast.action!.onClick();
              removeToast(toast.id);
            }}
            className="text-xs font-semibold px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
          >
            {toast.action.label}
          </button>
        </div>
      )}
    </div>
  );
}

function ToastContainer() {
  const { toasts, removeToast, pauseToast, resumeToast } = useContext(ToastContext)!;

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

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3 w-80 sm:w-96 max-w-[calc(100vw-2rem)] pointer-events-none"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          removeToast={removeToast}
          onPause={() => pauseToast(toast.id)}
          onResume={() => resumeToast(toast.id)}
        />
      ))}
    </div>
  );
}
