"use client";

/**
 * Lightweight toast notification system. No external deps.
 *
 * Usage:
 *   const { toast } = useToast();
 *   toast.success("Saved");
 *   toast.error("Something went wrong");
 *   toast.info("FYI…");
 *
 * <Toaster /> is mounted once near the root in `<AppShell>`.
 */
import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastKind = "success" | "error" | "info" | "loading";

export interface Toast {
  id: string;
  kind: ToastKind;
  title: string;
  description?: string;
  durationMs?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => string;
  dismiss: (id: string) => void;
  update: (id: string, patch: Partial<Omit<Toast, "id">>) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

let counter = 0;
function newId() {
  counter += 1;
  return `t_${Date.now()}_${counter}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = React.useCallback(
    (t: Omit<Toast, "id">) => {
      const id = newId();
      const toast: Toast = { id, durationMs: 3800, ...t };
      setToasts((prev) => [...prev, toast]);
      if (toast.kind !== "loading" && toast.durationMs && toast.durationMs > 0) {
        setTimeout(() => dismiss(id), toast.durationMs);
      }
      return id;
    },
    [dismiss],
  );

  const update = React.useCallback(
    (id: string, patch: Partial<Omit<Toast, "id">>) => {
      setToasts((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          const merged = { ...t, ...patch };
          if (
            patch.kind &&
            patch.kind !== "loading" &&
            merged.durationMs &&
            merged.durationMs > 0
          ) {
            setTimeout(() => dismiss(id), merged.durationMs);
          }
          return merged;
        }),
      );
    },
    [dismiss],
  );

  const value = React.useMemo(
    () => ({ toasts, push, dismiss, update }),
    [toasts, push, dismiss, update],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  const toast = React.useMemo(
    () => ({
      success: (title: string, description?: string) =>
        ctx.push({ kind: "success", title, description }),
      error: (title: string, description?: string) =>
        ctx.push({ kind: "error", title, description, durationMs: 5500 }),
      info: (title: string, description?: string) =>
        ctx.push({ kind: "info", title, description }),
      loading: (title: string, description?: string) =>
        ctx.push({ kind: "loading", title, description, durationMs: 0 }),
      update: ctx.update,
      dismiss: ctx.dismiss,
    }),
    [ctx],
  );
  return { toast };
}

const ICON: Record<ToastKind, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  loading: Loader2,
};

const STYLES: Record<ToastKind, string> = {
  success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-100",
  error: "border-red-500/40 bg-red-500/10 text-red-100",
  info: "border-sky-500/40 bg-sky-500/10 text-sky-100",
  loading: "border-violet-500/40 bg-violet-500/10 text-violet-100",
};

const ICON_STYLES: Record<ToastKind, string> = {
  success: "text-emerald-400",
  error: "text-red-400",
  info: "text-sky-400",
  loading: "text-violet-400 animate-spin",
};

export function Toaster() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) return null;
  const { toasts, dismiss } = ctx;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:right-6 sm:items-end sm:px-0"
      aria-live="polite"
      role="status"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const Icon = ICON[t.kind];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className={cn(
                "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-background/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl",
                STYLES[t.kind],
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0", ICON_STYLES[t.kind])} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-tight text-foreground">
                  {t.title}
                </p>
                {t.description && (
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                    {t.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
