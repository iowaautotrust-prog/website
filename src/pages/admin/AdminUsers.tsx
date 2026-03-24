import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, User, Shield, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types";
import { DEMO_USERS } from "@/lib/demoData";

interface UserRow extends Profile {
  email?: string;
  favorites_count?: number;
  leads_count?: number;
}

export default function AdminUsers() {
  const { user } = useAuth();
  const { isDemoMode } = useApp();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  if (!user?.isAdmin) return <Navigate to="/login" />;

  const fetchUsers = async () => {
    setLoading(true);
    if (isDemoMode) {
      setUsers(DEMO_USERS as UserRow[]);
      setLoading(false);
      return;
    }
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!profiles) {
      setLoading(false);
      return;
    }

    // Get favorites and leads counts
    const ids = profiles.map((p) => p.id);
    const [{ data: favs }, { data: leadsData }] = await Promise.all([
      supabase.from("favorites").select("user_id").in("user_id", ids),
      supabase.from("leads").select("user_id").in("user_id", ids),
    ]);

    const favMap: Record<string, number> = {};
    (favs ?? []).forEach((f: { user_id: string }) => {
      favMap[f.user_id] = (favMap[f.user_id] ?? 0) + 1;
    });
    const leadsMap: Record<string, number> = {};
    (leadsData ?? []).forEach((l: { user_id: string | null }) => {
      if (l.user_id) leadsMap[l.user_id] = (leadsMap[l.user_id] ?? 0) + 1;
    });

    setUsers(
      profiles.map((p) => ({
        ...p,
        favorites_count: favMap[p.id] ?? 0,
        leads_count: leadsMap[p.id] ?? 0,
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [isDemoMode]);

  const toggleAdmin = async (profileId: string, currentIsAdmin: boolean) => {
    const targetUser = users.find((u) => u.id === profileId);
    if (targetUser?.email === "iowaautotrust@gmail.com") return;
    setTogglingId(profileId);
    await supabase
      .from("profiles")
      .update({ is_admin: !currentIsAdmin })
      .eq("id", profileId);
    setUsers((us) =>
      us.map((u) =>
        u.id === profileId ? { ...u, is_admin: !currentIsAdmin } : u
      )
    );
    setTogglingId(null);
  };

  const toggleManager = async (profileId: string, currentIsManager: boolean) => {
    const targetUser = users.find((u) => u.id === profileId);
    if (targetUser?.email === "iowaautotrust@gmail.com") return;
    setTogglingId(profileId + "_mgr");
    await supabase
      .from("profiles")
      .update({ is_manager: !currentIsManager })
      .eq("id", profileId);
    setUsers((us) =>
      us.map((u) =>
        u.id === profileId ? { ...u, is_manager: !currentIsManager } : u
      )
    );
    setTogglingId(null);
  };

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="section-padding pt-10 pb-24">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Admin Dashboard
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <p className="text-overline mb-1">Admin</p>
          <h1 className="heading-section">User Management</h1>
        </motion.div>

        {/* Search */}
        <div className="relative max-w-sm mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-left p-4 font-medium text-muted-foreground">User</th>
                  <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Joined</th>
                  <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Saved</th>
                  <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Inquiries</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Role</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    className="border-t border-border hover:bg-secondary/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {u.name ?? "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {u.id.slice(0, 8)}…
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">
                      {u.favorites_count ?? 0}
                    </td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">
                      {u.leads_count ?? 0}
                    </td>
                    <td className="p-4">
                      {u.is_admin ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                          <Shield className="w-3 h-3" /> Admin
                        </span>
                      ) : u.is_manager ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                          <Shield className="w-3 h-3" /> Manager
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground text-xs font-medium">
                          <User className="w-3 h-3" /> User
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {/* Manager toggle — only for non-admin users */}
                        {!u.is_admin && (
                          <button
                            onClick={() => toggleManager(u.id, u.is_manager ?? false)}
                            disabled={togglingId === u.id + "_mgr" || u.id === user.id}
                            className="text-xs text-amber-600 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {togglingId === u.id + "_mgr" ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : u.is_manager ? (
                              "Remove Manager"
                            ) : (
                              "Make Manager"
                            )}
                          </button>
                        )}
                        {/* Admin toggle */}
                        <button
                          onClick={() => toggleAdmin(u.id, u.is_admin)}
                          disabled={togglingId === u.id || u.id === user.id}
                          className="text-xs text-primary hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {togglingId === u.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : u.is_admin ? (
                            "Remove Admin"
                          ) : (
                            "Make Admin"
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="p-6 text-sm text-muted-foreground text-center">
                No users found.
              </p>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-4">
          To delete a user account, go to your Supabase dashboard → Authentication → Users.
        </p>
      </div>
    </div>
  );
}
