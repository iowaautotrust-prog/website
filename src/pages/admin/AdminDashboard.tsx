import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/lib/supabase";
import {
  Car,
  Users,
  DollarSign,
  MessageSquare,
  ArrowRight,
  Tag,
  UploadCloud,
  Eye,
  FlaskConical,
} from "lucide-react";
import Footer from "@/components/Footer";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";
import type { Lead, Transaction, Vehicle } from "@/lib/types";

const COLORS = ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"];

const AdminDashboard = () => {
  const { user } = useAuth();
  const { isDemoMode, toggleDemoMode } = useApp();
  const [stats, setStats] = useState({
    vehicleCount: 0,
    leadCount: 0,
    transactionCount: 0,
    revenue: 0,
  });
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [topViewed, setTopViewed] = useState<{ name: string; views: number }[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<{ name: string; value: number }[]>([]);
  const [leadsTrend, setLeadsTrend] = useState<{ date: string; leads: number }[]>([]);
  const [loading, setLoading] = useState(true);

  if (!user?.isAdmin) return <Navigate to="/login" />;

  useEffect(() => {
    const fetchAll = async () => {
      const [
        { count: vehicleCount },
        { count: leadCount },
        { count: transactionCount },
        { data: transactions },
        { data: leads },
        { data: topVehicles },
        { data: statusData },
      ] = await Promise.all([
        supabase.from("vehicles").select("*", { count: "exact", head: true }),
        supabase.from("leads").select("*", { count: "exact", head: true }),
        supabase.from("transactions").select("*", { count: "exact", head: true }),
        supabase
          .from("transactions")
          .select("amount, status")
          .eq("status", "completed"),
        supabase
          .from("leads")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("vehicles")
          .select("name, view_count")
          .order("view_count", { ascending: false })
          .limit(10),
        supabase.from("vehicles").select("status"),
      ]);

      const revenue = (transactions ?? []).reduce(
        (s: number, t: { amount: number | null }) => s + (t.amount ?? 0),
        0
      );

      setStats({
        vehicleCount: vehicleCount ?? 0,
        leadCount: leadCount ?? 0,
        transactionCount: transactionCount ?? 0,
        revenue,
      });
      setRecentLeads((leads as Lead[]) ?? []);
      setTopViewed(
        (topVehicles as Vehicle[] ?? []).map((v) => ({
          name: v.name.length > 20 ? v.name.substring(0, 18) + "…" : v.name,
          views: v.view_count,
        }))
      );

      // Status breakdown
      const available = (statusData ?? []).filter((v: { status: string }) => v.status === "available").length;
      const pending = (statusData ?? []).filter((v: { status: string }) => v.status === "pending").length;
      setStatusBreakdown([
        { name: "Available", value: available },
        { name: "Pending", value: pending },
      ]);

      // Leads trend — last 14 days
      const now = new Date();
      const trendMap: Record<string, number> = {};
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        trendMap[d.toISOString().split("T")[0]] = 0;
      }
      const { data: allLeads } = await supabase
        .from("leads")
        .select("created_at")
        .gte("created_at", new Date(Date.now() - 14 * 86400000).toISOString());
      (allLeads ?? []).forEach((l: { created_at: string }) => {
        const day = l.created_at.split("T")[0];
        if (day in trendMap) trendMap[day]++;
      });
      setLeadsTrend(
        Object.entries(trendMap).map(([date, leads]) => ({
          date: date.slice(5), // MM-DD
          leads,
        }))
      );

      setLoading(false);
    };
    fetchAll();
  }, []);

  const statCards = [
    {
      label: "Total Vehicles",
      value: stats.vehicleCount,
      icon: Car,
      link: "/admin/inventory",
    },
    {
      label: "Total Leads",
      value: stats.leadCount,
      icon: MessageSquare,
      link: "/admin/leads",
    },
    {
      label: "Transactions",
      value: stats.transactionCount,
      icon: Users,
      link: "/admin/transactions",
    },
    {
      label: "Revenue",
      value: `$${stats.revenue.toLocaleString()}`,
      icon: DollarSign,
      link: "/admin/transactions",
    },
  ];

  const navItems = [
    { label: "Manage Inventory", to: "/admin/inventory", icon: Car },
    { label: "Categories", to: "/admin/categories", icon: Tag },
    { label: "CSV Import", to: "/admin/import", icon: UploadCloud },
    { label: "Leads", to: "/admin/leads", icon: MessageSquare },
    { label: "Transactions", to: "/admin/transactions", icon: DollarSign },
    { label: "Users", to: "/admin/users", icon: Users },
  ];

  return (
    <div className="bg-background min-h-screen">
      <div className="section-padding pt-10 pb-4">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-overline mb-2">Iowa Auto Trust</p>
            <h1 className="heading-section">Admin Dashboard</h1>
          </div>
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Site
          </Link>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {statCards.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <Link
                to={c.link}
                className="block p-6 rounded-xl bg-secondary hover:shadow-lg transition-all group"
              >
                <c.icon className="w-7 h-7 text-primary mb-4" />
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {loading ? "—" : c.value}
                </p>
                <div className="flex items-center gap-1 mt-3 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  View Details <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Top Viewed Vehicles */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-border p-6"
          >
            <div className="flex items-center gap-2 mb-5">
              <Eye className="w-4 h-4 text-primary" />
              <h3 className="font-semibold">Top Viewed Vehicles</h3>
            </div>
            {topViewed.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topViewed} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip />
                  <Bar dataKey="views" fill="#2563eb" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-10 text-center">
                No view data yet
              </p>
            )}
          </motion.div>

          {/* Inventory Status Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-xl border border-border p-6"
          >
            <div className="flex items-center gap-2 mb-5">
              <Car className="w-4 h-4 text-primary" />
              <h3 className="font-semibold">Inventory Status</h3>
            </div>
            {statusBreakdown.some((s) => s.value > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={statusBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusBreakdown.map((_, index) => (
                      <Cell
                        key={index}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-10 text-center">
                No inventory data yet
              </p>
            )}
          </motion.div>
        </div>

        {/* Leads Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-border p-6 mb-12"
        >
          <div className="flex items-center gap-2 mb-5">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">Leads — Last 14 Days</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={leadsTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="leads"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Recent Leads */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Recent Leads</h2>
            <Link to="/admin/leads" className="text-sm text-primary hover:underline">
              View All
            </Link>
          </div>
          <div className="rounded-xl border border-border overflow-hidden">
            {recentLeads.length === 0 ? (
              <p className="p-6 text-muted-foreground text-sm">No leads yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-secondary">
                  <tr>
                    <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
                    <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Vehicle</th>
                    <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Type</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.map((l) => (
                    <tr key={l.id} className="border-t border-border hover:bg-secondary/40 transition-colors">
                      <td className="p-4 font-medium text-foreground">{l.name}</td>
                      <td className="p-4 text-muted-foreground">{l.email}</td>
                      <td className="p-4 text-foreground hidden md:table-cell">
                        {l.vehicle_name ?? "—"}
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium capitalize">
                          {l.lead_type}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(l.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Demo Data Toggle */}
        <div className="mb-8 p-5 rounded-xl border border-border bg-secondary/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FlaskConical className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Demo Data Mode</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isDemoMode
                  ? "Showing 30 demo vehicles across the site. Turn off to show your real inventory."
                  : "Site is showing your real Supabase data. Enable to preview with 30 demo vehicles."}
              </p>
            </div>
          </div>
          <button
            onClick={toggleDemoMode}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
              isDemoMode ? "bg-primary" : "bg-border"
            }`}
            role="switch"
            aria-checked={isDemoMode}
            aria-label="Toggle demo data"
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-background shadow-sm transition-transform ${
                isDemoMode ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-24">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="p-5 rounded-xl border border-border hover:border-primary hover:shadow-md transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 text-primary" />
                <span className="font-medium text-foreground text-sm">{item.label}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
