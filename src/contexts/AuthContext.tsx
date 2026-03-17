import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => { success: boolean; error?: string };
  signup: (name: string, email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface StoredUser extends User {
  password: string;
}

const USERS_KEY = "autovault_users";
const SESSION_KEY = "autovault_session";

const getStoredUsers = (): StoredUser[] => {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch { return []; }
};

const saveUsers = (users: StoredUser[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// Seed admin user
const ensureAdmin = () => {
  const users = getStoredUsers();
  if (!users.find((u) => u.email === "admin@autovault.com")) {
    users.push({
      id: "admin-1",
      name: "Admin",
      email: "admin@autovault.com",
      phone: "",
      location: "",
      password: "admin",
      isAdmin: true,
    });
    saveUsers(users);
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    ensureAdmin();
    const session = localStorage.getItem(SESSION_KEY);
    if (session) {
      try {
        const parsed = JSON.parse(session);
        // Refresh from stored users to get latest profile
        const users = getStoredUsers();
        const stored = users.find((u) => u.id === parsed.id);
        if (stored) {
          const { password: _, ...u } = stored;
          setUser(u);
        }
      } catch { /* ignore */ }
    }
  }, []);

  const login = (email: string, password: string) => {
    // Admin shortcut: admin / admin
    if (email === "admin" && password === "admin") {
      const users = getStoredUsers();
      const admin = users.find((u) => u.isAdmin);
      if (admin) {
        const { password: _, ...u } = admin;
        setUser(u);
        localStorage.setItem(SESSION_KEY, JSON.stringify(u));
        return { success: true };
      }
    }

    const users = getStoredUsers();
    const found = users.find((u) => u.email === email && u.password === password);
    if (!found) return { success: false, error: "Invalid email or password" };
    const { password: _, ...u } = found;
    setUser(u);
    localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    return { success: true };
  };

  const signup = (name: string, email: string, password: string) => {
    const users = getStoredUsers();
    if (users.find((u) => u.email === email)) {
      return { success: false, error: "Email already registered" };
    }
    const newUser: StoredUser = {
      id: crypto.randomUUID(),
      name,
      email,
      phone: "",
      location: "",
      password,
      isAdmin: false,
    };
    users.push(newUser);
    saveUsers(users);
    const { password: _, ...u } = newUser;
    setUser(u);
    localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const updateProfile = (data: Partial<User>) => {
    if (!user) return;
    const users = getStoredUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...data };
      saveUsers(users);
      const { password: _, ...u } = users[idx];
      setUser(u);
      localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
