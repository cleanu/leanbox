import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SetupScreen } from "@/components/setup/setup-screen";
import { isSupabaseConfigured } from "@/lib/env";
import { isServiceRoleConfigured, isStripeConfigured } from "@/lib/env.server";

export const metadata: Metadata = { title: "Setup", robots: { index: false } };

export default function SetupPage() {
  // Once production is fully configured, don't advertise which integrations exist.
  if (process.env.NODE_ENV === "production" && isSupabaseConfigured() && isServiceRoleConfigured() && isStripeConfigured()) notFound();
  return <SetupScreen />;
}
