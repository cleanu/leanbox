"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Accessible slide-over: focus moves in, Tab is trapped, Escape closes, page
 * scroll (and Lenis) pauses while open.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  side = "right",
  className,
  closeLabel = "Close",
  eyebrow,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  side?: "right" | "bottom";
  className?: string;
  closeLabel?: string;
  eyebrow?: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    lastFocused.current = document.activeElement as HTMLElement | null;
    window.dispatchEvent(new Event("lenis:stop"));
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const t = window.setTimeout(() => panelRef.current?.focus(), 30);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prevOverflow;
      window.dispatchEvent(new Event("lenis:start"));
      lastFocused.current?.focus?.();
    };
  }, [open, onClose]);

  const variants =
    side === "right"
      ? { hidden: { x: reduce ? 0 : "100%", opacity: reduce ? 0 : 1 }, shown: { x: 0, opacity: 1 } }
      : { hidden: { y: reduce ? 0 : "100%", opacity: reduce ? 0 : 1 }, shown: { y: 0, opacity: 1 } };

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[70]" role="presentation">
          <motion.div
            className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            data-lenis-prevent
            initial="hidden"
            animate="shown"
            exit="hidden"
            variants={variants}
            transition={{ duration: reduce ? 0.15 : 0.55, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "absolute flex flex-col bg-parchment shadow-[0_0_80px_-20px_rgba(22,19,16,0.5)] outline-none",
              side === "right" ? "inset-y-0 right-0 w-full max-w-[34rem]" : "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-3xl",
              className,
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5 sm:px-8">
              <div>
                {eyebrow ? <p className="eyebrow mb-1">{eyebrow}</p> : null}
                <h2 id={titleId} className="text-2xl">
                  {title}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="-mr-2 grid size-10 place-items-center rounded-full text-walnut transition hover:bg-parchment-2"
                aria-label={closeLabel}
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6 sm:px-8">{children}</div>
            {footer ? <div className="border-t border-line bg-parchment-2/60 px-6 py-5 sm:px-8">{footer}</div> : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
