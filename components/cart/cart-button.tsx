"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useCart } from "./cart-provider";

export function CartButton({ className }: { className?: string }) {
  const t = useTranslations("cart");
  const { count, open } = useCart();
  return (
    <button
      type="button"
      onClick={open}
      className={cn("relative grid size-11 place-items-center rounded-full transition hover:bg-parchment-2", className)}
      aria-label={`${t("open")}${count ? ` (${count})` : ""}`}
    >
      <ShoppingBag className="size-[1.2rem]" strokeWidth={1.6} aria-hidden />
      <AnimatePresence>
        {count > 0 ? (
          <motion.span
            key={count}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            className="numeral absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-sage-deep px-1 text-[0.68rem] font-semibold leading-5 text-cream"
          >
            {count}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </button>
  );
}
