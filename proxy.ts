import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16 renamed middleware.ts → proxy.ts (Node.js runtime).
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Everything except static assets, images and the Stripe webhook (raw body, no cookies).
    "/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook|brand/|food/|about/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml)$).*)",
  ],
};
