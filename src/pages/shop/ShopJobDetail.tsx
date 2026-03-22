import { useState, useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { ServiceJob, ServiceItem } from "@/lib/shopTypes";
import { ArrowLeft, Plus, Loader2, Trash2, X, FileText, PlayCircle, CheckCircle } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

type ItemForm = { service_type: string; oil_type: string; quantity: string; unit: string; unit_price: string; notes: string };
const emptyItem: ItemForm = { service_type: "", oil_type: "", quantity: "1", unit: "ea", unit_price: "0", notes: "" };

const QUICK_ADD = [
  { service_type: "5W-30 Oil Change", oil_type: "5W-30 Conventional", quantity: "1", unit: "service", unit_price: "29.99" },
  { service_type: "Oil Filter", oil_type: null, quantity: "1", unit: "ea", unit_price: "8.99" },
  { service_type: "Air Filter", oil_type: null, quantity: "1", unit: "ea", unit_price: "14.99" },
  { service_type: "Tire Rotation", oil_type: null, quantity: "1", unit: "service", unit_price: "19.99" },
];

const ShopJobDetail = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<ServiceJob | null>(null);
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [itemModal, setItemModal] = useState(false);
  const [itemForm, setItemForm] = useState<ItemForm>(emptyItem);
  const [itemError, setItemError] = useState<string | null>(null);
  const [generatingInv, setGeneratingInv] = useState(false);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [mileageOut, setMileageOut] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [nextMileage, setNextMileage] = useState("");

  if (!user?.isAdmin && !user?.isManager) return <Navigate to="/login" />;

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const [{ data: j }, { data: it }, { data: inv }] = await Promise.all([
        supabase.from("service_jobs" as any).select("*, customer:shop_customers(name,phone,email), vehicle:shop_vehicles(make,model,year,plate,color)").eq("id", id).single(),
        supabase.from("service_items" as any).select("*").eq("job_id", id).order("created_at"),
        supabase.from("shop_invoices" as any).select("id").eq("job_id", id).maybeSingle(),
      ]);
      if (j) {
        const jj = j as unknown as ServiceJob;
        setJob(jj);
        setNotes(jj.notes ?? "");
        setMileageOut(jj.mileage_out?.toString() ?? "");
        setNextDate(jj.next_service_date ?? "");
        setNextMileage(jj.next_service_mileage?.toString() ?? "");
      }
      setItems((it as unknown as ServiceItem[]) ?? []);
      if (inv) setInvoiceId((inv as any).id);
      setLoading(false);
    };
    load();
  }, [id]);

  const updateStatus = async (status: ServiceJob["status"]) => {
    if (!job) return;
    setSaving(true);
    const update: any = { status, updated_at: new Date().toISOString() };
    if (status === "completed") update.completed_at = new Date().toISOString();
    const { data } = await supabase.from("service_jobs" as any).update(update).eq("id", job.id).select("*, customer:shop_customers(name,phone,email), vehicle:shop_vehicles(make,model,year,plate,color)").single();
    if (data) setJob(data as unknown as ServiceJob);
    setSaving(false);
  };

  const saveNotes = async () => {
    if (!job) return;
    setSaving(true);
    await supabase.from("service_jobs" as any).update({
      notes: notes || null,
      mileage_out: mileageOut ? parseInt(mileageOut) : null,
      next_service_date: nextDate || null,
      next_service_mileage: nextMileage ? parseInt(nextMileage) : null,
      updated_at: new Date().toISOString(),
    }).eq("id", job.id);
    setSaving(false);
  };

  const addItem = async (quick?: typeof QUICK_ADD[0]) => {
    const f = quick ? { ...emptyItem, ...quick, notes: "" } : itemForm;
    if (!f.service_type.trim()) { setItemError("Service type is required."); return; }
    const payload = {
      job_id: id,
      service_type: f.service_type,
      oil_type: f.oil_type || null,
      quantity: parseFloat(f.quantity) || 1,
      unit: f.unit || "ea",
      unit_price: parseFloat(f.unit_price) || 0,
      notes: f.notes || null,
    };
    const { data, error } = await supabase.from("service_items" as any).insert(payload).select().single();
    if (error) { setItemError(error.message); return; }
    setItems((its) => [...its, data as unknown as ServiceItem]);
    if (!quick) { setItemModal(false); setItemForm(emptyItem); }
  };

  const deleteItem = async (itemId: string) => {
    await supabase.from("service_items" as any).delete().eq("id", itemId);
    setItems((its) => its.filter((i) => i.id !== itemId));
  };

  const generateInvoice = async () => {
    if (!job) return;
    setGeneratingInv(true);
    const subtotal = items.reduce((s, i) => s + (i.quantity ?? 1) * i.unit_price, 0);
    const tax_rate = 0.07;
    const tax_amount = subtotal * tax_rate;
    const total = subtotal + tax_amount;
    const invoice_number = `INV-${Date.now().toString(36).toUpperCase()}`;
    const { data, error } = await supabase.from("shop_invoices" as any).insert({
      invoice_number,
      job_id: job.id,
      customer_id: job.customer_id,
      subtotal,
      tax_rate,
      tax_amount,
      discount: 0,
      total,
      paid: false,
    }).select().single();
    if (!error && data) setInvoiceId((data as any).id);
    setGeneratingInv(false);
  };

  const runningTotal = items.reduce((s, i) => s + (i.quantity ?? 1) * i.unit_price, 0);

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!job) return <div className="section-padding pt-10"><p>Job not found.</p></div>;

  return (
    <div className="bg-background min-h-screen">
      <div className="section-padding pt-10 pb-24">
        <Link to="/shop/jobs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Work Orders
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-overline mb-1">Job</p>
            <h1 className="text-2xl font-bold text-foreground font-mono">{job.job_number}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors[job.status] ?? ""}`}>
              {job.status.replace("_", " ")}
            </span>
            {job.status === "pending" && (
              <button onClick={() => updateStatus("in_progress")} disabled={saving}
                className="bg-blue-600 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-blue-700 flex items-center gap-1.5 disabled:opacity-60">
                <PlayCircle className="w-3.5 h-3.5" /> Start Job
              </button>
            )}
            {job.status === "in_progress" && (
              <button onClick={() => updateStatus("completed")} disabled={saving}
                className="bg-green-600 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-green-700 flex items-center gap-1.5 disabled:opacity-60">
                <CheckCircle className="w-3.5 h-3.5" /> Complete Job
              </button>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Customer & Vehicle */}
          <div className="rounded-xl border border-border p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Customer</h3>
            {job.customer && (
              <div className="text-sm space-y-1">
                <p className="font-medium text-foreground">{(job.customer as any).name}</p>
                <p className="text-muted-foreground">{(job.customer as any).phone}</p>
                <p className="text-muted-foreground">{(job.customer as any).email}</p>
              </div>
            )}
            {job.vehicle && (
              <>
                <h3 className="text-sm font-semibold text-foreground pt-2">Vehicle</h3>
                <div className="text-sm space-y-1">
                  <p className="font-medium text-foreground">{(job.vehicle as any).year} {(job.vehicle as any).make} {(job.vehicle as any).model}</p>
                  <p className="text-muted-foreground">{(job.vehicle as any).color} {(job.vehicle as any).plate && `· ${(job.vehicle as any).plate}`}</p>
                </div>
              </>
            )}
          </div>

          {/* Mileage & next service */}
          <div className="rounded-xl border border-border p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Service Details</h3>
            {job.mileage_in && <p className="text-sm text-muted-foreground">Mileage In: <span className="font-medium text-foreground">{job.mileage_in.toLocaleString()}</span></p>}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Mileage Out</label>
              <input type="number" value={mileageOut} onChange={(e) => setMileageOut(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Next Service Date</label>
                <input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Next Service Mileage</label>
                <input type="number" value={nextMileage} onChange={(e) => setNextMileage(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
            </div>
            <button onClick={saveNotes} disabled={saving} className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 flex items-center gap-2 disabled:opacity-60">
              {saving && <Loader2 className="w-3 h-3 animate-spin" />} Save
            </button>
          </div>
        </div>

        {/* Service Items */}
        <div className="rounded-xl border border-border overflow-hidden mb-6">
          <div className="px-6 py-4 bg-secondary flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Service Items</h2>
            <button onClick={() => { setItemModal(true); setItemForm(emptyItem); setItemError(null); }}
              className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-primary/90 flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add Item
            </button>
          </div>

          {/* Quick add */}
          <div className="px-6 py-3 bg-secondary/50 border-b border-border">
            <p className="text-xs text-muted-foreground mb-2">Quick Add:</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_ADD.map((q) => (
                <button key={q.service_type} onClick={() => addItem(q)}
                  className="text-xs px-3 py-1 rounded-lg border border-border hover:bg-secondary transition-colors text-foreground">
                  + {q.service_type}
                </button>
              ))}
            </div>
          </div>

          {items.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">No service items yet</div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-2 text-left text-xs text-muted-foreground">Service</th>
                    <th className="px-6 py-2 text-left text-xs text-muted-foreground hidden sm:table-cell">Oil Type</th>
                    <th className="px-6 py-2 text-right text-xs text-muted-foreground">Qty</th>
                    <th className="px-6 py-2 text-right text-xs text-muted-foreground">Unit Price</th>
                    <th className="px-6 py-2 text-right text-xs text-muted-foreground">Total</th>
                    <th className="px-6 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-3 text-sm text-foreground">{item.service_type}</td>
                      <td className="px-6 py-3 text-sm text-muted-foreground hidden sm:table-cell">{item.oil_type ?? "—"}</td>
                      <td className="px-6 py-3 text-sm text-foreground text-right">{item.quantity ?? 1} {item.unit}</td>
                      <td className="px-6 py-3 text-sm text-foreground text-right">${item.unit_price.toFixed(2)}</td>
                      <td className="px-6 py-3 text-sm font-semibold text-foreground text-right">${((item.quantity ?? 1) * item.unit_price).toFixed(2)}</td>
                      <td className="px-6 py-3 text-right">
                        <button onClick={() => deleteItem(item.id)} className="text-muted-foreground hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-6 py-4 border-t border-border bg-secondary/50 flex justify-end">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Subtotal</p>
                  <p className="text-xl font-bold text-foreground">${runningTotal.toFixed(2)}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Generate invoice */}
        <div className="flex justify-end">
          {invoiceId ? (
            <a href={`/shop/invoices/${invoiceId}/print`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors">
              <FileText className="w-4 h-4" /> View Invoice
            </a>
          ) : (
            <button onClick={generateInvoice} disabled={generatingInv || items.length === 0}
              className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60">
              {generatingInv && <Loader2 className="w-4 h-4 animate-spin" />}
              <FileText className="w-4 h-4" /> Generate Invoice (7% tax)
            </button>
          )}
        </div>
      </div>

      {/* Add item modal */}
      <AnimatePresence>
        {itemModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-background rounded-xl border border-border p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Add Service Item</h2>
                <button onClick={() => setItemModal(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Service Type *</label>
                  <input value={itemForm.service_type} onChange={(e) => setItemForm({ ...itemForm, service_type: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Oil Type</label>
                  <input value={itemForm.oil_type} onChange={(e) => setItemForm({ ...itemForm, oil_type: e.target.value })}
                    placeholder="e.g. 5W-30, 0W-20"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Qty</label>
                    <input type="number" value={itemForm.quantity} onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })} min="0" step="0.1"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Unit</label>
                    <input value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Unit Price</label>
                    <input type="number" value={itemForm.unit_price} onChange={(e) => setItemForm({ ...itemForm, unit_price: e.target.value })} min="0" step="0.01"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
              </div>
              {itemError && <p className="text-sm text-red-600 mt-2">{itemError}</p>}
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setItemModal(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">Cancel</button>
                <button onClick={() => addItem()} className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90">Add</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShopJobDetail;
