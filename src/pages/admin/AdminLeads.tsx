import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { ArrowLeft } from "lucide-react";
import Footer from "@/components/Footer";

const AdminLeads = () => {
  const { user } = useAuth();
  const { leads } = useApp();

  if (!user?.isAdmin) return <Navigate to="/login" />;

  return (
    <div className="bg-background min-h-screen">
      <div className="section-padding pt-8 pb-4">
        <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
        <h1 className="heading-section mb-8">Leads & Inquiries</h1>
      </div>

      <div className="section-padding pb-24">
        {leads.length === 0 ? (
          <p className="text-body text-center py-20">No leads yet.</p>
        ) : (
          <div className="space-y-4">
            {[...leads].reverse().map((l) => (
              <motion.div
                key={l.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-xl border border-border"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{l.userName}</h3>
                    <p className="text-sm text-muted-foreground">{l.userEmail} · {l.userPhone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-primary">{l.vehicleName}</p>
                    <p className="text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <p className="text-sm text-foreground bg-secondary p-4 rounded-lg">{l.message}</p>
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
