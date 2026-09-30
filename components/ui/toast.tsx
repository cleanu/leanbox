"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, CircleAlert } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type Toast = { id: number; message: string; tone: "default" | "error" };
type ToastContextValue = { toast: (message: string, tone?: Toast["tone"]) => void };

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const toast = useCallback((message: string, tone: Toast["tone"] = "default") => {
    const id = nextId.current++;
    setToasts((t) => [...t.slice(-2), { id, message, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-[80] flex flex-col items-center gap-2 px-4"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className={`pointer-events-auto flex items-center gap-3 rounded-full px-5 py-3 text-sm shadow-[0_12px_40px_-12px_rgba(22,19,16,0.45)] ${
                t.tone === "error" ? "bg-danger text-parchment" : "bg-ink text-parchment"
              }`}
            >
              {t.tone === "error" ? (
                <CircleAlert className="size-4 shrink-0" aria-hidden />
              ) : (
                <Check className="size-4 shrink-0 text-saffron-2" aria-hidden />
              )}
              <span>{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
