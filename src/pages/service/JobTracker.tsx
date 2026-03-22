import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import type { ServiceJob, ServiceItem, ShopInvoice } from "@/lib/shopTypes";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Loader2, Search, Car, Wrench, CheckCircle, XCircle, Clock, FileText } from "lucide-react";

const STATUS_STEPS = [
  { key: "pending", label: "Pending", icon: Clock, description: "Your vehicle is in the queue" },
  { key: "in_progress", label: "In Progress", icon: Wrench, description: "Our technician is working on it" },
  { key: "completed", label: "Completed", icon: CheckCircle, description: "Service is done" },
];

function getStepIndex(status: string): number {
  if (status === "cancelled") return -1;
  return STATUS_STEPS.findIndex((s) => s.key === status);
}

const JobTracker = () => {
  const { jobNumber } = useParams<{ jobNumber: string }>();
  const [query, setQuery] = useState(jobNumber ?? "");
  const [job, setJob] = useState<ServiceJob | null>(null);
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [invoice, setInvoice] = useState<ShopInvoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async (num?: string) => {
    const jn = (num ?? query).trim().toUpperCase();
    if (!jn) return;
    setLoading(true);
    setNotFound(false);
    setJob(null);
    setItems([]);
    setInvoice(null);
    setSearched(true);

    const { data } = await supabase
      .from("service_jobs" as any)
      .select("*, customer:shop_customers(*), vehicle:shop_vehicles(*)")
      .eq("job_number", jn)
      .single();

    if (!data) { setNotFound(true); setLoading(false); return; }
    const j = data as unknown as ServiceJob;
    setJob(j);

    const [{ data: itemsData }, { data: invData }] = await Promise.all([
      supabase.from("service_items" as any).select("*").eq("job_id", j.id),
      supabase.from("shop_invoices" as any).select("*").eq("job_id", j.id).maybeSingle(),
    ]);

    setItems((itemsData as unknown as ServiceItem[]) ?? []);
    setInvoice(invData as unknown as ShopInvoice | null);
    setLoading(false);
  };

  useEffect(() => {
    if (jobNumber) search(jobNumber);
  }, [jobNumber]);

  const stepIndex = job ? getStepIndex(job.status) : -1;

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <div className="section-padding pt-28 pb-24">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-overline mb-1">Iowa Auto Trust</p>
            <h1 className="heading-section">Track Your Job</h1>
            <p className="text-muted-foreground mt-2">Enter your job number to see the status</p>
          </div>

          <div className="flex gap-2 mb-8">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="e.g. JOB-001"
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={() => search()}
              disabled={loading}
              className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Track
            </button>
          </div>

          {loading && (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {searched && notFound && !loading && (
            <div className="text-center py-16">
              <XCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-base font-semibold text-foreground">Job not found</p>
              <p className="text-sm text-muted-foreground mt-1">Double-check your job number and try again.</p>
            </div>
          )}

          {job && !loading && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Header card */}
              <div className="rounded-xl border border-border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-0.5">Job Number</p>
                    <p className="text-2xl font-mono font-bold text-primary">{job.job_number}</p>
                  </div>
                  {job.status === "cancelled" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                      Cancelled
                    </span>
                  ) : (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      job.status === "completed" ? "bg-green-100 text-green-700" :
                      job.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {job.status.replace("_", " ")}
                    </span>
                  )}
                </div>

                {job.vehicle && (
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Car className="w-4 h-4 text-muted-foreground" />
                    <span>{job.vehicle.year} {job.vehicle.make} {job.vehicle.model}</span>
                    {job.vehicle.plate && <span className="text-muted-foreground">· {job.vehicle.plate}</span>}
                  </div>
                )}

                {job.mileage_in && (
                  <p className="text-sm text-muted-foreground mt-2">Mileage in: {job.mileage_in.toLocaleString()}</p>
                )}
              </div>

              {/* Status stepper */}
              {job.status !== "cancelled" && (
                <div className="rounded-xl border border-border p-6">
                  <h3 className="text-sm font-semibold text-foreground mb-6">Service Progress</h3>
                  <div className="space-y-0">
                    {STATUS_STEPS.map((step, i) => {
                      const Icon = step.icon;
                      const done = i <= stepIndex;
                      const active = i === stepIndex;
                      return (
                        <div key={step.key} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                              done ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                            } ${active ? "ring-4 ring-primary/20" : ""}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            {i < STATUS_STEPS.length - 1 && (
                              <div className={`w-0.5 h-10 transition-all ${done ? "bg-primary" : "bg-border"}`} />
                            )}
                          </div>
                          <div className="pb-8">
                            <p className={`text-sm font-semibold ${done ? "text-foreground" : "text-muted-foreground"}`}>
                              {step.label}
                            </p>
                            <p className="text-xs text-muted-foreground">{step.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Service items */}
              {items.length > 0 && (
                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="px-6 py-4 bg-secondary">
                    <h3 className="text-sm font-semibold text-foreground">Services Performed</h3>
                  </div>
                  <div className="divide-y divide-border">
                    {items.map((item) => (
                      <div key={item.id} className="px-6 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.service_type}</p>
                          {item.oil_type && <p className="text-xs text-muted-foreground">{item.oil_type}</p>}
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          ${((item.quantity ?? 1) * item.unit_price).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next service */}
              {job.status === "completed" && job.next_service_date && (
                <div className="rounded-xl border border-border p-6 bg-green-50/50">
                  <h3 className="text-sm font-semibold text-foreground mb-1">Next Service Recommendation</h3>
                  <p className="text-sm text-muted-foreground">
                    Suggested date: <span className="font-medium text-foreground">{new Date(job.next_service_date).toLocaleDateString()}</span>
                    {job.next_service_mileage && (
                      <> or at <span className="font-medium text-foreground">{job.next_service_mileage.toLocaleString()} miles</span></>
                    )}
                  </p>
                  <Link
                    to="/service"
                    className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-primary hover:underline"
                  >
                    Book your next appointment →
                  </Link>
                </div>
              )}

              {/* Invoice */}
              {invoice && job.status === "completed" && (
                <a
                  href={`/shop/invoices/${invoice.id}/print`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 w-full bg-primary text-primary-foreground rounded-lg px-4 py-3 text-sm font-medium hover:bg-primary/90 transition-colors justify-center"
                >
                  <FileText className="w-4 h-4" />
                  View Invoice #{invoice.invoice_number}
                </a>
              )}
            </motion.div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default JobTracker;
