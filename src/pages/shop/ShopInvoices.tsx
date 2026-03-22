import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { ShopInvoice } from "@/lib/shopTypes";
import { ArrowLeft, FileText, Search, Loader2, DollarSign, Printer } from "lucide-react";

type PaidFilter = "all" | "paid" | "unpaid";

const ShopInvoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<ShopInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [paidFilter, setPaidFilter] = useState<PaidFilter>("all");

  if (!user?.isAdmin && !user?.isManager) return <Navigate to="/login" />;

  useEffect(() => {
    supabase.from("shop_invoices" as any)
      .select("*, customer:shop_customers(name), job:service_jobs(job_number)")
      .order("created_at", { ascending: false })
      .then(({ data }) => { setInvoices((data as unknown as ShopInvoice[]) ?? []); setLoading(false); });
  }, []);

  const markPaid = async (id: string) => {
    await supabase.from("shop_invoices" as any).update({ paid: true, paid_at: new Date().toISOString() }).eq("id", id);
    setInvoices((is) => is.map((inv) => inv.id === id ? { ...inv, paid: true, paid_at: new Date().toISOString() } : inv));
  };

  const filtered = invoices.filter((inv) => {
    if (paidFilter === "paid" && !inv.paid) return false;
    if (paidFilter === "unpaid" && inv.paid) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return inv.invoice_number.toLowerCase().includes(q) ||
      ((inv.customer as any)?.name ?? "").toLowerCase().includes(q);
  });

  const totalRevenue = invoices.filter((i) => i.paid).reduce((s, i) => s + i.total, 0);
  const unpaidTotal = invoices.filter((i) => !i.paid).reduce((s, i) => s + i.total, 0);

  return (
    <div className="bg-background min-h-screen">
      <div className="section-padding pt-10 pb-24">
        <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-overline mb-1">Shop</p>
            <h1 className="heading-section">Invoices</h1>
          </div>
        </div>

        {/* Revenue cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-600" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Revenue</p>
            </div>
            <p className="text-2xl font-bold text-foreground">${totalRevenue.toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-amber-600" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Outstanding</p>
            </div>
            <p className="text-2xl font-bold text-foreground">${unpaidTotal.toFixed(2)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-4">
          {(["all", "paid", "unpaid"] as PaidFilter[]).map((f) => (
            <button key={f} onClick={() => setPaidFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${paidFilter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              {f}
            </button>
          ))}
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice number or customer..."
            className="w-full pl-9 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-body">No invoices found.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Invoice #</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Job</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((inv, i) => (
                  <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono font-bold text-foreground">{inv.invoice_number}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{(inv.customer as any)?.name ?? "—"}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground hidden md:table-cell">
                      {(inv.job as any)?.job_number ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground hidden sm:table-cell">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-foreground text-right">${inv.total.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${inv.paid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                        {inv.paid ? "Paid" : "Unpaid"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {!inv.paid && (
                          <button onClick={() => markPaid(inv.id)} className="text-xs font-medium text-green-600 hover:underline">
                            Mark Paid
                          </button>
                        )}
                        <a href={`/shop/invoices/${inv.id}/print`} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                          <Printer className="w-4 h-4" />
                        </a>
                      </div>
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

export default ShopInvoices;
