"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

/**
 * Verifies the session against Supabase Auth once per app load (the proxy only
 * checks that a session cookie exists) and redirects when:
 * - the user is gone, banned or signed out → /login
 * - the user has no profile row yet        → /register?step=profile
 * Network failures (e.g. offline PWA) are ignored rather than signing out.
 * Runs in the background; renders nothing.
 */
export function AuthGuard() {
  const router = useRouter();

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (cancelled || isAuthRetryableFetchError(error)) return;

      if (!data.user) {
        // Clears the stale session cookie; SIGNED_OUT listener redirects.
        await supabase.auth.signOut({ scope: "local" });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .maybeSingle();

      if (!cancelled && !profile) {
        router.replace("/register?step=profile");
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.replace("/login");
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  return null;
}
