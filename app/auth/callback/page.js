"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "../../../lib/supabase";

export default function AuthCallbackPage() {
  const [status, setStatus] = useState("Signing you in…");

  useEffect(() => {
    const run = async () => {
      const supabase = getSupabase();
      const url = new URL(window.location.href);
      const next = url.searchParams.get("next") || "/";
      if (!supabase) {
        window.location.replace("/?login=1");
        return;
      }

      try {
        const code = url.searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
        const type = hash.get("type") || url.searchParams.get("type") || "";

        const { data } = await supabase.auth.getSession();
        const goingReset = next === "/reset" || type === "recovery" || type === "password_recovery";
        if (goingReset) {
          window.location.replace("/?reset=1");
          return;
        }
        if (!data.session && type === "signup") {
          window.location.replace("/?login=1");
          return;
        }
        window.location.replace(next === "/reset" ? "/?reset=1" : "/");
      } catch (err) {
        setStatus(err.message || "Could not finish sign-in.");
        setTimeout(() => window.location.replace("/?login=1"), 1600);
      }
    };
    run();
  }, []);

  return (
    <main className="auth-page">
      <p>{status}</p>
    </main>
  );
}
