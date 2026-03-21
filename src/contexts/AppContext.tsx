import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import type { Vehicle, Lead, Transaction } from "@/lib/types";
import { useAuth } from "./AuthContext";

// Re-export for backward compatibility
export type { Lead, Transaction };

// Session ID for anonymous view tracking (persists in sessionStorage)
const getSessionId = (): string => {
  let sid = sessionStorage.getItem("iat_session");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("iat_session", sid);
  }
  return sid;
};

interface AppContextType {
  // Favorites
  favorites: string[];
  toggleFavorite: (vehicleId: string) => Promise<void>;
  isFavorite: (vehicleId: string) => boolean;
  // Recent views (full Vehicle objects for the hero strip)
  recentViews: Vehicle[];
  addRecentView: (vehicle: Vehicle) => Promise<void>;
  // Recent searches
  recentSearches: string[];
  addRecentSearch: (query: string) => Promise<void>;
  // Compare (client-side only — no auth needed)
  compareList: string[];
  toggleCompare: (vehicleId: string) => void;
  isInCompare: (vehicleId: string) => boolean;
  clearCompare: () => void;
  // Leads
  addLead: (lead: Omit<Lead, "id" | "created_at">) => Promise<void>;
  // Transactions — idempotent
  submitTransaction: (
    data: Omit<Transaction, "id" | "created_at" | "idempotency_key">
  ) => Promise<{ success: boolean; error?: string }>;
  // Vehicle version bump (for admin edits)
  vehicleVersion: number;
  bumpVehicleVersion: () => void;
  // Demo mode
  isDemoMode: boolean;
  toggleDemoMode: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

// Local storage helpers (for compare + unauthenticated recent searches)
const lsLoad = <T,>(key: string, fallback: T): T => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
};
const lsSave = (key: string, val: unknown) =>
  localStorage.setItem(key, JSON.stringify(val));

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentViews, setRecentViews] = useState<Vehicle[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [compareList, setCompareList] = useState<string[]>(() =>
    lsLoad("av_compare", [])
  );
  const [vehicleVersion, setVehicleVersion] = useState(0);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => lsLoad("iat_demo", false));
  const toggleDemoMode = useCallback(() => {
    setIsDemoMode((v) => {
      lsSave("iat_demo", !v);
      return !v;
    });
  }, []);

  // Prevent duplicate transaction submission
  const pendingTransactions = useRef<Set<string>>(new Set());

  // ── Load user data from Supabase when logged in ─────────────────────────

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      setRecentViews([]);
      setRecentSearches(lsLoad("av_searches", []));
      return;
    }

    // Load favorites
    supabase
      .from("favorites")
      .select("vehicle_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setFavorites(data.map((f) => f.vehicle_id));
      });

    // Load recent views (join vehicles)
    supabase
      .from("vehicle_views")
      .select("vehicle_id, vehicles(*)")
      .eq("user_id", user.id)
      .order("viewed_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) {
          const seen = new Set<string>();
          const unique: Vehicle[] = [];
          for (const row of data) {
            const v = row.vehicles as Vehicle | null;
            if (v && !seen.has(v.id)) {
              seen.add(v.id);
              unique.push(v);
            }
          }
          setRecentViews(unique.slice(0, 8));
        }
      });

    // Load recent searches
    supabase
      .from("recent_searches")
      .select("query")
      .eq("user_id", user.id)
      .order("searched_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) setRecentSearches(data.map((r) => r.query));
      });
  }, [user]);

  // Sync compare list to localStorage
  useEffect(() => {
    lsSave("av_compare", compareList);
  }, [compareList]);

  // ── Favorites ────────────────────────────────────────────────────────────

  const toggleFavorite = useCallback(
    async (vehicleId: string) => {
      if (!user) return;
      const isAlready = favorites.includes(vehicleId);
      if (isAlready) {
        setFavorites((f) => f.filter((x) => x !== vehicleId));
        await supabase
          .from("favorites")
          .delete()
          .match({ user_id: user.id, vehicle_id: vehicleId });
      } else {
        setFavorites((f) => [...f, vehicleId]);
        await supabase.from("favorites").insert({
          user_id: user.id,
          vehicle_id: vehicleId,
          created_at: new Date().toISOString(),
        });
      }
    },
    [user, favorites]
  );

  const isFavorite = useCallback(
    (id: string) => favorites.includes(id),
    [favorites]
  );

  // ── Recent Views ─────────────────────────────────────────────────────────

  const addRecentView = useCallback(
    async (vehicle: Vehicle) => {
      // Update local state immediately
      setRecentViews((v) => [
        vehicle,
        ...v.filter((x) => x.id !== vehicle.id),
      ].slice(0, 8));

      // Track in Supabase (also increments view_count via DB trigger or direct update)
      const sid = getSessionId();
      await supabase.from("vehicle_views").insert({
        vehicle_id: vehicle.id,
        user_id: user?.id ?? null,
        session_id: sid,
        viewed_at: new Date().toISOString(),
      });

      // Increment view_count
      await supabase.rpc("increment_view_count" as never, {
        vehicle_id: vehicle.id,
      }).catch(() => {
        // Fallback: direct update if RPC not set up
        supabase
          .from("vehicles")
          .update({ view_count: vehicle.view_count + 1 })
          .eq("id", vehicle.id);
      });
    },
    [user]
  );

  // ── Recent Searches ───────────────────────────────────────────────────────

  const addRecentSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) return;
      setRecentSearches((s) => [
        query,
        ...s.filter((x) => x !== query),
      ].slice(0, 10));

      if (user) {
        await supabase.from("recent_searches").insert({
          user_id: user.id,
          query,
          searched_at: new Date().toISOString(),
        });
      } else {
        const searches = [query, ...recentSearches.filter((x) => x !== query)].slice(0, 10);
        lsSave("av_searches", searches);
      }
    },
    [user, recentSearches]
  );

  // ── Compare ───────────────────────────────────────────────────────────────

  const toggleCompare = useCallback((id: string) => {
    setCompareList((c) => {
      if (c.includes(id)) return c.filter((x) => x !== id);
      if (c.length >= 3) return c;
      return [...c, id];
    });
  }, []);

  const isInCompare = useCallback(
    (id: string) => compareList.includes(id),
    [compareList]
  );

  const clearCompare = useCallback(() => setCompareList([]), []);

  // ── Leads ─────────────────────────────────────────────────────────────────

  const addLead = useCallback(
    async (lead: Omit<Lead, "id" | "created_at">) => {
      await supabase.from("leads").insert({
        ...lead,
        user_id: user?.id ?? null,
        created_at: new Date().toISOString(),
      });
    },
    [user]
  );

  // ── Transactions (idempotent) ─────────────────────────────────────────────

  const submitTransaction = useCallback(
    async (
      data: Omit<Transaction, "id" | "created_at" | "idempotency_key">
    ): Promise<{ success: boolean; error?: string }> => {
      // Build idempotency key from buyer + vehicle + amount
      const key = `${data.buyer_id ?? data.buyer_email}-${data.vehicle_id}-${data.amount}`;

      // Prevent double-click / duplicate submission
      if (pendingTransactions.current.has(key)) {
        return { success: false, error: "Transaction already in progress" };
      }

      pendingTransactions.current.add(key);

      try {
        const { error } = await supabase.from("transactions").insert({
          ...data,
          idempotency_key: key,
          created_at: new Date().toISOString(),
        });

        if (error) {
          // Unique constraint violation = already submitted
          if (error.code === "23505") {
            return { success: true }; // idempotent — already recorded
          }
          return { success: false, error: error.message };
        }

        return { success: true };
      } finally {
        // Remove from pending after 5 seconds to allow retries on genuine failure
        setTimeout(() => pendingTransactions.current.delete(key), 5000);
      }
    },
    []
  );

  // ── Vehicle version ───────────────────────────────────────────────────────

  const bumpVehicleVersion = useCallback(() => setVehicleVersion((v) => v + 1), []);

  return (
    <AppContext.Provider
      value={{
        favorites,
        toggleFavorite,
        isFavorite,
        recentViews,
        addRecentView,
        recentSearches,
        addRecentSearch,
        compareList,
        toggleCompare,
        isInCompare,
        clearCompare,
        addLead,
        submitTransaction,
        vehicleVersion,
        bumpVehicleVersion,
        isDemoMode,
        toggleDemoMode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
