import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { Coupon } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Trash2, X, Loader2, Tag, Ticket, ToggleLeft, ToggleRight } from "lucide-react";
import Footer from "@/components/Footer";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const emptyForm = () => ({
  code: "",
  discount_type: "fixed" as "fixed" | "percent",
  discount_value: 0,
  min_price: "",
  max_uses: "",
  expires_at: "",
  active: true,
});

const AdminDiscounts = () => {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (!user?.isAdmin) return <Navigate to="/login" />;

  const fetchCoupons = async () => {
    setLoading(true);
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    setCoupons((data as Coupon[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleSave = async () => {
    if (!form.code.trim() || !form.discount_value) {
      setFormError("Code and discount value are required.");
      return;
    }
    if (form.discount_type === "percent" && (form.discount_value <= 0 || form.discount_value > 100)) {
      setFormError("Percent discount must be between 1 and 100.");
      return;
    }
    setSaving(true);
    setFormError(null);
    const { error } = await supabase.from("coupons").insert({
      code: form.code.trim().toUpperCase(),
      discount_type: form.discount_type,
      discount_value: form.discount_value,
      min_price: form.min_price ? Number(form.min_price) : null,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      active: form.active,
    });
    if (error) {
      setFormError(error.code === "23505" ? "Coupon code already exists." : error.message);
      setSaving(false);
      return;
    }
    setSaving(false);
    setShowForm(false);
    setForm(emptyForm());
    fetchCoupons();
  };

  const toggleActive = async (coupon: Coupon) => {
    await supabase.from("coupons").update({ active: !coupon.active }).eq("id", coupon.id);
    fetchCoupons();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from("coupons").delete().eq("id", deleteId);
    setDeleteId(null);
    fetchCoupons();
  };

  const isExpired = (coupon: Coupon) => coupon.expires_at ? new Date(coupon.expires_at) < new Date() : false;
  const isMaxed = (coupon: Coupon) => coupon.max_uses !== null && coupon.used_count >= coupon.max_uses;

  return (
    <div className="bg-background min-h-screen">
      <div className="section-padding pt-10 pb-4">
        <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-overline mb-1">Admin</p>
            <h1 className="heading-section">Discounts & Coupons</h1>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-hero text-xs flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Coupon
          </button>
        </div>
      </div>

      {/* Add Coupon Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-foreground/60 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-background rounded-2xl p-8 w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2"><Ticket className="w-5 h-5 text-primary" /> New Coupon</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Coupon Code *</Label>
                <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SUMMER25" className="mt-1 font-mono uppercase" />
                <p className="text-xs text-muted-foreground mt-1">Auto-uppercased. Customers enter this at checkout.</p>
              </div>
              <div>
                <Label>Discount Type *</Label>
                <select value={form.discount_type} onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value as "fixed" | "percent" }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="fixed">Fixed Amount ($)</option>
                  <option value="percent">Percentage (%)</option>
                </select>
              </div>
              <div>
                <Label>Discount Value *</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    {form.discount_type === "percent" ? "%" : "$"}
                  </span>
                  <Input type="number" value={form.discount_value || ""} onChange={(e) => setForm((f) => ({ ...f, discount_value: Number(e.target.value) }))} className="pl-7" />
                </div>
              </div>
              <div>
                <Label>Min Vehicle Price ($)</Label>
                <Input type="number" value={form.min_price} onChange={(e) => setForm((f) => ({ ...f, min_price: e.target.value }))} placeholder="Optional" className="mt-1" />
              </div>
              <div>
                <Label>Max Uses</Label>
                <Input type="number" value={form.max_uses} onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))} placeholder="Unlimited" className="mt-1" />
              </div>
              <div className="col-span-2">
                <Label>Expiry Date</Label>
                <Input type="date" value={form.expires_at} onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))} className="mt-1" />
              </div>
              <div className="col-span-2 flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className={`relative w-10 h-5 rounded-full transition-colors ${form.active ? "bg-primary" : "bg-muted"}`} onClick={() => setForm((f) => ({ ...f, active: !f.active }))}>
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.active ? "translate-x-5" : "translate-x-0"}`} />
                  </div>
                  <span className="text-sm font-medium">{form.active ? "Active" : "Inactive"}</span>
                </label>
              </div>
            </div>
            {formError && <p className="text-sm text-destructive mt-4">{formError}</p>}
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="px-6 py-2 text-sm font-medium border border-border rounded-lg hover:bg-secondary transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-hero text-xs flex items-center gap-2">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Create Coupon
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Coupons Grid */}
      <div className="section-padding pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Ticket className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No coupons yet. Create your first discount code.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {coupons.map((c) => {
              const expired = isExpired(c);
              const maxed = isMaxed(c);
              const inactive = !c.active || expired || maxed;
              return (
                <div key={c.id} className={`p-5 rounded-xl border ${inactive ? "border-border opacity-60" : "border-border"} bg-background relative overflow-hidden`}>
                  {!inactive && <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${inactive ? "bg-secondary" : "bg-primary/10"}`}>
                        <Tag className={`w-4 h-4 ${inactive ? "text-muted-foreground" : "text-primary"}`} />
                      </div>
                      <div>
                        <p className="font-mono font-bold text-foreground tracking-wider text-sm">{c.code}</p>
                        <p className="text-xs text-muted-foreground">
                          {expired ? "Expired" : maxed ? "Max uses reached" : c.active ? "Active" : "Inactive"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => toggleActive(c)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title={c.active ? "Deactivate" : "Activate"}>
                        {c.active ? <ToggleRight className="w-4 h-4 text-primary" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                      </button>
                      <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-foreground mb-3">
                    {c.discount_type === "percent" ? `${c.discount_value}%` : `$${c.discount_value.toLocaleString()}`}
                    <span className="text-sm font-normal text-muted-foreground ml-1">off</span>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {c.min_price && <p>Min price: ${c.min_price.toLocaleString()}</p>}
                    <p>Used: {c.used_count}{c.max_uses ? ` / ${c.max_uses}` : " times"}</p>
                    {c.expires_at && <p>Expires: {new Date(c.expires_at).toLocaleDateString()}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Coupon?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this coupon code. Customers who haven't used it yet won't be able to.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Footer />
    </div>
  );
};

export default AdminDiscounts;
