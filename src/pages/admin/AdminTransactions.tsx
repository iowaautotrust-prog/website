import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { ArrowLeft } from "lucide-react";
import Footer from "@/components/Footer";

const AdminTransactions = () => {
  const { user } = useAuth();
  const { transactions } = useApp();

  if (!user?.isAdmin) return <Navigate to="/login" />;

  const totalRevenue = transactions.filter((t) => t.status === "completed").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="bg-background min-h-screen">
      <div className="section-padding pt-8 pb-4">
        <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
        <h1 className="heading-section mb-2">Transactions</h1>
        <p className="text-body">Total Revenue: <span className="text-primary font-bold">${totalRevenue.toLocaleString()}</span></p>
      </div>

      <div className="section-padding pb-24 mt-8">
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground">Vehicle</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Buyer</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Email</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Date</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="p-4 font-medium text-foreground">{t.vehicleName}</td>
                  <td className="p-4 text-foreground">{t.buyerName}</td>
                  <td className="p-4 text-muted-foreground hidden md:table-cell">{t.buyerEmail}</td>
                  <td className="p-4 text-foreground font-medium">${t.amount.toLocaleString()}</td>
                  <td className="p-4 text-muted-foreground hidden md:table-cell">{t.date}</td>
                  <td className="p-4">
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                      t.status === "completed" ? "bg-primary/10 text-primary" :
                      t.status === "pending" ? "bg-accent text-accent-foreground" :
                      "bg-destructive/10 text-destructive"
                    }`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminTransactions;
