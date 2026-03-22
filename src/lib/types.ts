// ─── Supabase Database Types ────────────────────────────────────────────────

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: Category;
        Insert: Omit<Category, "id" | "created_at">;
        Update: Partial<Omit<Category, "id" | "created_at">>;
      };
      vehicles: {
        Row: Vehicle;
        Insert: Omit<Vehicle, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Vehicle, "id" | "created_at" | "updated_at">>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at">;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
      };
      vehicle_views: {
        Row: VehicleView;
        Insert: Omit<VehicleView, "id" | "viewed_at">;
        Update: never;
      };
      favorites: {
        Row: Favorite;
        Insert: Favorite;
        Update: never;
      };
      leads: {
        Row: Lead;
        Insert: Omit<Lead, "id" | "created_at">;
        Update: Partial<Omit<Lead, "id" | "created_at">>;
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, "id" | "created_at">;
        Update: Partial<Omit<Transaction, "id" | "created_at">>;
      };
      recent_searches: {
        Row: RecentSearch;
        Insert: Omit<RecentSearch, "id" | "searched_at">;
        Update: never;
      };
      coupons: {
        Row: Coupon;
        Insert: Omit<Coupon, "id" | "created_at" | "used_count">;
        Update: Partial<Omit<Coupon, "id" | "created_at">>;
      };
    };
  };
};

// ─── Domain Types ────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export interface Vehicle {
  id: string;
  name: string;
  make: string;
  model: string;
  price: number;
  mileage: number;
  year: number;
  fuel: string;
  type: string;
  category_id: string | null;
  seats: number | null;
  engine: string | null;
  transmission: string | null;
  description: string | null;
  features: string[] | null;
  status: "available" | "pending";
  in_carousel: boolean;
  view_count: number;
  image_url: string | null;
  image_urls: string[] | null;
  vin: string | null;
  discount_amount: number | null;
  discount_label: string | null;
  discount_expires: string | null;
  created_at: string;
  updated_at: string;
  // joined
  category?: Category | null;
}

export interface Profile {
  id: string;
  name: string | null;
  phone: string | null;
  location: string | null;
  is_admin: boolean;
  is_manager: boolean;
  created_at: string;
  // joined from auth
  email?: string;
}

export interface VehicleView {
  id: string;
  vehicle_id: string;
  user_id: string | null;
  session_id: string | null;
  viewed_at: string;
}

export interface Favorite {
  user_id: string;
  vehicle_id: string;
  created_at: string;
}

export interface Lead {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  vehicle_id: string | null;
  vehicle_name: string | null;
  message: string | null;
  lead_type: "inquiry" | "contact" | "test_drive";
  status: "new" | "contacted" | "closed";
  created_at: string;
}

export interface Transaction {
  id: string;
  idempotency_key: string;
  vehicle_id: string | null;
  vehicle_name: string | null;
  buyer_id: string | null;
  buyer_name: string | null;
  buyer_email: string | null;
  amount: number | null;
  status: "pending" | "completed" | "cancelled";
  created_at: string;
}

export interface RecentSearch {
  id: string;
  user_id: string;
  query: string;
  searched_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_price: number | null;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  active: boolean;
  created_at: string;
}

// ─── Auth Types ──────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  location: string | null;
  isAdmin: boolean;
  isManager: boolean;
}

// ─── App Context Types ───────────────────────────────────────────────────────

export interface AppContextValue {
  favorites: string[];
  recentViews: Vehicle[];
  recentSearches: string[];
  compareList: string[];
  toggleFavorite: (vehicleId: string) => Promise<void>;
  isFavorite: (vehicleId: string) => boolean;
  addRecentView: (vehicle: Vehicle) => Promise<void>;
  addRecentSearch: (query: string) => Promise<void>;
  toggleCompare: (vehicleId: string) => void;
  clearCompare: () => void;
  submitLead: (lead: Omit<Lead, "id" | "created_at">) => Promise<void>;
  submitTransaction: (
    data: Omit<Transaction, "id" | "created_at" | "idempotency_key">
  ) => Promise<{ success: boolean; error?: string }>;
}
