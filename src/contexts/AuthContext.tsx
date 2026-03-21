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

const ADMIN_EMAIL = "iowaautotrust@gmail.com";

interface AuthContextValue {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  // legacy aliases used by existing components
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ error: string | null }>;
  updateProfile: (updates: Partial<Pick<Profile, "name" | "phone" | "location">>) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function buildAuthUser(supabaseUser: SupabaseUser, profile: Profile | null): AuthUser {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? "",
    name: profile?.name ?? supabaseUser.user_metadata?.full_name ?? supabaseUser.email ?? "",
    phone: profile?.phone ?? null,
    location: profile?.location ?? null,
    isAdmin: profile?.is_admin === true || supabaseUser.email === ADMIN_EMAIL,
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

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const authUser = await fetchProfile(session.user);
        setUser(authUser);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session?.user) {
        const authUser = await fetchProfile(session.user);
        setUser(authUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signUp = async (email: string, password: string, name: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
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

  const forgotPassword = async (email: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });
    if (error) return { error: error.message };
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
  const login = async (email: string, password: string) => {
    const { error } = await signIn(email, password);
    return error ? { success: false, error } : { success: true };
  };

  const signup = async (name: string, email: string, password: string) => {
    const { error } = await signUp(email, password, name);
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
