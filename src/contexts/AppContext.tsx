import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

export interface Lead {
  id: string;
  userId?: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  vehicleId: string;
  vehicleName: string;
  message: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  vehicleId: string;
  vehicleName: string;
  buyerName: string;
  buyerEmail: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "cancelled";
}

interface AppContextType {
  // Favorites
  favorites: string[];
  toggleFavorite: (vehicleId: string) => void;
  isFavorite: (vehicleId: string) => boolean;
  // Recent views
  recentViews: string[];
  addRecentView: (vehicleId: string) => void;
  // Recent searches
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  // Compare
  compareList: string[];
  toggleCompare: (vehicleId: string) => void;
  isInCompare: (vehicleId: string) => boolean;
  clearCompare: () => void;
  // Leads
  leads: Lead[];
  addLead: (lead: Omit<Lead, "id" | "createdAt">) => void;
  // Transactions
  transactions: Transaction[];
  // Vehicle data version (for re-rendering after admin edits)
  vehicleVersion: number;
  bumpVehicleVersion: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const load = <T,>(key: string, fallback: T): T => {
  try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; }
  catch { return fallback; }
};

const save = (key: string, val: unknown) => {
  localStorage.setItem(key, JSON.stringify(val));
};

// Seed some transactions
const defaultTransactions: Transaction[] = [
  { id: "t1", vehicleId: "1", vehicleName: "BMW 5 Series", buyerName: "John Smith", buyerEmail: "john@example.com", amount: 42500, date: "2024-12-15", status: "completed" },
  { id: "t2", vehicleId: "2", vehicleName: "Mercedes GLC", buyerName: "Sarah Connor", buyerEmail: "sarah@example.com", amount: 55800, date: "2025-01-20", status: "completed" },
  { id: "t3", vehicleId: "4", vehicleName: "Porsche Cayenne", buyerName: "Mike Wilson", buyerEmail: "mike@example.com", amount: 72000, date: "2025-02-10", status: "pending" },
];

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [favorites, setFavorites] = useState<string[]>(() => load("av_favs", []));
  const [recentViews, setRecentViews] = useState<string[]>(() => load("av_views", []));
  const [recentSearches, setRecentSearches] = useState<string[]>(() => load("av_searches", []));
  const [compareList, setCompareList] = useState<string[]>(() => load("av_compare", []));
  const [leads, setLeads] = useState<Lead[]>(() => load("av_leads", []));
  const [transactions] = useState<Transaction[]>(() => load("av_transactions", defaultTransactions));
  const [vehicleVersion, setVehicleVersion] = useState(0);

  useEffect(() => { save("av_favs", favorites); }, [favorites]);
  useEffect(() => { save("av_views", recentViews); }, [recentViews]);
  useEffect(() => { save("av_searches", recentSearches); }, [recentSearches]);
  useEffect(() => { save("av_compare", compareList); }, [compareList]);
  useEffect(() => { save("av_leads", leads); }, [leads]);
  useEffect(() => { save("av_transactions", transactions); }, [transactions]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((f) => f.includes(id) ? f.filter((x) => x !== id) : [...f, id]);
  }, []);

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  const addRecentView = useCallback((id: string) => {
    setRecentViews((v) => [id, ...v.filter((x) => x !== id)].slice(0, 20));
  }, []);

  const addRecentSearch = useCallback((q: string) => {
    if (!q.trim()) return;
    setRecentSearches((s) => [q, ...s.filter((x) => x !== q)].slice(0, 10));
  }, []);

  const toggleCompare = useCallback((id: string) => {
    setCompareList((c) => {
      if (c.includes(id)) return c.filter((x) => x !== id);
      if (c.length >= 3) return c;
      return [...c, id];
    });
  }, []);

  const isInCompare = useCallback((id: string) => compareList.includes(id), [compareList]);

  const clearCompare = useCallback(() => setCompareList([]), []);

  const addLead = useCallback((lead: Omit<Lead, "id" | "createdAt">) => {
    setLeads((l) => [...l, { ...lead, id: crypto.randomUUID(), createdAt: new Date().toISOString() }]);
  }, []);

  const bumpVehicleVersion = useCallback(() => setVehicleVersion((v) => v + 1), []);

  return (
    <AppContext.Provider value={{
      favorites, toggleFavorite, isFavorite,
      recentViews, addRecentView,
      recentSearches, addRecentSearch,
      compareList, toggleCompare, isInCompare, clearCompare,
      leads, addLead,
      transactions,
      vehicleVersion, bumpVehicleVersion,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
