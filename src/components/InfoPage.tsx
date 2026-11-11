import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSeo } from "@/hooks/useSeo";
import { PAGE_META } from "@/lib/pageMeta";

interface Props {
  path: string;
  heading: string;
  children: ReactNode;
  jsonLd?: Record<string, unknown> | null;
}

// Shared shell for the plain content pages (About, How We Work, Areas We Serve, FAQ).
const InfoPage = ({ path, heading, children, jsonLd }: Props) => {
  useSeo({ ...PAGE_META[path], canonical: path, jsonLd });

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="pt-28 pb-16">
        <div className="section-padding">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
            <h1 className="heading-section mb-6">{heading}</h1>
            <div className="space-y-4">{children}</div>
            <div className="flex flex-wrap gap-3 mt-10">
              <Link to="/inventory" className="btn-hero">Browse Inventory</Link>
              <Link to="/contact" className="btn-hero-outline">Contact Us</Link>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default InfoPage;
