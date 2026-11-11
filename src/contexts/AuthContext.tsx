import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { AuthUser, Profile } from "@/lib/types";

export type { AuthUser as User };

interface AuthContextValue {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  // legacy aliases used by existing components
  // captchaToken is optional everywhere: when Turnstile has no site key configured, callers pass
  // undefined and Supabase (which has no secret key saved either in that case) doesn't ask for one.
  login: (email: string, password: string, captchaToken?: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string, captchaToken?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  signUp: (email: string, password: string, name: string, captchaToken?: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string, captchaToken?: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string, captchaToken?: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  updateProfile: (updates: Partial<Pick<Profile, "name" | "phone" | "location">>) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Supabase's own password-policy error dumps the entire raw character set
// ("Password should contain at least one character of each: abc...xyz,
// ABC...XYZ, 0123456789, !@#$%^&*()_+-=[]{};'\:\"|<>?,./`~.") verbatim —
// technically correct but unreadable as a user-facing message.
function humanizeAuthError(message: string): string {
  if (/password should contain at least one character of each/i.test(message)) {
    return "Password must include at least one lowercase letter, one uppercase letter, one number, and one special character (e.g. !@#$%).";
  }
  // New accounts can be switched off in Supabase (Authentication -> Sign In / Providers). Say so plainly.
  if (/signups? (are )?(not allowed|disabled)|signup_disabled|not allowed for this (instance|project)/i.test(message)) {
    return "Creating new accounts is turned off right now. If you need an account, please call us at (515) 809-8051.";
  }
  // Supabase's own wording for a missing/expired/failed Turnstile token.
  if (/captcha/i.test(message)) {
    return "Please complete the security check and try again.";
  }
  return message;
}

function buildAuthUser(supabaseUser: SupabaseUser, profile: Profile | null): AuthUser {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? "",
    name: profile?.name ?? supabaseUser.user_metadata?.full_name ?? supabaseUser.email ?? "",
    phone: profile?.phone ?? null,
    location: profile?.location ?? null,
    // Admin comes only from the profile (Admin -> Users). No email address gets admin by itself.
    isAdmin: profile?.is_admin === true,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (supabaseUser: SupabaseUser): Promise<AuthUser> => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", supabaseUser.id)
      .single();
    return buildAuthUser(supabaseUser, profile as Profile | null);
  }, []);

  // supabase.auth.getSession()/onAuthStateChange can hang indefinitely under
  // some conditions (observed: gotrue-js's navigator.locks-based session
  // lock not releasing on a fresh page load shortly after signing in). With
  // no fallback, `loading` would never flip to false and the whole app gets
  // stuck on a spinner forever. These race against a timeout so it always
  // resolves one way or another.
  const AUTH_TIMEOUT_MS = 8000;
  const getSessionSafe = useCallback((): Promise<Session | null> => {
    return Promise.race([
      supabase.auth.getSession().then(({ data }) => data.session),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), AUTH_TIMEOUT_MS)),
    ]);
  }, []);
  const fetchProfileSafe = useCallback(
    (supabaseUser: SupabaseUser): Promise<AuthUser> => {
      return Promise.race([
        fetchProfile(supabaseUser),
        new Promise<AuthUser>((resolve) =>
          setTimeout(() => resolve(buildAuthUser(supabaseUser, null)), AUTH_TIMEOUT_MS)
        ),
      ]);
    },
    [fetchProfile]
  );

  useEffect(() => {
    getSessionSafe().then(async (session) => {
      setSession(session);
      if (session?.user) {
        const authUser = await fetchProfileSafe(session.user);
        setUser(authUser);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session?.user) {
        const authUser = await fetchProfileSafe(session.user);
        setUser(authUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [getSessionSafe, fetchProfileSafe]);

  const signUp = async (
    email: string,
    password: string,
    name: string,
    captchaToken?: string
  ): Promise<{ error: string | null }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        captchaToken,
      },
    });
    if (error) return { error: humanizeAuthError(error.message) };
    // If session is returned directly (email confirmation disabled), set user immediately
    if (data.session?.user) {
      const authUser = await fetchProfile(data.session.user);
      setUser(authUser);
      setSession(data.session);
    }
    return { error: null };
  };

  const signIn = async (
    email: string,
    password: string,
    captchaToken?: string
  ): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken } });
    if (error) return { error: humanizeAuthError(error.message) };
    return { error: null };
  };

  const signInWithGoogle = async (): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const forgotPassword = async (email: string, captchaToken?: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      captchaToken,
    });
    if (error) return { error: humanizeAuthError(error.message) };
    return { error: null };
  };

  const updatePassword = async (newPassword: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error: humanizeAuthError(error.message) };
    return { error: null };
  };

  const updateProfile = async (
    updates: Partial<Pick<Profile, "name" | "phone" | "location">>
  ): Promise<{ error: string | null }> => {
    if (!user) return { error: "Not authenticated" };
    const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
    if (error) return { error: error.message };
    const { data: { session: s } } = await supabase.auth.getSession();
    if (s?.user) {
      const authUser = await fetchProfile(s.user);
      setUser(authUser);
    }
    return { error: null };
  };

  // Legacy aliases for existing components that call login/signup/logout
  const login = async (email: string, password: string, captchaToken?: string) => {
    const { error } = await signIn(email, password, captchaToken);
    return error ? { success: false, error } : { success: true };
  };

  const signup = async (name: string, email: string, password: string, captchaToken?: string) => {
    const { error } = await signUp(email, password, name, captchaToken);
    return error ? { success: false, error } : { success: true };
  };

  const logout = signOut;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        login,
        signup,
        logout,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        forgotPassword,
        updatePassword,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
