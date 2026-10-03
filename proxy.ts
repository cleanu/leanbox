import type { NextRequest } from "next/server";
import { KOL_COOKIE, normalizeKolCode } from "@/lib/kol";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16 renamed middleware.ts → proxy.ts (Node.js runtime).
export async function proxy(request: NextRequest) {
  const response = await updateSession(request);

  // KOL links (/?code=AMY10) remember the code for checkout; the last link clicked wins.
  // /auth/* is skipped because OAuth callbacks also use ?code=.
  const { pathname, searchParams } = request.nextUrl;
  const code = pathname.startsWith("/auth") ? null : normalizeKolCode(searchParams.get("code") ?? "");
  if (code) {
    response.cookies.set(KOL_COOKIE, code, {
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
  }
  return response;
}

export const config = {
  matcher: [
    // Everything except static assets, images and the Stripe webhook (raw body, no cookies).
    "/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook|brand/|food/|about/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml)$).*)",
  ],
};
