import { useParams, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/lib/supabase";
import { DEMO_VEHICLES } from "@/lib/demoData";
import type { Vehicle } from "@/lib/types";
import {
  ArrowLeft, Fuel, Users, Calendar, Gauge, Check, Heart, GitCompare,
  Cog, Phone, Mail, Loader2, Share2, Copy, ChevronLeft, ChevronRight,
  X, Tag, Fingerprint, ZoomIn,
} from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import CompareTray from "@/components/CompareTray";
import { useState, useEffect, useCallback } from "react";
import type { Lead } from "@/lib/types";

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ images, index, onClose }: { images: string[]; index: number; onClose: () => void }) {
  const [current, setCurrent] = useState(index);

  const prev = useCallback(() => setCurrent((c) => (c - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setCurrent((c) => (c + 1) % images.length), [images.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, prev, next]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
        onClick={onClose}
      >
        <X className="w-5 h-5" />
      </button>

      {images.length > 1 && (
        <>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            onClick={(e) => { e.stopPropagation(); prev(); }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            onClick={(e) => { e.stopPropagation(); next(); }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      <motion.img
        key={current}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        src={images[current]}
        alt=""
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
        {current + 1} / {images.length}
      </div>
    </motion.div>
  );
}

const VehicleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [car, setCar] = useState<Vehicle | null>(null);
  const [similarCars, setSimilarCars] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({ name: "", email: "", phone: "", message: "", coupon: "" });
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquiryDone, setInquiryDone] = useState(false);

  const [showTestDrive, setShowTestDrive] = useState(false);
  const [tdForm, setTdForm] = useState({ name: "", email: "", phone: "", preferred_date: "" });
  const [tdSubmitting, setTdSubmitting] = useState(false);
  const [tdDone, setTdDone] = useState(false);
  const [couponStatus, setCouponStatus] = useState<{ valid: boolean; label: string } | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const { user } = useAuth();
  const { toggleFavorite, isFavorite, toggleCompare, isInCompare, addRecentView } = useApp();

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    // Demo vehicle — resolve immediately from local data
    if (id.startsWith("demo-")) {
      const vehicle = DEMO_VEHICLES.find((v) => v.id === id) ?? null;
      setCar(vehicle);
      setLoading(false);
      if (vehicle) {
        addRecentView(vehicle);
        setSimilarCars(
          DEMO_VEHICLES.filter((v) => v.id !== id && v.type === vehicle.type).slice(0, 4)
        );
      }
      return;
    }

    supabase
      .from("vehicles")
      .select("*, category:categories(id,name)")
      .eq("id", id)
      .eq("status", "available")
      .single()
      .then(async ({ data }) => {
        if (!data) { setLoading(false); return; }
        const vehicle = data as Vehicle;
        setCar(vehicle);
        setLoading(false);
        addRecentView(vehicle);
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

  const handleShare = async () => {
    const url = `${window.location.origin}/vehicle/${id}`;
    if (navigator.share) {
      await navigator.share({ title: car?.name, text: `Check out this ${car?.name} at Iowa Auto Trust`, url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const checkCoupon = async () => {
    if (!inquiryForm.coupon.trim() || !car) return;
    setCheckingCoupon(true);
    const { data } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", inquiryForm.coupon.trim().toUpperCase())
      .eq("active", true)
      .single();
    if (!data) {
      setCouponStatus({ valid: false, label: "Invalid or expired coupon code." });
    } else {
      const expired = data.expires_at && new Date(data.expires_at) < new Date();
      const maxed = data.max_uses !== null && data.used_count >= data.max_uses;
      const belowMin = data.min_price !== null && car.price < data.min_price;
      if (expired || maxed || belowMin) {
        setCouponStatus({ valid: false, label: "Coupon not applicable for this vehicle." });
      } else {
        const saving = data.discount_type === "percent"
          ? `${data.discount_value}% off`
          : `$${data.discount_value.toLocaleString()} off`;
        setCouponStatus({ valid: true, label: `✓ Valid! ${saving} applied to your inquiry.` });
      }
    }
    setCheckingCoupon(false);
  };

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
      message: inquiryForm.coupon
        ? `${inquiryForm.message}\n\nCoupon applied: ${inquiryForm.coupon}`
        : inquiryForm.message,
      lead_type: "inquiry",
      status: "new",
    };
    await supabase.from("leads").insert({ ...lead, created_at: new Date().toISOString() });
    // Increment coupon used_count
    if (inquiryForm.coupon && couponStatus?.valid) {
      await supabase.rpc("increment_coupon_uses" as never, { coupon_code: inquiryForm.coupon.trim().toUpperCase() }).catch(() => null);
    }
    setInquirySubmitting(false);
    setInquiryDone(true);
  };

  const handleTestDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tdSubmitting) return;
    setTdSubmitting(true);
    await supabase.from("leads").insert({
      user_id: user?.id ?? null,
      name: tdForm.name,
      email: tdForm.email,
      phone: tdForm.phone || null,
      vehicle_id: car?.id ?? null,
      vehicle_name: car?.name ?? null,
      message: tdForm.preferred_date ? `Preferred date: ${tdForm.preferred_date}` : "Test drive requested.",
      lead_type: "test_drive",
      status: "new",
      created_at: new Date().toISOString(),
    });
    setTdSubmitting(false);
    setTdDone(true);
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

  // Compute discounted price
  const activeDiscount = car.discount_amount && car.discount_amount > 0 &&
    (!car.discount_expires || new Date(car.discount_expires) > new Date());
  const displayPrice = activeDiscount
    ? car.price - car.discount_amount!
    : car.price;

  return (
    <div className="bg-background min-h-screen">
      <Navbar />

      <AnimatePresence>
        {lightboxOpen && allImages.length > 0 && (
          <Lightbox images={allImages} index={selectedImage} onClose={() => setLightboxOpen(false)} />
        )}
      </AnimatePresence>

      <div className="section-padding pt-28">
        <Link to="/inventory" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Inventory
        </Link>
      </div>

      <div className="section-padding pb-8">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 lg:gap-16">
          {/* Gallery */}
          <motion.div className="lg:w-3/5" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <div
              className="rounded-2xl overflow-hidden aspect-[16/10] mb-4 cursor-zoom-in group relative"
              onClick={() => allImages.length > 0 && setLightboxOpen(true)}
            >
              {allImages[selectedImage] ? (
                <>
                  <img src={allImages[selectedImage]} alt={car.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="w-4 h-4 text-foreground" />
                  </div>
                  {allImages.length > 1 && (
                    <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-sm text-xs font-medium">
                      {selectedImage + 1} / {allImages.length}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-secondary flex items-center justify-center">
                  <span className="text-muted-foreground">No Image Available</span>
                </div>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`rounded-lg overflow-hidden shrink-0 w-20 h-14 border-2 transition-all duration-200 ${
                      selectedImage === i ? "border-primary scale-105" : "border-transparent opacity-50 hover:opacity-80"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Details */}
          <motion.div className="lg:w-2/5" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <div className="lg:sticky lg:top-24">
              <p className="text-overline mb-2">
                {car.year} · {car.type}
                {car.category && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                    {(car.category as { name: string }).name}
                  </span>
                )}
              </p>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">{car.name}</h1>

              {/* Price with discount */}
              <div className="mb-2">
                {activeDiscount ? (
                  <div className="flex items-baseline gap-3">
                    <p className="text-4xl font-bold text-primary">${displayPrice.toLocaleString()}</p>
                    <p className="text-xl font-medium text-muted-foreground line-through">${car.price.toLocaleString()}</p>
                    <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {car.discount_label ?? `Save $${car.discount_amount!.toLocaleString()}`}
                    </span>
                  </div>
                ) : (
                  <p className="text-4xl font-bold text-primary">${car.price.toLocaleString()}</p>
                )}
              </div>

              {car.status === "pending" && (
                <span className="inline-block mb-3 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">Sale Pending</span>
              )}

              {/* VIN */}
              {car.vin && (
                <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-secondary/60 border border-border">
                  <Fingerprint className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">VIN</p>
                    <p className="text-sm font-mono font-semibold text-foreground">{car.vin}</p>
                  </div>
                  <a
                    href={`https://www.carfax.com/VehicleHistory/ar20/p=N6LSE0BR|${car.vin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-primary hover:underline shrink-0"
                  >
                    Carfax →
                  </a>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex gap-2 mb-8 flex-wrap">
                <button
                  onClick={() => toggleFavorite(car.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    isFavorite(car.id) ? "border-destructive/30 text-destructive bg-destructive/5" : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite(car.id) ? "fill-destructive" : ""}`} />
                  {isFavorite(car.id) ? "Saved" : "Save"}
                </button>
                <button
                  onClick={() => toggleCompare(car.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    isInCompare(car.id) ? "border-primary text-primary bg-primary/5" : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  <GitCompare className="w-4 h-4" />
                  {isInCompare(car.id) ? "Comparing" : "Compare"}
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}
                  {copied ? "Copied!" : "Share"}
                </button>
              </div>

              {/* Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
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

              {car.description && <p className="text-body mb-6">{car.description}</p>}

              {car.features && car.features.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold uppercase tracking-wider mb-3">Features</h3>
                  <div className="grid grid-cols-2 gap-y-2">
                    {car.features.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="w-3.5 h-3.5 text-primary shrink-0" /> {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="space-y-3">
                <button onClick={() => setShowInquiry(true)} className="btn-hero w-full justify-center">
                  Request Information
                </button>
                <button onClick={() => setShowTestDrive(true)} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-primary text-primary font-medium hover:bg-primary hover:text-primary-foreground transition-colors">
                  Schedule Test Drive
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <a href="tel:5156725406" className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-border text-sm font-medium hover:border-primary hover:text-primary transition-colors">
                    <Phone className="w-4 h-4" /> Call Now
                  </a>
                  <a href="mailto:iowaautotrust@gmail.com" className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-border text-sm font-medium hover:border-primary hover:text-primary transition-colors">
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
        <div className="fixed inset-0 bg-foreground/60 z-50 flex items-center justify-center p-4" onClick={() => setShowInquiry(false)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-background rounded-2xl p-6 sm:p-8 w-full max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {inquiryDone ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <Check className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold">Message Sent!</h3>
                <p className="text-muted-foreground text-sm">We'll be in touch shortly about the {car.name}.</p>
                <button onClick={() => setShowInquiry(false)} className="btn-hero mt-2">Close</button>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold mb-1">Request Information</h3>
                <p className="text-sm text-muted-foreground mb-5">About: <span className="font-medium text-foreground">{car.name}</span></p>
                <form onSubmit={handleInquiry} className="space-y-3">
                  <input placeholder="Your Name *" value={inquiryForm.name} onChange={(e) => setInquiryForm((f) => ({ ...f, name: e.target.value }))} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                  <input type="email" placeholder="Email Address *" value={inquiryForm.email} onChange={(e) => setInquiryForm((f) => ({ ...f, email: e.target.value }))} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                  <input type="tel" placeholder="Phone Number" value={inquiryForm.phone} onChange={(e) => setInquiryForm((f) => ({ ...f, phone: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                  <textarea placeholder="Message (optional)" value={inquiryForm.message} onChange={(e) => setInquiryForm((f) => ({ ...f, message: e.target.value }))} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[70px] resize-none" />
                  {/* Coupon code */}
                  <div>
                    <div className="flex gap-2">
                      <input
                        placeholder="Coupon code (optional)"
                        value={inquiryForm.coupon}
                        onChange={(e) => { setInquiryForm((f) => ({ ...f, coupon: e.target.value })); setCouponStatus(null); }}
                        className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm uppercase"
                      />
                      <button type="button" onClick={checkCoupon} disabled={checkingCoupon || !inquiryForm.coupon.trim()} className="px-3 py-2 rounded-md border border-border text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-40">
                        {checkingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply"}
                      </button>
                    </div>
                    {couponStatus && (
                      <p className={`text-xs mt-1.5 ${couponStatus.valid ? "text-green-600" : "text-destructive"}`}>
                        {couponStatus.label}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setShowInquiry(false)} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm">Cancel</button>
                    <button type="submit" disabled={inquirySubmitting} className="btn-hero flex-1 flex items-center justify-center gap-2">
                      {inquirySubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Send
                    </button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}

      {/* Test Drive Modal */}
      {showTestDrive && (
        <div className="fixed inset-0 bg-foreground/60 z-50 flex items-center justify-center p-4" onClick={() => setShowTestDrive(false)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-background rounded-2xl p-6 sm:p-8 w-full max-w-[95vw] sm:max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {tdDone ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <Check className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold">Test Drive Requested!</h3>
                <p className="text-muted-foreground text-sm">We'll call you to confirm your appointment for the {car?.name}.</p>
                <button onClick={() => { setShowTestDrive(false); setTdDone(false); setTdForm({ name: "", email: "", phone: "", preferred_date: "" }); }} className="btn-hero mt-2">Close</button>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold mb-1">Schedule a Test Drive</h3>
                <p className="text-sm text-muted-foreground mb-5">For: <span className="font-medium text-foreground">{car?.name}</span></p>
                <form onSubmit={handleTestDrive} className="space-y-3">
                  <input placeholder="Your Name *" value={tdForm.name} onChange={(e) => setTdForm((f) => ({ ...f, name: e.target.value }))} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                  <input type="email" placeholder="Email Address *" value={tdForm.email} onChange={(e) => setTdForm((f) => ({ ...f, email: e.target.value }))} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                  <input type="tel" placeholder="Phone Number *" value={tdForm.phone} onChange={(e) => setTdForm((f) => ({ ...f, phone: e.target.value }))} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Preferred Date</label>
                    <input type="date" value={tdForm.preferred_date} onChange={(e) => setTdForm((f) => ({ ...f, preferred_date: e.target.value }))} min={new Date().toISOString().split("T")[0]} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setShowTestDrive(false)} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm">Cancel</button>
                    <button type="submit" disabled={tdSubmitting} className="btn-hero flex-1 flex items-center justify-center gap-2">
                      {tdSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Request
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
              <Link key={v.id} to={`/vehicle/${v.id}`} className="card-cinematic group block">
                <div className="aspect-[4/3] overflow-hidden rounded-t-xl">
                  {v.image_url ? (
                    <img src={v.image_url} alt={v.name} className="card-image w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-secondary" />
                  )}
                </div>
                <div className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">{v.year} · {v.type}</p>
                  <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">{v.name}</p>
                  <p className="text-primary font-bold mt-1">${v.price.toLocaleString()}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background border-t border-border px-4 py-3 flex gap-3">
        <a href="tel:5156725406" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
          <Phone className="w-4 h-4" /> Call
        </a>
        <button onClick={() => setShowInquiry(true)} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-primary text-primary text-sm font-semibold">
          <Mail className="w-4 h-4" /> Inquire
        </button>
      </div>

      <CompareTray />
      <Footer />
    </div>
  );
};

export default VehicleDetail;
