import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { User, LayoutDashboard, GitCompare, Phone, Menu, X, Wrench, BadgeDollarSign, MessageSquare, ChevronDown } from "lucide-react";
import { SITE } from "@/lib/siteConfig";
import { ABOUT_LINKS } from "@/lib/pageContent";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import FinancingLink from "@/components/FinancingLink";

const Navbar = () => {
  const { user } = useAuth();
  const { compareList } = useApp();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [newLeads, setNewLeads] = useState(0);
  const [aboutOpen, setAboutOpen] = useState(false);
  const aboutRef = useRef<HTMLDivElement>(null);
  const aboutInput = useRef("");

  useEffect(() => setAboutOpen(false), [location.pathname]);

  // A tap outside the About menu closes it (touch screens have no mouse-leave).
  useEffect(() => {
    if (!aboutOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!aboutRef.current?.contains(e.target as Node)) setAboutOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [aboutOpen]);

  // Fetch new leads count for admin badge
  useEffect(() => {
    if (!user?.isAdmin) return;

    const fetchCount = () => {
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("status", "new")
        .then(({ count }) => setNewLeads(count ?? 0));
    };

    fetchCount();

    const channel = supabase
      .channel("navbar-leads-badge")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, fetchCount)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.isAdmin]);

  // Only show transparent navbar on the homepage hero
  const isHome = location.pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Transparent over hero only on homepage before scroll
  const transparent = isHome && !scrolled;

  const linkClass = `text-sm font-medium tracking-wide transition-colors duration-200 ${
    transparent
      ? "text-white/90 hover:text-white"
      : "text-foreground/80 hover:text-foreground"
  }`;

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          transparent
            ? "bg-transparent border-b border-white/10"
            : "bg-background/95 backdrop-blur-md border-b border-border shadow-sm"
        }`}
      >
        <div className="max-w-screen-2xl mx-auto px-6 md:px-12 flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 leading-none shrink-0">
            <img
              src="/iowa_logo_128.jpg"
              alt="Iowa Trust Motors logo"
              width={40}
              height={40}
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover"
            />
            <span className="flex flex-col leading-none">
              <span className={`text-sm sm:text-base font-bold tracking-tight transition-colors duration-200 ${transparent ? "text-white" : "text-foreground"}`}>
                IOWA TRUST MOTORS
              </span>
              <span className={`text-[9px] font-medium tracking-[0.2em] uppercase transition-colors duration-200 ${transparent ? "text-white/60" : "text-muted-foreground"}`}>
                Johnston, Iowa
              </span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-5 xl:gap-7">
            <Link to="/" className={linkClass}>Home</Link>
            <Link to="/inventory" className={linkClass}>Inventory</Link>
            <div
              ref={aboutRef}
              className="relative"
              onPointerEnter={(e) => e.pointerType === "mouse" && setAboutOpen(true)}
              onPointerLeave={(e) => e.pointerType === "mouse" && setAboutOpen(false)}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setAboutOpen(false);
              }}
              onKeyDown={(e) => e.key === "Escape" && setAboutOpen(false)}
            >
              <button
                type="button"
                aria-expanded={aboutOpen}
                aria-haspopup="true"
                onPointerDown={(e) => { aboutInput.current = e.pointerType; }}
                onKeyDown={() => { aboutInput.current = "key"; }}
                // With a mouse, hovering already opened the menu, so a click must not toggle it shut again.
                onClick={() => setAboutOpen((o) => (aboutInput.current === "mouse" ? true : !o))}
                className={`${linkClass} flex items-center gap-1`}
              >
                About
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${aboutOpen ? "rotate-180" : ""}`} />
              </button>
              {/* Always in the page so the links are there for crawlers; only hidden visually while closed. */}
              <div
                className={`absolute left-1/2 -translate-x-1/2 top-full pt-3 transition-opacity duration-150 ${
                  aboutOpen ? "opacity-100 visible" : "opacity-0 invisible"
                }`}
              >
                <div className="w-56 rounded-lg border border-border bg-background shadow-lg py-2">
                  {ABOUT_LINKS.map(({ to, label }) => (
                    <Link
                      key={to}
                      to={to}
                      className="block px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary hover:text-primary transition-colors"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            {/* Service link — hidden until shop goes live
            <Link to="/service" className={`${linkClass} flex items-center gap-1`}>
              <Wrench className="w-3.5 h-3.5" />
              Service
            </Link>
            */}
            <Link to="/contact" className={linkClass}>Contact</Link>
            <Link to="/compare" className={`${linkClass} flex items-center gap-1`}>
              <GitCompare className="w-3.5 h-3.5" />
              Compare{compareList.length > 0 && ` (${compareList.length})`}
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <a
              href="tel:5158098051"
              className={`hidden lg:inline-flex items-center gap-1.5 text-sm font-medium transition-colors duration-200 ${
                transparent ? "text-white/90 hover:text-white" : "text-foreground/80 hover:text-foreground"
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              (515) 809-8051
            </a>

            <FinancingLink
              className={`hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-colors duration-200 ${
                transparent
                  ? "bg-white text-foreground hover:bg-white/90"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              <BadgeDollarSign className="w-3.5 h-3.5" />
              <span className="xl:hidden">Financing</span>
              <span className="hidden xl:inline">Apply for Financing</span>
            </FinancingLink>

            {user ? (
              <>
                {user.isAdmin && (
                  <Link
                    to="/admin"
                    className={`hidden lg:inline-flex items-center gap-1.5 text-sm font-medium transition-colors duration-200 relative ${
                      transparent ? "text-white/90 hover:text-white" : "text-foreground/80 hover:text-foreground"
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Admin
                    {newLeads > 0 && (
                      <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none">
                        {newLeads > 99 ? "99+" : newLeads}
                      </span>
                    )}
                  </Link>
                )}
                <Link
                  to="/profile"
                  className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors duration-200 ${
                    transparent ? "text-white/90 hover:text-white" : "text-foreground/80 hover:text-foreground"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{user.name?.split(" ")[0]}</span>
                </Link>
              </>
            ) : (
              <Link
                to="/login"
                className={`text-xs font-semibold whitespace-nowrap px-4 py-2 rounded-lg transition-colors duration-200 ${
                  transparent
                    ? "bg-white/15 text-white border border-white/30 hover:bg-white/25"
                    : "border border-border text-foreground hover:border-primary hover:text-primary"
                }`}
              >
                Sign In
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              className={`lg:hidden p-1.5 rounded-md transition-colors ${
                transparent ? "text-white hover:bg-white/10" : "text-foreground hover:bg-secondary"
              }`}
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-0 right-0 z-40 bg-background border-b border-border shadow-lg lg:hidden"
          >
            <div className="flex flex-col px-6 py-3">
              {[
                { to: "/", label: "Home" },
                { to: "/inventory", label: "Inventory" },
                ...ABOUT_LINKS,
                { to: "/contact", label: "Contact" },
                { to: "/compare", label: compareList.length > 0 ? `Compare (${compareList.length})` : "Compare" },
                // { to: "/service", label: "Service" }, // hidden until shop goes live
                ...(user?.isAdmin ? [{ to: "/admin", label: newLeads > 0 ? `Admin Dashboard (${newLeads} new)` : "Admin Dashboard" }] : []),
                ...(user ? [{ to: "/profile", label: "My Profile" }] : [{ to: "/login", label: "Sign In" }]),
              ].map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className="py-3.5 text-sm font-medium border-b border-border last:border-0 text-foreground hover:text-primary transition-colors"
                >
                  {label}
                </Link>
              ))}
              <FinancingLink
                onClick={() => setMobileOpen(false)}
                className="mt-3 mb-1 w-full inline-flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                <BadgeDollarSign className="w-4 h-4" /> Apply for Financing
              </FinancingLink>
              <a
                href="tel:5158098051"
                className="py-3.5 text-sm font-medium text-primary flex items-center gap-2"
              >
                <Phone className="w-4 h-4" /> (515) 809-8051
              </a>
              <a
                href={SITE.smsTel}
                className="py-3.5 text-sm font-medium text-primary flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" /> Text Us
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
