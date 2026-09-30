"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getProfile, getSessionUser } from "@/lib/auth/session";
import { siteUrl } from "@/lib/env";
import { isStripeConfigured } from "@/lib/env.server";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { ensureStripeCustomer, getStripe } from "@/lib/stripe/server";
import { emailSchema, fieldErrors, profileSchema } from "@/lib/validation";

export type ProfileState = { status: "idle" | "saved" | "error"; fields?: Record<string, string> };

export async function updateProfileAction(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/account");
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", fields: fieldErrors(parsed.error) };
  const d = parsed.data;
  const supabase = await createClient();
  // RLS + column grants limit this to the caller's own row and safe columns.
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: d.full_name ?? null,
      phone: d.phone ?? null,
      district: d.district ?? null,
      address_line: d.address_line ?? null,
      notes: d.notes ?? null,
      contact_email: d.contact_email ?? null,
    })
    .eq("id", user.id);
  if (error) return { status: "error" };
  revalidatePath("/account");
  return { status: "saved" };
}

/** Change the sign-in email (e.g. Apple users without one). Supabase sends a confirmation link. */
export async function updateEmailAction(_prev: { ok?: boolean; error?: string }, formData: FormData): Promise<{ ok?: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/account");
  if (!(await rateLimit("email-change", { limit: 3, windowMs: 10 * 60_000 }))) return { error: "tooManyAttempts" };
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "invalidEmail" };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser(
    { email: parsed.data },
    { emailRedirectTo: siteUrl("/auth/callback?next=/account") },
  );
  if (error) return { error: "generic" };
  return { ok: true };
}

/** Stripe Customer Portal: manage the subscription, cards and invoices. */
export async function openBillingPortalAction() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/account/plan");
  if (!isStripeConfigured()) redirect("/account/plan?portal=unavailable");
  const profile = await getProfile();
  let url: string;
  try {
    const customer = await ensureStripeCustomer(user, profile);
    const session = await getStripe().billingPortal.sessions.create({
      customer,
      return_url: siteUrl("/account/plan"),
      locale: "zh-HK",
    });
    url = session.url;
  } catch (err) {
    // Most common cause: the portal isn't configured yet in Stripe (Settings → Billing → Customer portal).
    console.error("[stripe] billing portal", err);
    redirect("/account/plan?portal=unavailable");
  }
  redirect(url);
}
