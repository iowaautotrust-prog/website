import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { ServiceJob, Appointment } from "@/lib/shopTypes";
import {
  Briefcase, Calendar, CheckCircle, Clock, Plus, ArrowLeft,
  Users, Loader2, ChevronRight,
} from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const ShopDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [todayJobs, setTodayJobs] = useState(0);
  const [scheduledAppts, setScheduledAppts] = useState(0);
  const [openJobs, setOpenJobs] = useState(0);
  const [completedMonth, setCompletedMonth] = useState(0);
  const [recentJobs, setRecentJobs] = useState<ServiceJob[]>([]);
  const [todayAppts, setTodayAppts] = useState<Appointment[]>([]);

  if (!user?.isAdmin && !user?.isManager) return <Navigate to="/login" />;

  useEffect(() => {
    const load = async () => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [
        { count: tj },
        { count: sa },
        { count: oj },
        { count: cm },
        { data: rj },
        { data: ta },
      ] = await Promise.all([
        supabase.from("service_jobs" as any).select("*", { count: "exact", head: true })
          .gte("created_at", todayStart).lt("created_at", todayEnd),
        supabase.from("appointments" as any).select("*", { count: "exact", head: true })
          .eq("status", "scheduled"),
        supabase.from("service_jobs" as any).select("*", { count: "exact", head: true })
          .in("status", ["pending", "in_progress"]),
        supabase.from("service_jobs" as any).select("*", { count: "exact", head: true })
          .eq("status", "completed").gte("completed_at", monthStart),
        supabase.from("service_jobs" as any)
          .select("*, customer:shop_customers(name), vehicle:shop_vehicles(make,model,year)")
          .order("created_at", { ascending: false }).limit(10),
        supabase.from("appointments" as any)
          .select("*, customer:shop_customers(name), vehicle:shop_vehicles(make,model,year)")
          .eq("status", "scheduled")
          .gte("scheduled_at", todayStart)
          .order("scheduled_at", { ascending: true }).limit(5),
      ]);

      setTodayJobs(tj ?? 0);
      setScheduledAppts(sa ?? 0);
      setOpenJobs(oj ?? 0);
      setCompletedMonth(cm ?? 0);
      setRecentJobs((rj as unknown as ServiceJob[]) ?? []);
      setTodayAppts((ta as unknown as Appointment[]) ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const stats = [
    { label: "Today's Jobs", value: todayJobs, icon: Briefcase, color: "text-blue-600 bg-blue-100" },
    { label: "Scheduled Appointments", value: scheduledAppts, icon: Calendar, color: "text-purple-600 bg-purple-100" },
    { label: "Open Jobs", value: openJobs, icon: Clock, color: "text-amber-600 bg-amber-100" },
    { label: "Completed This Month", value: completedMonth, icon: CheckCircle, color: "text-green-600 bg-green-100" },
  ];

  return (
    <div className="bg-background min-h-screen">
      <div className="section-padding pt-10 pb-24">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Site
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-overline mb-1">Shop Management</p>
            <h1 className="heading-section">Dashboard</h1>
          </div>
          <div className="flex gap-2">
            <Link to="/shop/jobs/new" className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> New Job
            </Link>
            <Link to="/shop/appointments" className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> Appointments
            </Link>
            <Link to="/shop/customers" className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors flex items-center gap-1.5">
              <Users className="w-4 h-4" /> Customers
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-border p-6"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{s.label}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Today's appointments */}
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="px-6 py-4 bg-secondary flex items-center justify-between">
                  <h2 className="font-semibold text-foreground">Today's Appointments</h2>
                  <Link to="/shop/appointments" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                    View all <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                {todayAppts.length === 0 ? (
                  <div className="px-6 py-10 text-center text-sm text-muted-foreground">No appointments today</div>
                ) : (
                  <div className="divide-y divide-border">
                    {todayAppts.map((a) => (
                      <div key={a.id} className="px-6 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {(a.customer as any)?.name ?? a.guest_name ?? "Guest"}
                          </p>
                          <p className="text-xs text-muted-foreground">{a.service_type}</p>
                        </div>
                        <p className="text-sm text-foreground">
                          {new Date(a.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent jobs */}
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="px-6 py-4 bg-secondary flex items-center justify-between">
                  <h2 className="font-semibold text-foreground">Recent Jobs</h2>
                  <Link to="/shop/jobs" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                    View all <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                {recentJobs.length === 0 ? (
                  <div className="px-6 py-10 text-center text-sm text-muted-foreground">No jobs yet</div>
                ) : (
                  <div className="divide-y divide-border">
                    {recentJobs.map((j) => (
                      <Link key={j.id} to={`/shop/jobs/${j.id}`} className="px-6 py-3 flex items-center justify-between hover:bg-secondary/50 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-foreground">{j.job_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {(j.customer as any)?.name ?? "—"} ·{" "}
                            {(j.vehicle as any) ? `${(j.vehicle as any).year ?? ""} ${(j.vehicle as any).make} ${(j.vehicle as any).model}` : "—"}
                          </p>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors[j.status] ?? ""}`}>
                          {j.status.replace("_", " ")}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Shop nav links */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { to: "/shop/jobs", label: "Work Orders", icon: Briefcase },
                { to: "/shop/customers", label: "Customers", icon: Users },
                { to: "/shop/invoices", label: "Invoices", icon: CheckCircle },
                { to: "/shop/inventory", label: "Inventory", icon: Clock },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-xl border border-border p-4 flex items-center gap-3 hover:bg-secondary transition-colors"
                >
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopDashboard;
