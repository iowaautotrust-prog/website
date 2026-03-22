import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { ServiceJob } from "@/lib/shopTypes";
import { ArrowLeft, Plus, Search, Loader2, Briefcase } from "lucide-react";

type StatusFilter = "all" | "pending" | "in_progress" | "completed" | "cancelled";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const tabs: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const ShopJobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<ServiceJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  if (!user?.isAdmin && !user?.isManager) return <Navigate to="/login" />;

  useEffect(() => {
    supabase
      .from("service_jobs" as any)
      .select("*, customer:shop_customers(name), vehicle:shop_vehicles(make,model,year,plate)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setJobs((data as unknown as ServiceJob[]) ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = jobs.filter((j) => {
    const matchStatus = statusFilter === "all" || j.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      j.job_number.toLowerCase().includes(q) ||
      ((j.customer as any)?.name ?? "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <div className="bg-background min-h-screen">
      <div className="section-padding pt-10 pb-24">
        <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-overline mb-1">Shop</p>
            <h1 className="heading-section">Work Orders</h1>
          </div>
          <Link to="/shop/jobs/new" className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> New Job
          </Link>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 mb-4 flex-wrap">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setStatusFilter(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === t.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by job number or customer..."
            className="w-full pl-9 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-body">No jobs found.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Job #</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((j, i) => (
                  <motion.tr key={j.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="hover:bg-secondary/30 transition-colors cursor-pointer">
                    <td className="px-6 py-4">
                      <Link to={`/shop/jobs/${j.id}`} className="text-sm font-mono font-bold text-primary hover:underline">{j.job_number}</Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">{(j.customer as any)?.name ?? "—"}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground hidden md:table-cell">
                      {(j.vehicle as any) ? `${(j.vehicle as any).year ?? ""} ${(j.vehicle as any).make} ${(j.vehicle as any).model}` : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground hidden sm:table-cell">
                      {new Date(j.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors[j.status] ?? ""}`}>
                        {j.status.replace("_", " ")}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopJobs;
