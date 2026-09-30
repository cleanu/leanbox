"use client";

import { useTranslations } from "next-intl";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { mergeGuestCart, setCartLine } from "@/actions/cart";
import { useToast } from "@/components/ui/toast";
import type { PublicMeal } from "@/lib/catalog/types";
import { GUEST_CART_KEY, type CartLine } from "@/lib/cart/types";
import { shopConfig } from "@/lib/config";

export type CartView = CartLine & { meal: PublicMeal; lineTotalCents: number };

type CartContextValue = {
  lines: CartView[];
  count: number;
  subtotalCents: number;
  isOpen: boolean;
  isSyncing: boolean;
  isGuest: boolean;
  open: () => void;
  close: () => void;
  quantityOf: (mealId: string) => number;
  maxFor: (meal: PublicMeal) => number;
  add: (mealId: string, qty?: number) => void;
  setQuantity: (mealId: string, qty: number) => void;
  remove: (mealId: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

function readGuest(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(GUEST_CART_KEY);
    const parsed = raw ? (JSON.parse(raw) as CartLine[]) : [];
    return Array.isArray(parsed)
      ? parsed.filter((l) => typeof l?.mealId === "string" && Number.isInteger(l.quantity) && l.quantity > 0)
      : [];
  } catch {
    return [];
  }
}

function writeGuest(lines: CartLine[]) {
  try {
    if (lines.length) window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(lines));
    else window.localStorage.removeItem(GUEST_CART_KEY);
  } catch {
    /* storage unavailable (private mode) — cart stays in memory */
  }
}

/**
 * Cart state for the whole site.
 *  - Guests: lines live in localStorage.
 *  - Signed in: lines live in Postgres (carts/cart_items, RLS owner-only);
 *    updates are optimistic and reconciled with the server response.
 *  - On sign-in, any guest lines are merged into the account cart once.
 */
export function CartProvider({
  userId,
  initialLines,
  meals,
  children,
}: {
  userId: string | null;
  initialLines: CartLine[];
  meals: PublicMeal[];
  children: React.ReactNode;
}) {
  const t = useTranslations("cart");
  const { toast } = useToast();
  const [lines, setLines] = useState<CartLine[]>(userId ? initialLines : []);
  const [isOpen, setOpen] = useState(false);
  const [isSyncing, startSync] = useTransition();
  const mealById = useMemo(() => new Map(meals.map((m) => [m.id, m])), [meals]);
  const linesRef = useRef(lines);
  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);
  // Last cart state the server confirmed, and the id of the newest pending change.
  // Server replies are full-cart snapshots; applying an older one would undo newer clicks.
  const confirmedRef = useRef(lines);
  const latestRequest = useRef(0);
  const initialKey = JSON.stringify(initialLines);

  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
      setLines(readGuest());
      return;
    }
    const guest = readGuest();
    if (!guest.length) {
      const serverLines = JSON.parse(initialKey) as CartLine[];
      confirmedRef.current = serverLines;
      setLines(serverLines);
      return;
    }
    startSync(async () => {
      const res = await mergeGuestCart(guest);
      if (!res.error) {
        writeGuest([]);
        confirmedRef.current = res.lines;
        setLines(res.lines);
      }
    });
  }, [userId, initialKey]);

  const maxFor = useCallback(
    (meal: PublicMeal) => (meal.is_active ? Math.min(meal.weekly_stock, shopConfig.maxQtyPerLine) : 0),
    [],
  );

  const commit = useCallback(
    (mealId: string, nextQty: number) => {
      const meal = mealById.get(mealId);
      if (!meal) return;
      const max = maxFor(meal);
      const qty = Math.max(0, Math.min(nextQty, max));
      if (nextQty > max && max > 0) toast(t("maxReached"));
      const current = linesRef.current;
      const optimistic = qty
        ? current.some((l) => l.mealId === mealId)
          ? current.map((l) => (l.mealId === mealId ? { ...l, quantity: qty } : l))
          : [...current, { mealId, quantity: qty }]
        : current.filter((l) => l.mealId !== mealId);
      setLines(optimistic);
      linesRef.current = optimistic;

      if (!userId) {
        writeGuest(optimistic);
        return;
      }
      const request = ++latestRequest.current;
      startSync(async () => {
        const res = await setCartLine({ mealId, quantity: qty });
        // A newer change is in flight: its reply reflects this write too, so let it reconcile.
        if (request !== latestRequest.current) return;
        if (res.error && res.error !== "unavailable") {
          setLines(confirmedRef.current);
          toast(t("syncError"), "error");
          return;
        }
        confirmedRef.current = res.lines;
        setLines(res.lines);
        if (res.clamped?.length) toast(t("maxReached"));
      });
    },
    [mealById, maxFor, t, toast, userId],
  );

  const value = useMemo<CartContextValue>(() => {
    const view: CartView[] = lines
      .map((l) => {
        const meal = mealById.get(l.mealId);
        return meal ? { ...l, meal, lineTotalCents: meal.price_cents * l.quantity } : null;
      })
      .filter((v): v is CartView => v !== null);
    const qtyOf = (mealId: string) => lines.find((l) => l.mealId === mealId)?.quantity ?? 0;
    return {
      lines: view,
      count: view.reduce((s, l) => s + l.quantity, 0),
      subtotalCents: view.reduce((s, l) => s + l.lineTotalCents, 0),
      isOpen,
      isSyncing,
      isGuest: !userId,
      open: () => setOpen(true),
      close: () => setOpen(false),
      quantityOf: qtyOf,
      maxFor,
      add: (mealId, qty = 1) => commit(mealId, qtyOf(mealId) + qty),
      setQuantity: (mealId, qty) => commit(mealId, qty),
      remove: (mealId) => commit(mealId, 0),
    };
  }, [lines, mealById, isOpen, isSyncing, userId, maxFor, commit]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
