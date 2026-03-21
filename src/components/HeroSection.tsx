import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import heroCar from "@/assets/hero-car.jpg";
import { supabase } from "@/lib/supabase";
import { useApp } from "@/contexts/AppContext";
import { DEMO_VEHICLES } from "@/lib/demoData";
import type { Vehicle } from "@/lib/types";

// ─── Floating Orbs (micro animation) ─────────────────────────────────────────
function FloatingOrbs() {
  return (
    <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none">
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)", top: "-10%", left: "-10%" }}
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full opacity-15"
        style={{ background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)", bottom: "10%", right: "-5%" }}
        animate={{ x: [0, -30, 0], y: [0, -40, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />
      <motion.div
        className="absolute w-[300px] h-[300px] rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #60a5fa 0%, transparent 70%)", top: "40%", left: "40%" }}
        animate={{ x: [0, 20, -20, 0], y: [0, -20, 20, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 7 }}
      />
    </div>
  );
}

// ─── Hero Carousel ────────────────────────────────────────────────────────────
function HeroCarousel({ vehicles }: { vehicles: Vehicle[] }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setDirection(1);
      setCurrent((c) => (c + 1) % vehicles.length);
    }, 3000);
  };

  useEffect(() => {
    if (vehicles.length <= 1) return;
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [vehicles.length]);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((c) => (c + 1) % vehicles.length);
    resetTimer();
  }, [vehicles.length]);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((c) => (c - 1 + vehicles.length) % vehicles.length);
    resetTimer();
  }, [vehicles.length]);

  if (vehicles.length === 0) return null;

  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 60 : -60, scale: 0.97 }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -60 : 60, scale: 0.97 }),
  };

  const car = vehicles[current];

  return (
    <div className="relative w-full">
      <AnimatePresence custom={direction} mode="wait">
        <motion.div
          key={car.id}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <Link to={`/vehicle/${car.id}`} className="block group">
            <div
              className="relative rounded-2xl overflow-hidden aspect-[16/9] cursor-pointer"
              style={{ transform: "perspective(1000px) rotateY(-2deg)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "perspective(1000px) rotateY(0deg) scale(1.01)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "perspective(1000px) rotateY(-2deg)"; }}
            >
              {car.image_url ? (
                <img
                  src={car.image_url}
                  alt={car.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="w-full h-full bg-foreground/20" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-primary-foreground/70 text-xs mb-1"
                >
                  {car.year} · {car.type}
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-primary-foreground font-bold text-xl leading-tight"
                >
                  {car.name}
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="text-primary text-2xl font-bold mt-1"
                >
                  ${car.price.toLocaleString()}
                </motion.p>
              </div>
            </div>
          </Link>
        </motion.div>
      </AnimatePresence>

      {vehicles.length > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); prev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors z-10 shadow-md"
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); next(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors z-10 shadow-md"
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Progress bar dots */}
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {vehicles.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); resetTimer(); }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === current ? "bg-primary w-5" : "bg-border w-1.5"
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Recently Viewed Strip ────────────────────────────────────────────────────
function RecentlyViewedStrip() {
  const { recentViews, recentSearches } = useApp();
  const navigate = useNavigate();

  if (recentViews.length === 0 && recentSearches.length === 0) return null;

  return (
    <section className="section-padding py-8 border-b border-border bg-secondary/40">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground">Pick Up Where You Left Off</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-6">
        {recentSearches.length > 0 && (
          <div className="flex-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Recent Searches</p>
            <div className="flex flex-wrap gap-2">
              {recentSearches.slice(0, 5).map((q) => (
                <button
                  key={q}
                  onClick={() => navigate(`/inventory?search=${encodeURIComponent(q)}`)}
                  className="px-3 py-1.5 rounded-full bg-background border border-border text-sm hover:border-primary hover:text-primary transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {recentViews.length > 0 && (
          <div className="flex-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Recently Viewed</p>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {recentViews.slice(0, 4).map((v) => (
                <Link
                  key={v.id}
                  to={`/vehicle/${v.id}`}
                  className="flex-none flex items-center gap-2.5 bg-background border border-border rounded-xl px-3 py-2 hover:border-primary transition-colors group"
                >
                  {v.image_url ? (
                    <img src={v.image_url} alt={v.name} className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-secondary" />
                  )}
                  <div>
                    <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">{v.name}</p>
                    <p className="text-xs text-muted-foreground">${v.price.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Animated Stat ─────────────────────────────────────────────────────────────
function StatItem({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2"
    >
      <span className="text-primary-foreground/50 text-xs">·</span>
      <span className="text-primary-foreground/60 text-xs tracking-wide">{label}</span>
    </motion.div>
  );
}

// ─── Main Hero Section ────────────────────────────────────────────────────────
const HeroSection = () => {
  const ref = useRef(null);
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.5], [0, -60]);

  const { isDemoMode } = useApp();
  const [carouselVehicles, setCarouselVehicles] = useState<Vehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isDemoMode) {
      setCarouselVehicles(DEMO_VEHICLES.filter((v) => v.in_carousel).slice(0, 8));
      return;
    }
    supabase
      .from("vehicles")
      .select("id, name, price, year, type, image_url")
      .eq("in_carousel", true)
      .eq("status", "available")
      .limit(8)
      .then(({ data }) => {
        if (data && data.length > 0) setCarouselVehicles(data as Vehicle[]);
        else setCarouselVehicles([]);
      });
  }, [isDemoMode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/inventory?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const stats = ["Woodward, Iowa", "Pre-Owned Specialists", "Same-Day Test Drives", "Trusted Since 2010"];

  return (
    <>
      {/* Hero */}
      <section ref={ref} className="relative h-screen w-full overflow-hidden">
        {/* Background image with parallax */}
        <motion.div className="absolute inset-0 z-0" style={{ y: imageY, scale: imageScale }}>
          <img src={heroCar} alt="Iowa Auto Trust" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-foreground/50" />
        </motion.div>

        {/* Floating micro-animation orbs */}
        <FloatingOrbs />

        {/* Content */}
        <motion.div
          className="relative z-10 flex flex-col items-start justify-end h-full section-padding pb-16 md:pb-24"
          style={{ opacity: contentOpacity, y: contentY }}
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-overline text-primary-foreground/70 mb-5"
          >
            Iowa Auto Trust · Woodward, Iowa
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-bold tracking-tight leading-[0.9] text-primary-foreground max-w-5xl"
          >
            Drive
            <br />
            <motion.span
              className="text-primary inline-block"
              animate={{ textShadow: ["0 0 30px hsl(var(--primary)/0)", "0 0 60px hsl(var(--primary)/0.6)", "0 0 30px hsl(var(--primary)/0)"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            >
              Beyond
            </motion.span>
            <br />
            Ordinary
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-6 text-base md:text-lg text-primary-foreground/70 max-w-md"
          >
            Curated pre-owned vehicles in Woodward, Iowa. Every car inspected, priced right, and ready to drive.
          </motion.p>

          {/* Search bar */}
          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.85 }}
            className="mt-8 flex gap-0 max-w-lg w-full"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search make, model, or year…"
                className="w-full h-12 pl-11 pr-4 rounded-l-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="h-12 px-6 bg-primary text-primary-foreground text-sm font-semibold rounded-r-lg hover:bg-primary/90 transition-colors"
            >
              Search
            </motion.button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="mt-6 flex gap-4 flex-wrap"
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link to="/inventory" className="btn-hero">Browse All Vehicles</Link>
            </motion.div>
            <motion.a
              href="tel:5156725406"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              animate={{ boxShadow: ["0 0 0px hsl(var(--primary)/0)", "0 0 16px hsl(var(--primary)/0.4)", "0 0 0px hsl(var(--primary)/0)"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="btn-hero-outline border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground hover:text-foreground"
            >
              Call Now
            </motion.a>
          </motion.div>

          {/* Micro stats strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.3 }}
            className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1"
          >
            {stats.map((s, i) => (
              <motion.div
                key={s}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.3 + i * 0.12 }}
              >
                <StatItem label={s} />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Recently Viewed / Last Searched strip */}
      <RecentlyViewedStrip />

      {/* Featured Car Carousel */}
      {carouselVehicles.length > 0 && (
        <section className="section-padding py-16 bg-background">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-overline mb-3">Spotlight</p>
            <h2 className="heading-section mb-10">Featured Vehicles</h2>
          </motion.div>
          <div className="pb-8">
            <HeroCarousel vehicles={carouselVehicles} />
          </div>
          <div className="mt-6 flex justify-center">
            <Link to="/inventory" className="btn-hero-outline">View All Inventory</Link>
          </div>
        </section>
      )}
    </>
  );
};

export default HeroSection;
