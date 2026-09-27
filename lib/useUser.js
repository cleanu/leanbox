"use client";

import { useEffect, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "./supabase";

export function useUser() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (event === "PASSWORD_RECOVERY") {
        window.dispatchEvent(new CustomEvent("leanbox-recovery"));
      }
    });
    return () => sub?.subscription?.unsubscribe();
  }, []);

  async function signOut() {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  }

  return { user, ready, configured: isSupabaseConfigured(), signOut };
}
