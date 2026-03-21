import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { Transaction } from "@/lib/types";
import { ArrowLeft, Loader2, DollarSign } from "lucide-react";
import Footer from "@/components/Footer";

const AdminTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  if (!user?.isAdmin) return <Navigate to="/login" />;

  useEffect(() => {
    supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setTransactions((data as Transaction[]) ?? []);
        setLoading(false);
      });
  }, []);

  const totalRevenue = transactions
    .filter((t) => t.status === "completed")
    .reduce((s, t) => s + (t.amount ?? 0), 0);

  return (
    <div className="bg-background min-h-screen">
      <div className="section-padding pt-10 pb-4">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
        <div className="mb-2">
          <p className="text-overline mb-1">Admin</p>
          <h1 className="heading-section">Transactions</h1>
        </div>
        <p className="text-body">
          Total Revenue:{" "}
          <span className="text-primary font-bold text-xl">
            ${totalRevenue.toLocaleString()}
          </span>
        </p>
      </div>

      <div className="section-padding pb-24 mt-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-20">
            <DollarSign className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-body">No transactions yet.</p>
          </div>
        ) : (
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
                {transactions.map((t, i) => (
                  <motion.tr
                    key={t.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.03 * Math.min(i, 20) }}
                    className="border-t border-border hover:bg-secondary/40 transition-colors"
                  >
                    <td className="p-4 font-medium text-foreground">{t.vehicle_name ?? "—"}</td>
                    <td className="p-4 text-foreground">{t.buyer_name ?? "—"}</td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">{t.buyer_email ?? "—"}</td>
                    <td className="p-4 text-foreground font-medium">
                      {t.amount ? `$${t.amount.toLocaleString()}` : "—"}
                    </td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${
                          t.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : t.status === "pending"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AdminTransactions;
