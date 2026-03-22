import { useState, useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { ShopCustomer } from "@/lib/shopTypes";
import { ArrowLeft, Plus, Search, Loader2, User, Trash2, X, Edit2 } from "lucide-react";

type FormData = { name: string; phone: string; email: string; address: string; notes: string };
const empty: FormData = { name: "", phone: "", email: "", address: "", notes: "" };

const ShopCustomers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<ShopCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ShopCustomer | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  if (!user?.isAdmin && !user?.isManager) return <Navigate to="/login" />;

  useEffect(() => {
    supabase.from("shop_customers" as any).select("*").order("created_at", { ascending: false })
      .then(({ data }) => { setCustomers((data as unknown as ShopCustomer[]) ?? []); setLoading(false); });
  }, []);

  const openCreate = () => { setEditing(null); setForm(empty); setFormError(null); setModalOpen(true); };
  const openEdit = (c: ShopCustomer) => {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone ?? "", email: c.email ?? "", address: c.address ?? "", notes: c.notes ?? "" });
    setFormError(null);
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) { setFormError("Name is required."); return; }
    setSaving(true);
    const payload = { name: form.name.trim(), phone: form.phone || null, email: form.email || null, address: form.address || null, notes: form.notes || null };
    if (editing) {
      const { data, error } = await supabase.from("shop_customers" as any).update(payload).eq("id", editing.id).select().single();
      if (error) { setFormError(error.message); setSaving(false); return; }
      setCustomers((cs) => cs.map((c) => c.id === editing.id ? data as unknown as ShopCustomer : c));
    } else {
      const { data, error } = await supabase.from("shop_customers" as any).insert(payload).select().single();
      if (error) { setFormError(error.message); setSaving(false); return; }
      setCustomers((cs) => [data as unknown as ShopCustomer, ...cs]);
    }
    setSaving(false);
    setModalOpen(false);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await supabase.from("shop_customers" as any).delete().eq("id", deleteId);
    setCustomers((cs) => cs.filter((c) => c.id !== deleteId));
    setDeleteId(null);
  };

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (c.phone ?? "").includes(search)
  );

  return (
    <div className="bg-background min-h-screen">
      <div className="section-padding pt-10 pb-24">
        <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-overline mb-1">Shop</p>
            <h1 className="heading-section">Customers</h1>
          </div>
          <button onClick={openCreate} className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> New Customer
          </button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-9 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <User className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-body">No customers found.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Email</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c, i) => (
                  <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/shop/customers/${c.id}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground hidden md:table-cell">{c.phone ?? "—"}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground hidden md:table-cell">{c.email ?? "—"}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-md hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background rounded-xl border border-border p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">{editing ? "Edit Customer" : "New Customer"}</h2>
                <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                {(["name", "phone", "email", "address"] as const).map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-foreground mb-1 capitalize">{field}{field === "name" ? " *" : ""}</label>
                    <input
                      type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                      value={form[field]}
                      onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                </div>
              </div>
              {formError && <p className="text-sm text-red-600 mt-3">{formError}</p>}
              <div className="flex justify-end gap-2 mt-5">
                <button onClick={() => setModalOpen(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors">Cancel</button>
                <button onClick={save} disabled={saving} className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-60">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-background rounded-xl border border-border p-6 w-full max-w-sm text-center">
              <h2 className="text-lg font-bold text-foreground mb-2">Delete Customer?</h2>
              <p className="text-sm text-muted-foreground mb-5">This action cannot be undone.</p>
              <div className="flex justify-center gap-3">
                <button onClick={() => setDeleteId(null)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">Cancel</button>
                <button onClick={confirmDelete} className="bg-red-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-red-700">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShopCustomers;
