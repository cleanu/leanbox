"use client";

import { useEffect } from "react";
import { getSupabase } from "../../../lib/supabase";

export default function AuthCallbackPage() {
  useEffect(() => {
    const run = async () => {
      const supabase = getSupabase();
      if (!supabase) {
        window.location.replace("/login");
        return;
      }
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }
      window.location.replace("/");
    };
    run();
  }, []);

  return (
    <main className="auth-page">
      <p>Signing you in…</p>
    </main>
  );
}
