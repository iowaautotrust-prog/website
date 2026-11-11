import { useState, useEffect, useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, User, Shield, Loader2, Search, UserPlus, KeyRound, Ban, CheckCircle2, Trash2, Pencil, Copy, Wand2, Wrench,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/lib/supabase";
import { functionError } from "@/lib/functionError";
import type { Profile } from "@/lib/types";

type Role = "admin" | "manager" | "user";

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  is_admin: boolean;
  is_manager: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  disabled: boolean;
  confirmed: boolean;
  favorites_count: number;
  leads_count: number;
}

const roleOf = (u: Pick<UserRow, "is_admin" | "is_manager">): Role => (u.is_admin ? "admin" : u.is_manager ? "manager" : "user");
const ROLE_LABEL: Record<Role, string> = { admin: "Admin", manager: "Manager", user: "User" };

const NOT_DEPLOYED =
  "The user management service is not set up yet (the admin-users function has not been deployed). See the setup guide.";

/** A password the admin can hand over: 14 characters with a lower case, upper case, number and symbol. */
function generatePassword(): string {
  const sets = ["abcdefghjkmnpqrstuvwxyz", "ABCDEFGHJKLMNPQRSTUVWXYZ", "23456789", "!@#$%&*?"];
  const all = sets.join("");
  const rnd = (n: number) => {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] % n;
  };
  const chars = sets.map((s) => s[rnd(s.length)]);
  while (chars.length < 14) chars.push(all[rnd(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString() : "Never");

export default function AdminUsers() {
  const { user, loading: authLoading } = useAuth();
  const { isDemoModeReady } = useApp();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceReady, setServiceReady] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ email: "", name: "", role: "user" as Role, password: "" });
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "" });
  const [editBusy, setEditBusy] = useState(false);

  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const call = async (body: Record<string, unknown>): Promise<{ data?: { users?: UserRow[] }; error?: string }> => {
    const { data, error } = await supabase.functions.invoke("admin-users", { body });
    if (error) return { error: await functionError(error, NOT_DEPLOYED) };
    if (data?.error) return { error: String(data.error) };
    return { data };
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await call({ action: "list" });
    if (data?.users) {
      setUsers(data.users as UserRow[]);
      setServiceReady(true);
    } else {
      // Fallback: the profile rows only (no email addresses, no actions) so the page still opens.
      setServiceReady(false);
      const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      setUsers(
        ((profiles as Profile[]) ?? []).map((p) => ({
          id: p.id, email: p.email ?? "", name: p.name, phone: p.phone, is_admin: p.is_admin, is_manager: p.is_manager === true,
          created_at: p.created_at, last_sign_in_at: null, disabled: false, confirmed: true, favorites_count: 0, leads_count: 0,
        }))
      );
      setNotice({ kind: "error", text: error ?? NOT_DEPLOYED });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!isDemoModeReady || !user?.isAdmin) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemoModeReady, user?.isAdmin]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "all" && roleOf(u) !== roleFilter) return false;
      return !q || (u.name ?? "").toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });
  }, [users, search, roleFilter]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!user?.isAdmin) return <Navigate to="/login" />;

  const say = (kind: "ok" | "error", text: string) => setNotice({ kind, text });

  const act = async (u: UserRow, body: Record<string, unknown>, okText: string, apply?: (u: UserRow) => UserRow) => {
    setBusyId(u.id);
    const { error } = await call(body);
    setBusyId(null);
    if (error) return say("error", error);
    if (apply) setUsers((us) => us.map((x) => (x.id === u.id ? apply(x) : x)));
    say("ok", okText);
  };

  const changeRole = (u: UserRow, role: Role) =>
    act(u, { action: "set_role", id: u.id, role }, `${u.name || u.email} is now ${ROLE_LABEL[role]}.`, (x) => ({
      ...x, is_admin: role === "admin", is_manager: role === "manager",
    }));

  const confirmDelete = async () => {
    if (!deleteUser) return;
    setDeleting(true);
    const { error } = await call({ action: "delete", id: deleteUser.id });
    setDeleting(false);
    if (error) {
      say("error", error);
    } else {
      setUsers((us) => us.filter((x) => x.id !== deleteUser.id));
      say("ok", `Deleted the account ${deleteUser.email || deleteUser.name || ""}.`);
    }
    setDeleteUser(null);
  };

  const saveEdit = async () => {
    if (!editUser) return;
    setEditBusy(true);
    const { error } = await call({ action: "set_profile", id: editUser.id, name: editForm.name, phone: editForm.phone });
    setEditBusy(false);
    if (error) return say("error", error);
    setUsers((us) => us.map((x) => (x.id === editUser.id ? { ...x, name: editForm.name.trim() || null, phone: editForm.phone.trim() || null } : x)));
    setEditUser(null);
    say("ok", "Saved.");
  };

  const addUser = async () => {
    setAddBusy(true);
    setAddError(null);
    const { error } = await call({ action: "create", ...addForm });
    setAddBusy(false);
    if (error) {
      setAddError(error);
      return;
    }
    setCreated({ email: addForm.email.trim().toLowerCase(), password: addForm.password });
    setAddForm({ email: "", name: "", role: "user", password: "" });
    void load();
  };

  const rows = (u: UserRow) => {
    const isMe = u.id === user.id;
    const busy = busyId === u.id;
    const actions = (
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        <button
          onClick={() => { setEditUser(u); setEditForm({ name: u.name ?? "", phone: u.phone ?? "" }); }}
          disabled={!serviceReady}
          className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:border-primary hover:text-primary disabled:opacity-40"
        >
          <Pencil className="w-3.5 h-3.5" /> Edit
        </button>
        <button
          onClick={() => act(u, { action: "send_reset", id: u.id }, `Password reset email sent to ${u.email}.`)}
          disabled={!serviceReady || busy || !u.email}
          className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:border-primary hover:text-primary disabled:opacity-40"
        >
          <KeyRound className="w-3.5 h-3.5" /> Reset password
        </button>
        <button
          onClick={() => act(u, { action: "set_disabled", id: u.id, disabled: !u.disabled }, u.disabled ? "Account enabled." : "Account disabled. They can no longer sign in.", (x) => ({ ...x, disabled: !u.disabled }))}
          disabled={!serviceReady || busy || isMe}
          title={isMe ? "You cannot disable your own account" : undefined}
          className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:border-primary hover:text-primary disabled:opacity-40"
        >
          {u.disabled ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />} {u.disabled ? "Enable" : "Disable"}
        </button>
        <button
          onClick={() => setDeleteUser(u)}
          disabled={!serviceReady || busy || isMe}
          title={isMe ? "You cannot delete your own account" : undefined}
          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>
    );
    const roleControl = (
      <select
        value={roleOf(u)}
        onChange={(e) => changeRole(u, e.target.value as Role)}
        disabled={!serviceReady || busy || isMe}
        aria-label={`Role for ${u.name || u.email}`}
        title={isMe ? "You cannot change your own role" : undefined}
        className="h-8 rounded-md border border-input bg-background px-2 text-xs disabled:opacity-60"
      >
        <option value="user">User</option>
        <option value="manager">Manager</option>
        <option value="admin">Admin</option>
      </select>
    );
    const status = u.disabled ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800"><Ban className="w-3 h-3" /> Disabled</span>
    ) : !u.confirmed ? (
      <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">Email not confirmed</span>
    ) : (
      <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">Active</span>
    );
    return { isMe, actions, roleControl, status };
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="section-padding pt-10 pb-24">
        <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Admin Dashboard
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-overline mb-1">Admin</p>
            <h1 className="heading-section">User Management</h1>
            <p className="text-sm text-muted-foreground mt-2">{users.length} account{users.length === 1 ? "" : "s"}</p>
          </div>
          <button
            onClick={() => { setAddOpen(true); setCreated(null); setAddError(null); setAddForm({ email: "", name: "", role: "user", password: generatePassword() }); }}
            disabled={!serviceReady}
            className="btn-hero inline-flex items-center gap-2 disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" /> Add user
          </button>
        </motion.div>

        {notice && (
          <div
            role={notice.kind === "error" ? "alert" : "status"}
            className={`mb-5 rounded-lg border px-4 py-3 text-sm ${notice.kind === "error" ? "border-destructive/40 bg-destructive/5 text-destructive" : "border-green-300 bg-green-50 text-green-900"}`}
          >
            {notice.text}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="pl-9" />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as "all" | Role)}
            aria-label="Filter by role"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All roles</option>
            <option value="admin">Admins</option>
            <option value="manager">Managers</option>
            <option value="user">Users</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary">
                  <tr>
                    <th className="text-left p-4 font-medium text-muted-foreground">User</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Role</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Joined</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Last sign-in</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Saved / Inquiries</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => {
                    const r = rows(u);
                    return (
                      <tr key={u.id} className="border-t border-border hover:bg-secondary/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              {u.is_admin ? <Shield className="w-4 h-4 text-primary" /> : u.is_manager ? <Wrench className="w-4 h-4 text-primary" /> : <User className="w-4 h-4 text-primary" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground">{u.name || "No name"}{r.isMe && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}</p>
                              <p className="text-xs text-muted-foreground break-all">{u.email || "Email not available"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">{r.roleControl}</td>
                        <td className="p-4">{r.status}</td>
                        <td className="p-4 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="p-4 text-muted-foreground">{fmtDate(u.last_sign_in_at)}</td>
                        <td className="p-4 text-muted-foreground">{u.favorites_count} / {u.leads_count}</td>
                        <td className="p-4">{r.actions}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && <p className="p-6 text-sm text-muted-foreground text-center">No users found.</p>}
            </div>

            {/* Mobile / tablet cards */}
            <div className="lg:hidden space-y-3">
              {filtered.map((u) => {
                const r = rows(u);
                return (
                  <div key={u.id} className="rounded-lg border border-border p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">{u.name || "No name"}{r.isMe && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}</p>
                        <p className="text-sm text-muted-foreground break-all">{u.email || "Email not available"}</p>
                      </div>
                      {r.status}
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div><p className="text-muted-foreground mb-1">Joined</p><p className="font-medium">{new Date(u.created_at).toLocaleDateString()}</p></div>
                      <div><p className="text-muted-foreground mb-1">Last sign-in</p><p className="font-medium">{fmtDate(u.last_sign_in_at)}</p></div>
                      <div><p className="text-muted-foreground mb-1">Saved / Inquiries</p><p className="font-medium">{u.favorites_count} / {u.leads_count}</p></div>
                    </div>
                    <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">Role</span>{r.roleControl}</div>
                    {r.actions}
                  </div>
                );
              })}
              {filtered.length === 0 && <p className="p-6 text-sm text-muted-foreground text-center">No users found.</p>}
            </div>
          </>
        )}
      </div>

      {/* Add user */}
      <Dialog open={addOpen} onOpenChange={(o) => !addBusy && setAddOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{created ? "Account created" : "Add user"}</DialogTitle>
            <DialogDescription>
              {created
                ? "Give this person their email and temporary password. They can change it after signing in (or use Reset password)."
                : "Creates a ready-to-use account. You choose the role and hand over the temporary password."}
            </DialogDescription>
          </DialogHeader>
          {created ? (
            <div className="space-y-3 text-sm">
              <p>Email: <span className="font-mono font-semibold break-all">{created.email}</span></p>
              <div className="flex items-center gap-2">
                <p className="flex-1">Password: <span className="font-mono font-semibold break-all">{created.password}</span></p>
                <button
                  onClick={() => navigator.clipboard?.writeText(created.password)}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:border-primary"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
              </div>
              <p className="text-xs text-muted-foreground">This password is shown only now. It is not stored anywhere you can look it up later.</p>
              <DialogFooter><button onClick={() => setAddOpen(false)} className="btn-hero">Done</button></DialogFooter>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5"><Label htmlFor="add-email">Email</Label><Input id="add-email" type="email" value={addForm.email} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label htmlFor="add-name">Name</Label><Input id="add-name" value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} /></div>
              <div className="space-y-1.5">
                <Label htmlFor="add-role">Role</Label>
                <select id="add-role" value={addForm.role} onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value as Role }))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="user">User (customer account)</option>
                  <option value="manager">Manager (service shop access)</option>
                  <option value="admin">Admin (full access)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="add-password">Temporary password</Label>
                <div className="flex gap-2">
                  <Input id="add-password" value={addForm.password} onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))} className="font-mono" />
                  <button type="button" onClick={() => setAddForm((f) => ({ ...f, password: generatePassword() }))} className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-3 text-xs font-medium hover:border-primary">
                    <Wand2 className="w-3.5 h-3.5" /> New
                  </button>
                </div>
              </div>
              {addError && <p role="alert" className="text-sm text-destructive">{addError}</p>}
              <DialogFooter>
                <button onClick={() => setAddOpen(false)} disabled={addBusy} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button>
                <button onClick={addUser} disabled={addBusy || !addForm.email.trim() || addForm.password.length < 8} className="btn-hero inline-flex items-center gap-2 disabled:opacity-50">
                  {addBusy && <Loader2 className="w-4 h-4 animate-spin" />} Create account
                </button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={editUser !== null} onOpenChange={(o) => !editBusy && !o && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
            <DialogDescription>{editUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="edit-name">Name</Label><Input id="edit-name" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label htmlFor="edit-phone">Phone</Label><Input id="edit-phone" type="tel" value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <button onClick={() => setEditUser(null)} disabled={editBusy} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button>
            <button onClick={saveEdit} disabled={editBusy} className="btn-hero inline-flex items-center gap-2">{editBusy && <Loader2 className="w-4 h-4 animate-spin" />} Save</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={deleteUser !== null} onOpenChange={(o) => !o && !deleting && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the account of <strong>{deleteUser?.name || deleteUser?.email}</strong>
              {deleteUser?.name && deleteUser?.email ? ` (${deleteUser.email})` : ""}, including their saved vehicles. This cannot be undone.
              {deleteUser?.is_admin && " This person is an admin."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void confirmDelete(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Yes, delete account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
