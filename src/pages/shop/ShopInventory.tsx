import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { ShopInventoryItem } from "@/lib/shopTypes";
import { ArrowLeft, Plus, Loader2, Package, X, Edit2, Minus } from "lucide-react";

type Category = ShopInventoryItem["category"];

const CATEGORIES: Category[] = ["oil", "filter", "parts", "supplies", "other"];

const categoryColors: Record<Category, string> = {
  oil: "bg-blue-100 text-blue-700",
  filter: "bg-purple-100 text-purple-700",
  parts: "bg-amber-100 text-amber-700",
  supplies: "bg-teal-100 text-teal-700",
  other: "bg-gray-100 text-gray-700",
};

type ItemForm = {
  name: string; category: Category; quantity: string; unit: string;
  min_quantity: string; unit_price: string; supplier: string; notes: string;
};
const emptyForm: ItemForm = {
  name: "", category: "oil", quantity: "0", unit: "qt",
  min_quantity: "5", unit_price: "0", supplier: "", notes: "",
};

const ShopInventory = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<ShopInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState<Category | "all">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ShopInventoryItem | null>(null);
  const [form, setForm] = useState<ItemForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!user?.isAdmin && !user?.isManager) return <Navigate to="/login" />;

  useEffect(() => {
    supabase.from("shop_inventory" as any).select("*").order("name")
      .then(({ data }) => { setItems((data as unknown as ShopInventoryItem[]) ?? []); setLoading(false); });
  }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormError(null); setModalOpen(true); };
  const openEdit = (item: ShopInventoryItem) => {
    setEditing(item);
    setForm({
      name: item.name, category: item.category, quantity: item.quantity.toString(),
      unit: item.unit ?? "", min_quantity: item.min_quantity.toString(),
      unit_price: item.unit_price.toString(), supplier: item.supplier ?? "", notes: item.notes ?? "",
    });
    setFormError(null);
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) { setFormError("Name is required."); return; }
    setSaving(true);
    const payload = {
      name: form.name,
      category: form.category,
      quantity: parseInt(form.quantity) || 0,
      unit: form.unit || null,
      min_quantity: parseInt(form.min_quantity) || 0,
      unit_price: parseFloat(form.unit_price) || 0,
      supplier: form.supplier || null,
      notes: form.notes || null,
      updated_at: new Date().toISOString(),
    };
    if (editing) {
      const { data, error } = await supabase.from("shop_inventory" as any).update(payload).eq("id", editing.id).select().single();
      if (error) { setFormError(error.message); setSaving(false); return; }
      setItems((is) => is.map((i) => i.id === editing.id ? data as unknown as ShopInventoryItem : i));
    } else {
      const { data, error } = await supabase.from("shop_inventory" as any).insert(payload).select().single();
      if (error) { setFormError(error.message); setSaving(false); return; }
      setItems((is) => [data as unknown as ShopInventoryItem, ...is]);
    }
    setSaving(false);
    setModalOpen(false);
  };

  const adjustQty = async (id: string, delta: number) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const newQty = Math.max(0, item.quantity + delta);
    await supabase.from("shop_inventory" as any).update({ quantity: newQty, updated_at: new Date().toISOString() }).eq("id", id);
    setItems((is) => is.map((i) => i.id === id ? { ...i, quantity: newQty } : i));
  };

  const filtered = items.filter((i) => catFilter === "all" || i.category === catFilter);

  return (
    <div className="bg-background min-h-screen">
      <div className="section-padding pt-10 pb-24">
        <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-overline mb-1">Shop</p>
            <h1 className="heading-section">Inventory</h1>
          </div>
          <button onClick={openCreate}
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {(["all", ...CATEGORIES] as (Category | "all")[]).map((c) => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${catFilter === c ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-body">No inventory items.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Category</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Unit Price</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item, i) => {
                  const lowStock = item.quantity <= item.min_quantity;
                  return (
                    <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className="hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        {item.supplier && <p className="text-xs text-muted-foreground">{item.supplier}</p>}
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${categoryColors[item.category]}`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => adjustQty(item.id, -1)} className="w-6 h-6 rounded-md bg-secondary hover:bg-border flex items-center justify-center transition-colors">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-mono font-bold w-8 text-center text-foreground">{item.quantity}</span>
                          <button onClick={() => adjustQty(item.id, 1)} className="w-6 h-6 rounded-md bg-secondary hover:bg-border flex items-center justify-center transition-colors">
                            <Plus className="w-3 h-3" />
                          </button>
                          {item.unit && <span className="text-xs text-muted-foreground">{item.unit}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${lowStock ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
                          {lowStock ? "Low Stock" : "OK"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground text-right hidden lg:table-cell">${item.unit_price.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openEdit(item)} className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-background rounded-xl border border-border p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">{editing ? "Edit Item" : "Add Inventory Item"}</h2>
                <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Quantity</label>
                    <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} min="0"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Unit</label>
                    <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                      placeholder="qt, ea, gal..."
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Min Quantity</label>
                    <input type="number" value={form.min_quantity} onChange={(e) => setForm({ ...form, min_quantity: e.target.value })} min="0"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Unit Price</label>
                    <input type="number" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} min="0" step="0.01"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Supplier</label>
                  <input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                </div>
              </div>
              {formError && <p className="text-sm text-red-600 mt-2">{formError}</p>}
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setModalOpen(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">Cancel</button>
                <button onClick={save} disabled={saving}
                  className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 flex items-center gap-2 disabled:opacity-60">
                  {saving && <Loader2 className="w-3 h-3 animate-spin" />} Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShopInventory;
