import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Loader2, DollarSign, CheckCircle, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

type DateRange = "week" | "month" | "last_month" | "custom";

interface DailyRevenue { date: string; revenue: number }
interface ServiceCount { service: string; count: number }

const ShopReports = () => {
  const { user } = useAuth();
  const [range, setRange] = useState<DateRange>("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [loading, setLoading] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [jobCount, setJobCount] = useState(0);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [topServices, setTopServices] = useState<ServiceCount[]>([]);

  if (!user?.isAdmin && !user?.isManager) return <Navigate to="/login" />;

  const getDateRange = (): { start: Date; end: Date } => {
    const now = new Date();
    if (range === "week") {
      const start = new Date(now); start.setDate(now.getDate() - 7);
      return { start, end: now };
    }
    if (range === "month") {
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
    }
    if (range === "last_month") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start, end };
    }
    if (range === "custom" && customStart && customEnd) {
      return { start: new Date(customStart), end: new Date(customEnd) };
    }
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
  };

  const loadData = async () => {
    setLoading(true);
    const { start, end } = getDateRange();
    const startIso = start.toISOString();
    const endIso = end.toISOString();

    const [{ data: invoices }, { data: jobs }, { data: items }] = await Promise.all([
      supabase.from("shop_invoices" as any).select("total,created_at,paid").gte("created_at", startIso).lte("created_at", endIso).eq("paid", true),
      supabase.from("service_jobs" as any).select("id,completed_at").eq("status", "completed").gte("completed_at", startIso).lte("completed_at", endIso),
      supabase.from("service_items" as any).select("service_type,job_id").gte("created_at", startIso).lte("created_at", endIso),
    ]);

    const invArr = (invoices as any[]) ?? [];
    const revenue = invArr.reduce((s: number, i: any) => s + (i.total ?? 0), 0);
    setTotalRevenue(revenue);
    setJobCount((jobs as any[])?.length ?? 0);

    // Build daily revenue
    const byDay: Record<string, number> = {};
    invArr.forEach((inv: any) => {
      const d = new Date(inv.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      byDay[d] = (byDay[d] ?? 0) + inv.total;
    });
    const days = Object.entries(byDay).map(([date, revenue]) => ({ date, revenue }));
    days.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setDailyRevenue(days);

    // Top services
    const byService: Record<string, number> = {};
    ((items as any[]) ?? []).forEach((i: any) => {
      byService[i.service_type] = (byService[i.service_type] ?? 0) + 1;
    });
    const services = Object.entries(byService)
      .map(([service, count]) => ({ service, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
    setTopServices(services);

    setLoading(false);
  };

  useEffect(() => { loadData(); }, [range]);

  const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4", "#84cc16"];

  return (
    <div className="bg-background min-h-screen">
      <div className="section-padding pt-10 pb-24">
        <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-overline mb-1">Shop</p>
            <h1 className="heading-section">Reports</h1>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {(["week", "month", "last_month", "custom"] as DateRange[]).map((r) => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${range === r ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                {r === "week" ? "This Week" : r === "month" ? "This Month" : r === "last_month" ? "Last Month" : "Custom"}
              </button>
            ))}
            {range === "custom" && (
              <div className="flex items-center gap-2">
                <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
                  className="rounded-lg border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary" />
                <span className="text-xs text-muted-foreground">to</span>
                <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
                  className="rounded-lg border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary" />
                <button onClick={loadData} className="bg-primary text-primary-foreground rounded-lg px-3 py-1 text-xs font-medium hover:bg-primary/90">Go</button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                </div>
                <p className="text-3xl font-bold text-foreground">${totalRevenue.toFixed(2)}</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="rounded-xl border border-border p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-sm text-muted-foreground">Jobs Completed</p>
                </div>
                <p className="text-3xl font-bold text-foreground">{jobCount}</p>
              </motion.div>
            </div>

            {/* Daily revenue line chart */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="rounded-xl border border-border p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Daily Revenue</h2>
              </div>
              {dailyRevenue.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No revenue data for this period</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={dailyRevenue} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, "Revenue"]}
                      contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            {/* Top services bar chart */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="rounded-xl border border-border p-6">
              <h2 className="text-sm font-semibold text-foreground mb-6">Top Services</h2>
              {topServices.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No service data for this period</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={topServices} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                    <YAxis type="category" dataKey="service" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={120} />
                    <Tooltip formatter={(v: number) => [v, "Count"]}
                      contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {topServices.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopReports;
