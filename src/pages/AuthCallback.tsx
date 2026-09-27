import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

/**
 * Handles OAuth redirects, email confirmation links, and password recovery
 * links from Supabase Auth. Listens for the PASSWORD_RECOVERY auth event
 * specifically (Supabase's documented way to detect a recovery link) rather
 * than relying on getSession() alone, which can race with the SDK's own
 * async parsing of the URL hash/PKCE code on a fresh page load.
 */
export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let settled = false;
    const finish = (path: string) => {
      if (settled) return;
      settled = true;
      navigate(path, { replace: true });
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        finish("/reset-password");
      } else if (event === "SIGNED_IN" && session) {
        finish("/");
      }
    });

    // Covers the case where a session already existed before this effect
    // ran (event won't fire again for it).
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (settled || !session) return;
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      if (params.get("type") === "recovery" || hashParams.get("type") === "recovery") {
        finish("/reset-password");
      } else {
        finish("/");
      }
    });

    // Never leave the user stuck here forever (e.g. an expired/invalid link).
    const fallback = setTimeout(() => finish("/login"), 6000);

    return () => {
      clearTimeout(fallback);
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Signing you in…</p>
      </div>
    </div>
  );
}
