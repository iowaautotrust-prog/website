import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

/**
 * Handles OAuth redirects and email confirmation links from Supabase Auth.
 * Supabase appends tokens in the URL hash or query params — this page
 * processes them and redirects the user to the appropriate destination.
 */
export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Check if this is a password recovery flow
        const params = new URLSearchParams(window.location.search);
        if (params.get("type") === "recovery") {
          navigate("/profile?reset=true", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } else {
        navigate("/login", { replace: true });
      }
    });
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
