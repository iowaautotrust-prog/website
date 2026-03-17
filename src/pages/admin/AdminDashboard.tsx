import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { getVehicles } from "@/data/vehicles";
import { Car, Users, DollarSign, MessageSquare, ArrowRight } from "lucide-react";
import Footer from "@/components/Footer";

const AdminDashboard = () => {
  const { user } = useAuth();
  const { leads, transactions } = useApp();

  if (!user?.isAdmin) return <Navigate to="/login" />;

  const vehicles = getVehicles();
  const totalRevenue = transactions.filter((t) => t.status === "completed").reduce((s, t) => s + t.amount, 0);

  const cards = [
    { label: "Total Vehicles", value: vehicles.length, icon: Car, link: "/admin/inventory", color: "text-primary" },
    { label: "Total Leads", value: leads.length, icon: MessageSquare, link: "/admin/leads", color: "text-primary" },
    { label: "Transactions", value: transactions.length, icon: Users, link: "/admin/transactions", color: "text-primary" },
    { label: "Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, link: "/admin/transactions", color: "text-primary" },
  ];

  return (
    <div className="bg-background min-h-screen">
      <div className="section-padding pt-8 pb-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-overline mb-2">Admin</p>
            <h1 className="heading-section">Dashboard</h1>
          </div>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back to Site</Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {cards.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <Link to={c.link} className="block p-6 rounded-xl bg-secondary hover:shadow-lg transition-all group">
                <c.icon className={`w-8 h-8 ${c.color} mb-4`} />
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <p className="text-3xl font-bold text-foreground mt-1">{c.value}</p>
                <div className="flex items-center gap-1 mt-3 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  View Details <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Recent Leads */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Recent Leads</h2>
            <Link to="/admin/leads" className="text-sm text-primary hover:underline">View All</Link>
          </div>
          <div className="rounded-xl border border-border overflow-hidden">
            {leads.length === 0 ? (
              <p className="p-6 text-muted-foreground text-sm">No leads yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-secondary">
                  <tr>
                    <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Vehicle</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.slice(-5).reverse().map((l) => (
                    <tr key={l.id} className="border-t border-border">
                      <td className="p-4 text-foreground">{l.userName}</td>
                      <td className="p-4 text-muted-foreground">{l.userEmail}</td>
                      <td className="p-4 text-foreground">{l.vehicleName}</td>
                      <td className="p-4 text-muted-foreground">{new Date(l.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-24">
          {[
            { label: "Manage Inventory", to: "/admin/inventory" },
            { label: "View Leads", to: "/admin/leads" },
            { label: "Transactions", to: "/admin/transactions" },
          ].map((item) => (
            <Link key={item.to} to={item.to} className="p-6 rounded-xl border border-border hover:border-primary hover:shadow-lg transition-all flex items-center justify-between group">
              <span className="font-medium text-foreground">{item.label}</span>
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
