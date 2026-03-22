import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { Appointment, ShopCustomer, ShopVehicle } from "@/lib/shopTypes";
import { ArrowLeft, Plus, Calendar, Loader2, X, Search, ChevronRight } from "lucide-react";

type DateFilter = "today" | "week" | "all";
type StatusFilter = "all" | "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled";

const SERVICE_TYPES = ["Oil Change", "Filter Replacement", "Full Service", "Tire Rotation", "Inspection", "Other"];

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  confirmed: "bg-indigo-100 text-indigo-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

type ApptForm = {
  guest_name: string; guest_phone: string; guest_email: string;
  customer_id: string; vehicle_id: string;
  scheduled_date: string; scheduled_time: string;
  service_type: string; notes: string;
};
const emptyForm: ApptForm = {
  guest_name: "", guest_phone: "", guest_email: "",
  customer_id: "", vehicle_id: "",
  scheduled_date: "", scheduled_time: "09:00",
  service_type: "Oil Change", notes: "",
};

const ShopAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<ShopCustomer[]>([]);
  const [vehicles, setVehicles] = useState<ShopVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<ApptForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  if (!user?.isAdmin && !user?.isManager) return <Navigate to="/login" />;

  useEffect(() => {
    const load = async () => {
      const [{ data: a }, { data: c }] = await Promise.all([
        supabase.from("appointments" as any).select("*, customer:shop_customers(name), vehicle:shop_vehicles(make,model,year)").order("scheduled_at", { ascending: false }),
        supabase.from("shop_customers" as any).select("id,name").order("name"),
      ]);
      setAppointments((a as unknown as Appointment[]) ?? []);
      setCustomers((c as unknown as ShopCustomer[]) ?? []);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!form.customer_id) { setVehicles([]); return; }
    supabase.from("shop_vehicles" as any).select("id,make,model,year").eq("customer_id", form.customer_id)
      .then(({ data }) => setVehicles((data as unknown as ShopVehicle[]) ?? []));
  }, [form.customer_id]);

  const filterAppts = () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86400000);
    const weekEnd = new Date(todayStart.getTime() + 7 * 86400000);

    return appointments.filter((a) => {
      const d = new Date(a.scheduled_at);
      if (dateFilter === "today" && (d < todayStart || d >= todayEnd)) return false;
      if (dateFilter === "week" && (d < todayStart || d >= weekEnd)) return false;
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = ((a.customer as any)?.name ?? a.guest_name ?? "").toLowerCase();
        if (!name.includes(q) && !a.service_type.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  };

  const saveAppt = async () => {
    if (!form.scheduled_date || !form.scheduled_time) { setFormError("Date and time are required."); return; }
    if (!form.guest_name.trim() && !form.customer_id) { setFormError("Guest name or customer selection required."); return; }
    setSaving(true);
    const scheduled_at = `${form.scheduled_date}T${form.scheduled_time}:00`;
    const payload: any = {
      scheduled_at,
      service_type: form.service_type,
      notes: form.notes || null,
      status: "scheduled",
      reminder_5d_sent: false,
      reminder_2d_sent: false,
    };
    if (form.customer_id) {
      payload.customer_id = form.customer_id;
      payload.vehicle_id = form.vehicle_id || null;
    } else {
      payload.guest_name = form.guest_name;
      payload.guest_phone = form.guest_phone || null;
      payload.guest_email = form.guest_email || null;
    }
    const { data, error } = await supabase.from("appointments" as any).insert(payload)
      .select("*, customer:shop_customers(name), vehicle:shop_vehicles(make,model,year)").single();
    if (error) { setFormError(error.message); setSaving(false); return; }
    setAppointments((as) => [data as unknown as Appointment, ...as]);
    setSaving(false);
    setModalOpen(false);
    setForm(emptyForm);
  };

  const updateStatus = async (id: string, status: Appointment["status"]) => {
    await supabase.from("appointments" as any).update({ status }).eq("id", id);
    setAppointments((as) => as.map((a) => a.id === id ? { ...a, status } : a));
  };

  const convertToJob = async (appt: Appointment) => {
    setConvertingId(appt.id);
    const job_number = `JOB-${Date.now().toString(36).toUpperCase()}`;
    const { error } = await supabase.from("service_jobs" as any).insert({
      job_number,
      customer_id: appt.customer_id,
      vehicle_id: appt.vehicle_id,
      status: "pending",
      notes: `From appointment: ${appt.service_type}${appt.notes ? ` — ${appt.notes}` : ""}`,
      updated_at: new Date().toISOString(),
    });
    if (!error) {
      await supabase.from("appointments" as any).update({ status: "in_progress" }).eq("id", appt.id);
      setAppointments((as) => as.map((a) => a.id === appt.id ? { ...a, status: "in_progress" as any } : a));
    }
    setConvertingId(null);
  };

  const filtered = filterAppts();

  return (
    <div className="bg-background min-h-screen">
      <div className="section-padding pt-10 pb-24">
        <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-overline mb-1">Shop</p>
            <h1 className="heading-section">Appointments</h1>
          </div>
          <button onClick={() => { setForm(emptyForm); setFormError(null); setModalOpen(true); }}
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> New Appointment
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(["today", "week", "all"] as DateFilter[]).map((f) => (
            <button key={f} onClick={() => setDateFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${dateFilter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              {f === "today" ? "Today" : f === "week" ? "This Week" : "All"}
            </button>
          ))}
          <div className="h-6 w-px bg-border mx-1 self-center" />
          {(["all", "scheduled", "confirmed", "completed", "cancelled"] as StatusFilter[]).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              {s}
            </button>
          ))}
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search appointments..."
            className="w-full pl-9 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-body">No appointments found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                className="rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-foreground">
                      {(a.customer as any)?.name ?? a.guest_name ?? "Guest"}
                    </p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[a.status] ?? ""}`}>
                      {a.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{a.service_type}</p>
                  {(a.vehicle as any) && (
                    <p className="text-xs text-muted-foreground">{(a.vehicle as any).year} {(a.vehicle as any).make} {(a.vehicle as any).model}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(a.scheduled_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select value={a.status} onChange={(e) => updateStatus(a.id, e.target.value as Appointment["status"])}
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs">
                    {["scheduled", "confirmed", "in_progress", "completed", "cancelled"].map((s) => (
                      <option key={s} value={s}>{s.replace("_", " ")}</option>
                    ))}
                  </select>
                  {(a.status === "scheduled" || a.status === "confirmed") && (
                    <button onClick={() => convertToJob(a)} disabled={convertingId === a.id}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
                      {convertingId === a.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronRight className="w-3 h-3" />}
                      Convert to Job
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* New appointment modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-background rounded-xl border border-border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">New Appointment</h2>
                <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Existing Customer</label>
                  <select value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value, vehicle_id: "" })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">— Guest (fill info below) —</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {form.customer_id && vehicles.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Vehicle</label>
                    <select value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="">— Select vehicle —</option>
                      {vehicles.map((v) => <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>)}
                    </select>
                  </div>
                )}

                {!form.customer_id && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Guest Name *</label>
                      <input value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
                        <input value={form.guest_phone} onChange={(e) => setForm({ ...form, guest_phone: e.target.value })}
                          type="tel" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                        <input value={form.guest_email} onChange={(e) => setForm({ ...form, guest_email: e.target.value })}
                          type="email" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Service Type</label>
                  <select value={form.service_type} onChange={(e) => setForm({ ...form, service_type: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    {SERVICE_TYPES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Date *</label>
                    <input type="date" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Time *</label>
                    <input type="time" value={form.scheduled_time} onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                </div>
              </div>
              {formError && <p className="text-sm text-red-600 mt-3">{formError}</p>}
              <div className="flex justify-end gap-2 mt-5">
                <button onClick={() => setModalOpen(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">Cancel</button>
                <button onClick={saveAppt} disabled={saving}
                  className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 flex items-center gap-2 disabled:opacity-60">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} Book Appointment
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShopAppointments;
