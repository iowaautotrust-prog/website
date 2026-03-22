import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import heroCar from "@/assets/hero-car.jpg";
import { supabase } from "@/lib/supabase";
import { useApp } from "@/contexts/AppContext";
import { DEMO_VEHICLES } from "@/lib/demoData";
import type { Vehicle } from "@/lib/types";

// ─── Floating Orbs ────────────────────────────────────────────────────────────
function FloatingOrbs() {
  return (
    <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none">
      <motion.div
        className="absolute w-[300px] md:w-[600px] h-[300px] md:h-[600px] rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)", top: "-10%", left: "-10%" }}
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[200px] md:w-[400px] h-[200px] md:h-[400px] rounded-full opacity-15"
        style={{ background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)", bottom: "10%", right: "-5%" }}
        animate={{ x: [0, -30, 0], y: [0, -40, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />
    </div>
  );
}

// ─── 3D Coverflow Carousel ────────────────────────────────────────────────────
function HeroCarousel({ vehicles }: { vehicles: Vehicle[] }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (vehicles.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % vehicles.length);
    }, 3000);
  }, [vehicles.length]);

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resetTimer]);

  const goTo = useCallback((i: number) => {
    setCurrent(i);
    resetTimer();
  }, [resetTimer]);

  const getOffset = (index: number) => {
    const total = vehicles.length;
    let off = ((index - current) % total + total) % total;
    if (off > total / 2) off -= total;
    return off;
  };

  const getStyle = (offset: number): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: "absolute",
      top: "50%",
      transition: "all 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    };
    if (offset === 0) return {
      ...base,
      left: "50%",
      width: "58%",
      transform: "translate(-50%, -50%) rotateY(0deg) scale(1)",
      opacity: 1,
      zIndex: 10,
    };
    if (offset === -1) return {
      ...base,
      left: "14%",
      width: "40%",
      transform: "translate(-50%, -50%) rotateY(22deg) scale(0.84)",
      opacity: 0.62,
      zIndex: 5,
      cursor: "pointer",
    };
    if (offset === 1) return {
      ...base,
      left: "86%",
      width: "40%",
      transform: "translate(-50%, -50%) rotateY(-22deg) scale(0.84)",
      opacity: 0.62,
      zIndex: 5,
      cursor: "pointer",
    };
    if (offset < -1) return {
      ...base,
      left: "-4%",
      width: "40%",
      transform: "translate(-50%, -50%) rotateY(22deg) scale(0.84)",
      opacity: 0,
      zIndex: 0,
    };
    return {
      ...base,
      left: "104%",
      width: "40%",
      transform: "translate(-50%, -50%) rotateY(-22deg) scale(0.84)",
      opacity: 0,
      zIndex: 0,
    };
  };

  if (vehicles.length === 0) return null;

  return (
    <div
      className="relative w-full overflow-hidden h-[220px] md:h-[340px] lg:h-[420px]"
      style={{ perspective: "1400px" }}
    >
      {vehicles.map((v, i) => {
        const offset = getOffset(i);
        const isCenter = offset === 0;
        const isSide = Math.abs(offset) === 1;

        return (
          <div key={v.id} style={getStyle(offset)}>
            <div
              className="w-full rounded-2xl overflow-hidden relative"
              style={{ aspectRatio: "16/9" }}
              onClick={() => isSide && goTo(i)}
            >
              {v.image_url ? (
                <img src={v.image_url} alt={v.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-secondary" />
              )}

              {/* Dark vignette on side cards */}
              {!isCenter && (
                <div className="absolute inset-0 bg-foreground/30" />
              )}

              {isCenter ? (
                <Link to={`/vehicle/${v.id}`} className="absolute inset-0 flex flex-col justify-end">
                  <div className="bg-black/85 backdrop-blur-sm px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-white/50 text-xs mb-0.5">{v.year} · {v.type}</p>
                      <p className="text-white font-bold text-sm md:text-lg leading-tight line-clamp-1">{v.name}</p>
                    </div>
                    <div className="shrink-0 bg-primary rounded-lg px-3 py-1.5 text-center">
                      <p className="text-primary-foreground font-bold text-base md:text-xl leading-tight">${v.price.toLocaleString()}</p>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm px-3 md:px-4 py-2.5 flex items-center justify-between gap-2">
                  <p className="text-white font-semibold text-xs line-clamp-1 min-w-0">{v.name}</p>
                  <p className="text-white font-bold text-xs md:text-sm shrink-0 bg-primary/90 px-2 py-0.5 rounded">${v.price.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {vehicles.length > 1 && (
        <>
          <button
            onClick={() => goTo((current - 1 + vehicles.length) % vehicles.length)}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-10 md:h-10 rounded-full bg-background/90 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-background transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => goTo((current + 1) % vehicles.length)}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-10 md:h-10 rounded-full bg-background/90 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-background transition-colors"
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {vehicles.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "bg-primary w-5" : "bg-border w-1.5"}`}
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
export function RecentlyViewedStrip() {
  const { recentViews, recentSearches, isDemoMode } = useApp();
  const navigate = useNavigate();

  const displayViews = isDemoMode && recentViews.length === 0
    ? DEMO_VEHICLES.slice(0, 4)
    : recentViews.slice(0, 4);

  const displaySearches = isDemoMode && recentSearches.length === 0
    ? ["BMW", "Tesla", "SUV under $50k"]
    : recentSearches.slice(0, 5);

  if (displayViews.length === 0 && displaySearches.length === 0) return null;

  return (
    <section className="section-padding py-8 border-b border-border bg-secondary/40">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground">Pick Up Where You Left Off</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-6">
        {displaySearches.length > 0 && (
          <div className="flex-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Recent Searches</p>
            <div className="flex flex-wrap gap-2">
              {displaySearches.map((q) => (
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
        {displayViews.length > 0 && (
          <div className="flex-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Recently Viewed</p>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {displayViews.map((v) => (
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

// ─── Main Hero Section ────────────────────────────────────────────────────────
const HeroSection = () => {
  const ref = useRef(null);
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.5], [0, -60]);

  const { isDemoMode, recentlyViewedInHero } = useApp();
  const [carouselVehicles, setCarouselVehicles] = useState<Vehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isDemoMode) {
      setCarouselVehicles(DEMO_VEHICLES.filter((v) => v.in_carousel).slice(0, 7));
      return;
    }
    supabase
      .from("vehicles")
      .select("id, name, price, year, type, image_url")
      .eq("in_carousel", true)
      .eq("status", "available")
      .limit(7)
      .then(({ data }) => {
        setCarouselVehicles(data && data.length > 0 ? (data as Vehicle[]) : []);
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
      <section ref={ref} className="relative h-screen w-full overflow-hidden">
        <motion.div className="absolute inset-0 z-0" style={{ y: imageY, scale: imageScale }}>
          <img src={heroCar} alt="Iowa Auto Trust" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-foreground/50" />
        </motion.div>

        <FloatingOrbs />

        <motion.div
          className="relative z-10 flex flex-col items-start justify-between h-full section-padding pt-20 md:pt-24 pb-16 md:pb-24"
          style={{ opacity: contentOpacity, y: contentY }}
        >
          {/* Top: Headline */}
          <div>
            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-overline text-primary-foreground/70 mb-5"
            >
              Iowa Auto Trust · Woodward, Iowa
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-bold tracking-tight leading-[0.9] text-primary-foreground max-w-5xl"
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
          </div>

          {/* Bottom: Search, CTAs, stats */}
          <div className="w-full">
            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mb-6 text-base md:text-lg text-primary-foreground/70 max-w-md"
            >
              Curated pre-owned vehicles in Woodward, Iowa. Every car inspected, priced right, and ready to drive.
            </motion.p>

            <motion.form
              onSubmit={handleSearch}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.85 }}
              className="flex gap-0 max-w-lg w-full"
            >
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text" value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search make, model, or year…"
                  className="w-full h-12 pl-11 pr-4 rounded-l-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <motion.button
                type="submit" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="h-12 px-6 bg-primary text-primary-foreground text-sm font-semibold rounded-r-lg hover:bg-primary/90 transition-colors"
              >
                Search
              </motion.button>
            </motion.form>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              className="mt-6 flex gap-4 flex-wrap"
            >
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link to="/inventory" className="btn-hero">Browse All Vehicles</Link>
              </motion.div>
              <motion.a
                href="tel:5156725406" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                animate={{ boxShadow: ["0 0 0px hsl(var(--primary)/0)", "0 0 16px hsl(var(--primary)/0.4)", "0 0 0px hsl(var(--primary)/0)"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="btn-hero-outline border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground hover:text-foreground"
              >
                Call Now
              </motion.a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1.3 }}
              className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1"
            >
              {stats.map((s, i) => (
                <motion.div key={s} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.3 + i * 0.12 }}>
                  <span className="text-primary-foreground/50 text-xs mr-1">·</span>
                  <span className="text-primary-foreground/60 text-xs tracking-wide">{s}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Recently Viewed strip — only if admin set it to show in hero */}
      {recentlyViewedInHero && <RecentlyViewedStrip />}

      {/* Featured Car Carousel */}
      {carouselVehicles.length > 0 && (
        <section className="section-padding py-16 bg-background">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
          >
            <p className="text-overline mb-3">Spotlight</p>
            <h2 className="heading-section mb-10">Featured Vehicles</h2>
          </motion.div>
          <div className="pb-8">
            <HeroCarousel vehicles={carouselVehicles} />
          </div>
          <div className="mt-8 flex justify-center">
            <Link to="/inventory" className="btn-hero-outline">View All Inventory</Link>
          </div>
        </section>
      )}
    </>
  );
};

export default HeroSection;
