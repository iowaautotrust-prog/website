import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/lib/supabase";
import { query } from "@/lib/query";
import type { Lead } from "@/lib/types";
import { ArrowLeft, Loader2, MessageSquare } from "lucide-react";
import Footer from "@/components/Footer";

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-amber-100 text-amber-700",
  closed: "bg-green-100 text-green-700",
};

const AdminLeads = () => {
  const { user } = useAuth();
  const { isDemoModeReady } = useApp();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  if (!user?.isAdmin && !user?.isManager) return <Navigate to="/login" />;

  useEffect(() => {
    if (!isDemoModeReady) return;
    query(() =>
      supabase.from("leads").select("*").order("created_at", { ascending: false })
    )
      .then(({ data }) => setLeads((data as Lead[]) ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isDemoModeReady]);

  const updateStatus = async (id: string, status: Lead["status"]) => {
    await supabase.from("leads").update({ status }).eq("id", id);
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)));
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="section-padding pt-10 pb-4">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
        <div className="mb-8">
          <p className="text-overline mb-1">Admin</p>
          <h1 className="heading-section">Leads & Inquiries</h1>
        </div>
      </div>

      <div className="section-padding pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-body">No leads yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {leads.map((l, i) => (
              <motion.div
                key={l.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 * Math.min(i, 15) }}
                className="p-6 rounded-xl border border-border hover:shadow-sm transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="text-base font-bold text-foreground">{l.name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {l.email}
                      {l.phone && ` · ${l.phone}`}
                    </p>
                  </div>
                  <div className="flex items-start gap-3 shrink-0">
                    <div className="text-right">
                      {l.vehicle_name && (
                        <p className="text-sm font-medium text-primary">{l.vehicle_name}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(l.created_at).toLocaleString()}
                      </p>
                      <span
                        className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[l.status] ?? ""}`}
                      >
                        {l.lead_type} · {l.status}
                      </span>
                    </div>
                    <select
                      value={l.status}
                      onChange={(e) =>
                        updateStatus(l.id, e.target.value as Lead["status"])
                      }
                      className="flex h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
                {l.message && (
                  <p className="text-sm text-foreground bg-secondary p-4 rounded-lg">
                    {l.message}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AdminLeads;
