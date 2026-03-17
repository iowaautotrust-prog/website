import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { User, Heart, LayoutDashboard, GitCompare } from "lucide-react";

const Navbar = () => {
  const { user } = useAuth();
  const { compareList } = useApp();

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 section-padding"
    >
      <div className="flex items-center justify-between py-6">
        <Link to="/" className="text-xl font-bold tracking-tight text-primary-foreground mix-blend-difference">
          AUTOVAULT
        </Link>
        <div className="hidden md:flex items-center gap-10">
          <Link to="/" className="text-sm font-medium tracking-wide text-primary-foreground mix-blend-difference transition-opacity duration-300 hover:opacity-60">
            Home
          </Link>
          <Link to="/inventory" className="text-sm font-medium tracking-wide text-primary-foreground mix-blend-difference transition-opacity duration-300 hover:opacity-60">
            Inventory
          </Link>
          {compareList.length > 0 && (
            <Link to="/compare" className="text-sm font-medium tracking-wide text-primary-foreground mix-blend-difference transition-opacity duration-300 hover:opacity-60 flex items-center gap-1">
              <GitCompare className="w-3.5 h-3.5" /> Compare ({compareList.length})
            </Link>
          )}
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {user.isAdmin && (
                <Link to="/admin" className="hidden md:inline-flex items-center gap-1.5 text-sm font-medium text-primary-foreground mix-blend-difference transition-opacity duration-300 hover:opacity-60">
                  <LayoutDashboard className="w-3.5 h-3.5" /> Admin
                </Link>
              )}
              <Link to="/profile" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-foreground mix-blend-difference transition-opacity duration-300 hover:opacity-60">
                <User className="w-3.5 h-3.5" /> {user.name}
              </Link>
            </>
          ) : (
            <Link to="/login" className="btn-hero text-xs mix-blend-normal bg-primary text-primary-foreground">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
