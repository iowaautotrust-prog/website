import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { User, LayoutDashboard, GitCompare, Phone, Menu, X, Wrench } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const Navbar = () => {
  const { user } = useAuth();
  const { compareList } = useApp();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [newLeads, setNewLeads] = useState(0);

  // Fetch new leads count for admin/manager badge
  useEffect(() => {
    if (!user?.isAdmin && !user?.isManager) return;

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
  }, [user?.isAdmin, user?.isManager]);

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
          <Link to="/" className="flex flex-col leading-none shrink-0">
            <span className={`text-base font-bold tracking-tight transition-colors duration-200 ${transparent ? "text-white" : "text-foreground"}`}>
              IOWA AUTO TRUST
            </span>
            <span className={`text-[9px] font-medium tracking-[0.2em] uppercase transition-colors duration-200 ${transparent ? "text-white/60" : "text-muted-foreground"}`}>
              Woodward, Iowa
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-7">
            <Link to="/" className={linkClass}>Home</Link>
            <Link to="/inventory" className={linkClass}>Inventory</Link>
            {/* Service link — hidden until shop goes live
            <Link to="/service" className={`${linkClass} flex items-center gap-1`}>
              <Wrench className="w-3.5 h-3.5" />
              Service
            </Link>
            */}
            <Link to="/contact" className={linkClass}>Contact</Link>
            {compareList.length > 0 && (
              <Link to="/compare" className={`${linkClass} flex items-center gap-1`}>
                <GitCompare className="w-3.5 h-3.5" />
                Compare ({compareList.length})
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <a
              href="tel:5156725406"
              className={`hidden md:inline-flex items-center gap-1.5 text-sm font-medium transition-colors duration-200 ${
                transparent ? "text-white/90 hover:text-white" : "text-foreground/80 hover:text-foreground"
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              (515) 672-5406
            </a>

            {user ? (
              <>
                {(user.isAdmin || user.isManager) && (
                  <Link
                    to={user.isManager && !user.isAdmin ? "/shop" : "/admin"}
                    className={`hidden md:inline-flex items-center gap-1.5 text-sm font-medium transition-colors duration-200 relative ${
                      transparent ? "text-white/90 hover:text-white" : "text-foreground/80 hover:text-foreground"
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    {user.isManager && !user.isAdmin ? "Shop" : "Admin"}
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
                className={`text-xs font-semibold px-4 py-2 rounded-lg transition-colors duration-200 ${
                  transparent
                    ? "bg-white/15 text-white border border-white/30 hover:bg-white/25"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                Sign In
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              className={`md:hidden p-1.5 rounded-md transition-colors ${
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
            className="fixed top-16 left-0 right-0 z-40 bg-background border-b border-border shadow-lg md:hidden"
          >
            <div className="flex flex-col px-6 py-3">
              {[
                { to: "/", label: "Home" },
                { to: "/inventory", label: "Inventory" },
                { to: "/contact", label: "Contact" },
                ...(compareList.length > 0 ? [{ to: "/compare", label: `Compare (${compareList.length})` }] : []),
                // { to: "/service", label: "Service" }, // hidden until shop goes live
                ...(user?.isAdmin ? [{ to: "/admin", label: newLeads > 0 ? `Admin Dashboard (${newLeads} new)` : "Admin Dashboard" }] : user?.isManager ? [{ to: "/shop", label: newLeads > 0 ? `Shop Dashboard (${newLeads} new)` : "Shop Dashboard" }] : []),
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
              <a
                href="tel:5156725406"
                className="py-3.5 text-sm font-medium text-primary flex items-center gap-2"
              >
                <Phone className="w-4 h-4" /> (515) 672-5406
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
