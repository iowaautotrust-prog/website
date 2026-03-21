import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { User, Heart, LayoutDashboard, GitCompare, Phone, Menu, X } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const { user } = useAuth();
  const { compareList } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 section-padding backdrop-blur-sm border-b border-white/10"
      >
        <div className="flex items-center justify-between py-5">
          {/* Logo */}
          <Link to="/" className="flex flex-col leading-none">
            <span className="text-lg font-bold tracking-tight text-primary-foreground mix-blend-difference">
              IOWA AUTO TRUST
            </span>
            <span className="text-[10px] font-medium tracking-[0.2em] text-primary-foreground/70 mix-blend-difference uppercase">
              Woodward, Iowa
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-medium tracking-wide text-primary-foreground mix-blend-difference transition-opacity duration-300 hover:opacity-60">
              Home
            </Link>
            <Link to="/inventory" className="text-sm font-medium tracking-wide text-primary-foreground mix-blend-difference transition-opacity duration-300 hover:opacity-60">
              Inventory
            </Link>
            <Link to="/contact" className="text-sm font-medium tracking-wide text-primary-foreground mix-blend-difference transition-opacity duration-300 hover:opacity-60">
              Contact
            </Link>
            {compareList.length > 0 && (
              <Link to="/compare" className="text-sm font-medium tracking-wide text-primary-foreground mix-blend-difference transition-opacity duration-300 hover:opacity-60 flex items-center gap-1">
                <GitCompare className="w-3.5 h-3.5" /> Compare ({compareList.length})
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <a
              href="tel:5156725406"
              className="hidden md:inline-flex items-center gap-1.5 text-sm font-medium text-primary-foreground mix-blend-difference transition-opacity duration-300 hover:opacity-60"
            >
              <Phone className="w-3.5 h-3.5" /> (515) 672-5406
            </a>
            {user ? (
              <>
                {user.isAdmin && (
                  <Link to="/admin" className="hidden md:inline-flex items-center gap-1.5 text-sm font-medium text-primary-foreground mix-blend-difference transition-opacity duration-300 hover:opacity-60">
                    <LayoutDashboard className="w-3.5 h-3.5" /> Admin
                  </Link>
                )}
                <Link to="/profile" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-foreground mix-blend-difference transition-opacity duration-300 hover:opacity-60">
                  <User className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{user.name?.split(" ")[0]}</span>
                </Link>
              </>
            ) : (
              <Link to="/login" className="btn-hero text-xs mix-blend-normal bg-primary text-primary-foreground">
                Sign In
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden text-primary-foreground mix-blend-difference p-1"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed top-[73px] left-0 right-0 z-40 bg-background border-b border-border shadow-lg md:hidden"
        >
          <div className="flex flex-col gap-0 section-padding py-4">
            {[
              { to: "/", label: "Home" },
              { to: "/inventory", label: "Inventory" },
              { to: "/contact", label: "Contact" },
              ...(compareList.length > 0 ? [{ to: "/compare", label: `Compare (${compareList.length})` }] : []),
              ...(user?.isAdmin ? [{ to: "/admin", label: "Admin Dashboard" }] : []),
              ...(user ? [{ to: "/profile", label: "My Profile" }] : [{ to: "/login", label: "Sign In" }]),
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className="py-3 text-sm font-medium border-b border-border last:border-0 hover:text-primary transition-colors"
              >
                {label}
              </Link>
            ))}
            <a href="tel:5156725406" className="py-3 text-sm font-medium text-primary flex items-center gap-2">
              <Phone className="w-4 h-4" /> (515) 672-5406
            </a>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default Navbar;
