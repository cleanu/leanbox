import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function initials(name?: string | null, email?: string | null): string {
  const source = (name || email || "?").trim();
  if (!source) return "?";
  // CJK names: use the first character; latin names: first letters of two words.
  if (/[㐀-鿿]/.test(source[0])) return source[0];
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return (parts[0]?.[0] ?? "?").toUpperCase() + (parts[1]?.[0] ?? "").toUpperCase();
}

export function maskId(id?: string | null, visible = 6): string {
  if (!id) return "—";
  if (id.length <= visible * 2) return id;
  return `${id.slice(0, visible + 3)}…${id.slice(-visible)}`;
}

export function orderRef(orderNumber: number | string | null | undefined): string {
  return orderNumber ? `LB-${orderNumber}` : "LB-—";
}
