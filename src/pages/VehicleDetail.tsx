import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/lib/supabase";
import type { Vehicle } from "@/lib/types";
import {
  ArrowLeft,
  Fuel,
  Users,
  Calendar,
  Gauge,
  Check,
  Heart,
  GitCompare,
  Cog,
  Phone,
  Mail,
  Loader2,
} from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import CompareTray from "@/components/CompareTray";
import { useState, useEffect } from "react";
import type { Lead } from "@/lib/types";

const VehicleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [car, setCar] = useState<Vehicle | null>(null);
  const [similarCars, setSimilarCars] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  // Inquiry form state
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquiryDone, setInquiryDone] = useState(false);

  const { user } = useAuth();
  const { toggleFavorite, isFavorite, toggleCompare, isInCompare, addRecentView } = useApp();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    supabase
      .from("vehicles")
      .select("*, category:categories(id,name)")
      .eq("id", id)
      .single()
      .then(async ({ data }) => {
        if (!data) { setLoading(false); return; }
        const vehicle = data as Vehicle;
        setCar(vehicle);
        setLoading(false);

        // Track view
        addRecentView(vehicle);

        // Fetch similar cars (same type, exclude this vehicle, available only)
        const { data: similar } = await supabase
          .from("vehicles")
          .select("id, name, price, mileage, year, type, image_url")
          .eq("type", vehicle.type)
          .eq("status", "available")
          .neq("id", id)
          .gte("price", Math.max(0, vehicle.price - 15000))
          .lte("price", vehicle.price + 15000)
          .limit(4);
        setSimilarCars((similar as Vehicle[]) ?? []);
      });
  }, [id]);

  const handleInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inquirySubmitting) return;
    setInquirySubmitting(true);
    const lead: Omit<Lead, "id" | "created_at"> = {
      user_id: user?.id ?? null,
      name: inquiryForm.name,
      email: inquiryForm.email,
      phone: inquiryForm.phone || null,
      vehicle_id: car?.id ?? null,
      vehicle_name: car?.name ?? null,
      message: inquiryForm.message,
      lead_type: "inquiry",
      status: "new",
    };
    await supabase.from("leads").insert({ ...lead, created_at: new Date().toISOString() });
    setInquirySubmitting(false);
    setInquiryDone(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="heading-section mb-4">Vehicle Not Found</h1>
          <Link to="/inventory" className="btn-hero">Back to Inventory</Link>
        </div>
      </div>
    );
  }

  const allImages = car.image_urls && car.image_urls.length > 0
    ? car.image_urls
    : car.image_url ? [car.image_url] : [];

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <div className="section-padding pt-28">
        <Link
          to="/inventory"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Inventory
        </Link>
      </div>

      <div className="section-padding pb-8">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          {/* Gallery */}
          <motion.div
            className="lg:w-3/5"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="rounded-2xl overflow-hidden aspect-[16/10] mb-4 cursor-zoom-in group">
              {allImages[selectedImage] ? (
                <img
                  src={allImages[selectedImage]}
                  alt={car.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full bg-secondary flex items-center justify-center">
                  <span className="text-muted-foreground">No Image Available</span>
                </div>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`rounded-lg overflow-hidden shrink-0 w-24 h-16 border-2 transition-all duration-300 ${
                      selectedImage === i
                        ? "border-primary"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Details */}
          <motion.div
            className="lg:w-2/5"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="lg:sticky lg:top-24">
              <p className="text-overline mb-2">
                {car.year} · {car.type}
                {car.category && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                    {(car.category as { name: string }).name}
                  </span>
                )}
              </p>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">
                {car.name}
              </h1>
              <p className="text-4xl font-bold text-primary mb-2">
                ${car.price.toLocaleString()}
              </p>
              {car.status === "pending" && (
                <span className="inline-block mb-4 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                  Sale Pending
                </span>
              )}

              {/* Quick Actions */}
              <div className="flex gap-3 mb-8">
                <button
                  onClick={() => toggleFavorite(car.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    isFavorite(car.id)
                      ? "border-destructive/30 text-destructive bg-destructive/5"
                      : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite(car.id) ? "fill-destructive" : ""}`} />
                  {isFavorite(car.id) ? "Saved" : "Save"}
                </button>
                <button
                  onClick={() => toggleCompare(car.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    isInCompare(car.id)
                      ? "border-primary text-primary bg-primary/5"
                      : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  <GitCompare className="w-4 h-4" />
                  {isInCompare(car.id) ? "Comparing" : "Compare"}
                </button>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                {[
                  { icon: Gauge, label: "Mileage", value: `${car.mileage.toLocaleString()} mi` },
                  { icon: Fuel, label: "Fuel", value: car.fuel },
                  { icon: Calendar, label: "Year", value: String(car.year) },
                  { icon: Users, label: "Seats", value: String(car.seats ?? "—") },
                  { icon: Cog, label: "Engine", value: car.engine ?? "—" },
                  { icon: Cog, label: "Transmission", value: car.transmission ?? "—" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 p-4 rounded-xl bg-secondary">
                    <Icon className="w-5 h-5 text-primary shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-sm font-semibold text-foreground">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {car.description && (
                <p className="text-body mb-6">{car.description}</p>
              )}

              {car.features && car.features.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold uppercase tracking-wider mb-3">Features</h3>
                  <div className="grid grid-cols-2 gap-y-2">
                    {car.features.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => setShowInquiry(true)}
                  className="btn-hero w-full justify-center"
                >
                  Request Information
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href="tel:5156725406"
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-border text-sm font-medium hover:border-primary hover:text-primary transition-colors"
                  >
                    <Phone className="w-4 h-4" /> Call Now
                  </a>
                  <a
                    href="mailto:info@iowaautotrust.com"
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-border text-sm font-medium hover:border-primary hover:text-primary transition-colors"
                  >
                    <Mail className="w-4 h-4" /> Email Us
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Inquiry Modal */}
      {showInquiry && (
        <div
          className="fixed inset-0 bg-foreground/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowInquiry(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-background rounded-2xl p-8 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {inquiryDone ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <Check className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold">Message Sent!</h3>
                <p className="text-muted-foreground text-sm">
                  We'll be in touch shortly about the {car.name}.
                </p>
                <button onClick={() => setShowInquiry(false)} className="btn-hero mt-2">
                  Close
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold mb-1">Request Information</h3>
                <p className="text-sm text-muted-foreground mb-5">
                  About: <span className="font-medium text-foreground">{car.name}</span>
                </p>
                <form onSubmit={handleInquiry} className="space-y-4">
                  <input
                    placeholder="Your Name *"
                    value={inquiryForm.name}
                    onChange={(e) => setInquiryForm((f) => ({ ...f, name: e.target.value }))}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  <input
                    type="email"
                    placeholder="Email Address *"
                    value={inquiryForm.email}
                    onChange={(e) => setInquiryForm((f) => ({ ...f, email: e.target.value }))}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={inquiryForm.phone}
                    onChange={(e) => setInquiryForm((f) => ({ ...f, phone: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  <textarea
                    placeholder="Message (optional)"
                    value={inquiryForm.message}
                    onChange={(e) => setInquiryForm((f) => ({ ...f, message: e.target.value }))}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-none"
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowInquiry(false)}
                      className="flex-1 px-4 py-2 border border-border rounded-lg text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={inquirySubmitting}
                      className="btn-hero flex-1 flex items-center justify-center gap-2"
                    >
                      {inquirySubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Send
                    </button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}

      {/* Similar Cars */}
      {similarCars.length > 0 && (
        <section className="section-padding py-16 border-t border-border">
          <h2 className="text-2xl font-bold mb-8">Similar Vehicles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {similarCars.map((v) => (
              <Link
                key={v.id}
                to={`/vehicle/${v.id}`}
                className="card-cinematic group block"
              >
                <div className="aspect-[4/3] overflow-hidden rounded-t-xl">
                  {v.image_url ? (
                    <img
                      src={v.image_url}
                      alt={v.name}
                      className="card-image w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-secondary" />
                  )}
                </div>
                <div className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    {v.year} · {v.type}
                  </p>
                  <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {v.name}
                  </p>
                  <p className="text-primary font-bold mt-1">
                    ${v.price.toLocaleString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background border-t border-border px-4 py-3 flex gap-3">
        <a
          href="tel:5156725406"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
        >
          <Phone className="w-4 h-4" /> Call
        </a>
        <button
          onClick={() => setShowInquiry(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-primary text-primary text-sm font-semibold"
        >
          <Mail className="w-4 h-4" /> Inquire
        </button>
      </div>

      <CompareTray />
      <Footer />
    </div>
  );
};

export default VehicleDetail;
