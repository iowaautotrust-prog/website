import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SeoText from "@/components/SeoText";
import { useSeo } from "@/hooks/useSeo";
import { PAGE_META } from "@/lib/pageMeta";
import { SEO_PAGES } from "@/lib/seoPages";

interface Props {
  path: string;
  jsonLd?: Record<string, unknown> | null;
}

// Shared page for the text-only pages (About, How We Work, Areas We Serve, FAQ): the client's text from seoPages.ts.
const InfoPage = ({ path, jsonLd }: Props) => {
  const page = SEO_PAGES[path];
  useSeo({ ...PAGE_META[path], canonical: path, jsonLd });

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="pt-28 pb-16">
        <div className="section-padding">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
            <h1 className="heading-section mb-6">{page.h1}</h1>
            <SeoText blocks={page.blocks} />
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
