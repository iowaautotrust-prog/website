import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const Navbar = () => {
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
        </div>
        <Link to="/inventory" className="btn-hero text-xs mix-blend-normal bg-primary text-primary-foreground">
          Browse Cars
        </Link>
      </div>
    </motion.nav>
  );
};

export default Navbar;
