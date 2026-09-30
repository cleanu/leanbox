export type CartLine = { mealId: string; quantity: number };

export type CartActionResult = {
  lines: CartLine[];
  error?: "unauthenticated" | "invalid" | "unavailable" | "server";
  /** Set when the server clamped a quantity to remaining stock. */
  clamped?: { mealId: string; quantity: number }[];
};

export const GUEST_CART_KEY = "leanbox.cart.v1";
