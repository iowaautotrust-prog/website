import { useState, useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { ShopCustomer, ShopVehicle, ServiceJob, ShopInvoice } from "@/lib/shopTypes";
import { ArrowLeft, Plus, Loader2, Car, X, Edit2, Save } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

type VehForm = { make: string; model: string; year: string; plate: string; vin: string; color: string };
const emptyVeh: VehForm = { make: "", model: "", year: "", plate: "", vin: "", color: "" };

const ShopCustomerDetail = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<ShopCustomer | null>(null);
  const [vehicles, setVehicles] = useState<ShopVehicle[]>([]);
  const [jobs, setJobs] = useState<ServiceJob[]>([]);
  const [invoices, setInvoices] = useState<ShopInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [custForm, setCustForm] = useState({ name: "", phone: "", email: "", address: "", notes: "" });
  const [savingCust, setSavingCust] = useState(false);
  const [vehModal, setVehModal] = useState(false);
  const [vehForm, setVehForm] = useState<VehForm>(emptyVeh);
  const [savingVeh, setSavingVeh] = useState(false);
  const [vehError, setVehError] = useState<string | null>(null);

  if (!user?.isAdmin && !user?.isManager) return <Navigate to="/login" />;

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const [{ data: c }, { data: v }, { data: j }, { data: inv }] = await Promise.all([
        supabase.from("shop_customers" as any).select("*").eq("id", id).single(),
        supabase.from("shop_vehicles" as any).select("*").eq("customer_id", id).order("created_at", { ascending: false }),
        supabase.from("service_jobs" as any).select("*, vehicle:shop_vehicles(make,model,year)").eq("customer_id", id).order("created_at", { ascending: false }),
        supabase.from("shop_invoices" as any).select("*").eq("customer_id", id).order("created_at", { ascending: false }),
      ]);
      if (c) {
        const cu = c as unknown as ShopCustomer;
        setCustomer(cu);
        setCustForm({ name: cu.name, phone: cu.phone ?? "", email: cu.email ?? "", address: cu.address ?? "", notes: cu.notes ?? "" });
      }
      setVehicles((v as unknown as ShopVehicle[]) ?? []);
      setJobs((j as unknown as ServiceJob[]) ?? []);
      setInvoices((inv as unknown as ShopInvoice[]) ?? []);
      setLoading(false);
    };
    load();
  }, [id]);

  const saveCustomer = async () => {
    if (!customer || !custForm.name.trim()) return;
    setSavingCust(true);
    const payload = { name: custForm.name, phone: custForm.phone || null, email: custForm.email || null, address: custForm.address || null, notes: custForm.notes || null };
    const { data } = await supabase.from("shop_customers" as any).update(payload).eq("id", customer.id).select().single();
    if (data) setCustomer(data as unknown as ShopCustomer);
    setSavingCust(false);
    setEditingCustomer(false);
  };

  const addVehicle = async () => {
    if (!vehForm.make.trim() || !vehForm.model.trim()) { setVehError("Make and model are required."); return; }
    setSavingVeh(true);
    const { data, error } = await supabase.from("shop_vehicles" as any).insert({
      customer_id: id,
      make: vehForm.make,
      model: vehForm.model,
      year: vehForm.year ? parseInt(vehForm.year) : null,
      plate: vehForm.plate || null,
      vin: vehForm.vin || null,
      color: vehForm.color || null,
    }).select().single();
    if (error) { setVehError(error.message); setSavingVeh(false); return; }
    setVehicles((vs) => [data as unknown as ShopVehicle, ...vs]);
    setSavingVeh(false);
    setVehModal(false);
    setVehForm(emptyVeh);
  };

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!customer) return <div className="section-padding pt-10"><p>Customer not found.</p></div>;

  return (
    <div className="bg-background min-h-screen">
      <div className="section-padding pt-10 pb-24">
        <Link to="/shop/customers" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Customers
        </Link>

        {/* Customer info */}
        <div className="rounded-xl border border-border p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-overline mb-1">Customer</p>
              <h1 className="text-2xl font-bold text-foreground">{customer.name}</h1>
            </div>
            <button onClick={() => setEditingCustomer((v) => !v)} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
          {editingCustomer ? (
            <div className="space-y-3">
              {(["name", "phone", "email", "address", "notes"] as const).map((f) => (
                <div key={f}>
                  <label className="block text-xs font-medium text-muted-foreground mb-1 capitalize">{f}</label>
                  <input value={custForm[f]} onChange={(e) => setCustForm({ ...custForm, [f]: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <button onClick={saveCustomer} disabled={savingCust} className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 flex items-center gap-2">
                  {savingCust && <Loader2 className="w-3 h-3 animate-spin" />}<Save className="w-3 h-3" /> Save
                </button>
                <button onClick={() => setEditingCustomer(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              {customer.phone && <div><p className="text-muted-foreground text-xs">Phone</p><p className="text-foreground">{customer.phone}</p></div>}
              {customer.email && <div><p className="text-muted-foreground text-xs">Email</p><p className="text-foreground">{customer.email}</p></div>}
              {customer.address && <div className="sm:col-span-2"><p className="text-muted-foreground text-xs">Address</p><p className="text-foreground">{customer.address}</p></div>}
              {customer.notes && <div className="sm:col-span-2"><p className="text-muted-foreground text-xs">Notes</p><p className="text-foreground">{customer.notes}</p></div>}
            </div>
          )}
        </div>

        {/* Vehicles */}
        <div className="rounded-xl border border-border overflow-hidden mb-6">
          <div className="px-6 py-4 bg-secondary flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Vehicles</h2>
            <button onClick={() => { setVehModal(true); setVehForm(emptyVeh); setVehError(null); }}
              className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-primary/90 flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add Vehicle
            </button>
          </div>
          {vehicles.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">No vehicles yet</div>
          ) : (
            <div className="divide-y divide-border">
              {vehicles.map((v) => (
                <div key={v.id} className="px-6 py-3 flex items-center gap-3">
                  <Car className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{v.year} {v.make} {v.model}</p>
                    <p className="text-xs text-muted-foreground">
                      {[v.color, v.plate, v.vin].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Service history */}
        <div className="rounded-xl border border-border overflow-hidden mb-6">
          <div className="px-6 py-4 bg-secondary"><h2 className="font-semibold text-foreground">Service History</h2></div>
          {jobs.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">No service history</div>
          ) : (
            <div className="divide-y divide-border">
              {jobs.map((j) => (
                <Link key={j.id} to={`/shop/jobs/${j.id}`} className="px-6 py-3 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-foreground">{j.job_number}</p>
                    <p className="text-xs text-muted-foreground">{new Date(j.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors[j.status] ?? ""}`}>
                    {j.status.replace("_", " ")}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Invoices */}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 bg-secondary"><h2 className="font-semibold text-foreground">Invoices</h2></div>
          {invoices.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">No invoices</div>
          ) : (
            <div className="divide-y divide-border">
              {invoices.map((inv) => (
                <div key={inv.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">#{inv.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">{new Date(inv.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${inv.paid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {inv.paid ? "Paid" : "Unpaid"}
                    </span>
                    <span className="text-sm font-bold text-foreground">${inv.total.toFixed(2)}</span>
                    <a href={`/shop/invoices/${inv.id}/print`} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline">Print</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add vehicle modal */}
      <AnimatePresence>
        {vehModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-background rounded-xl border border-border p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Add Vehicle</h2>
                <button onClick={() => setVehModal(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(["make", "model", "year", "plate", "vin", "color"] as const).map((f) => (
                  <div key={f} className={f === "vin" ? "col-span-2" : ""}>
                    <label className="block text-sm font-medium text-foreground mb-1 capitalize">{f}{["make", "model"].includes(f) ? " *" : ""}</label>
                    <input value={vehForm[f]} onChange={(e) => setVehForm({ ...vehForm, [f]: e.target.value })}
                      type={f === "year" ? "number" : "text"}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                ))}
              </div>
              {vehError && <p className="text-sm text-red-600 mt-2">{vehError}</p>}
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setVehModal(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">Cancel</button>
                <button onClick={addVehicle} disabled={savingVeh} className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 flex items-center gap-2 disabled:opacity-60">
                  {savingVeh && <Loader2 className="w-3 h-3 animate-spin" />} Add Vehicle
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShopCustomerDetail;
