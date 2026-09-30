import "server-only";
import type { User } from "@supabase/supabase-js";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import { isServiceRoleConfigured, serverEnv } from "@/lib/env.server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type Profile = Tables<"profiles">;

/** Verified user for this request (hits Supabase Auth once per request). */
export const getSessionUser = cache(async (): Promise<User | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
});

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return data;
});

export async function requireUser(next = "/account"): Promise<User> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

function isVerified(user: User) {
  return Boolean(user.email_confirmed_at || user.confirmed_at);
}

/**
 * Promote users listed in ADMIN_EMAILS (verified emails only) and make sure a
 * profile row exists. Runs server-side after sign-in and on admin access.
 */
export async function syncProfileAfterSignIn(user: User): Promise<void> {
  if (!isServiceRoleConfigured()) return;
  const admin = createAdminClient();
  const appleIdentity = user.identities?.find((i) => i.provider === "apple");
  const meta = user.user_metadata ?? {};

  const { data: existing } = await admin.from("profiles").select("id, role, apple_user_id, full_name").eq("id", user.id).maybeSingle();

  if (!existing) {
    await admin.from("profiles").insert({
      id: user.id,
      email: user.email ?? null,
      full_name: (meta.full_name as string) || (meta.name as string) || null,
      avatar_url: (meta.avatar_url as string) || null,
      apple_user_id: appleIdentity?.id ?? null,
    });
  } else if (appleIdentity && !existing.apple_user_id) {
    await admin.from("profiles").update({ apple_user_id: appleIdentity.id }).eq("id", user.id);
  }

  const email = user.email?.toLowerCase();
  if (email && isVerified(user) && serverEnv.adminEmails.includes(email) && existing?.role !== "admin") {
    await admin.from("profiles").update({ role: "admin" }).eq("id", user.id);
    await admin.from("admin_audit").insert({
      actor_id: user.id,
      action: "bootstrap_admin",
      entity: "profiles",
      entity_id: user.id,
      meta: { email, source: "ADMIN_EMAILS" },
    });
  }
}

/**
 * Admin gate. Responds 404 for anyone who isn't an admin — including signed
 * out visitors — so the admin area doesn't reveal that it exists.
 */
export const requireAdmin = cache(async (): Promise<{ user: User; profile: Profile }> => {
  if (!isSupabaseConfigured() || !isServiceRoleConfigured()) notFound();
  const user = await getSessionUser();
  if (!user) notFound();
  await syncProfileAfterSignIn(user);
  const { data: profile } = await createAdminClient().from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile || profile.role !== "admin") notFound();
  return { user, profile };
});
