import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { ArrowDown, MapPin, Phone } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VehicleGrid from "@/components/VehicleGrid";
import SeoText from "@/components/SeoText";
import { useSeo } from "@/hooks/useSeo";
import { PAGE_META } from "@/lib/pageMeta";
import { SEO_PAGES } from "@/lib/seoPages";
import { CATEGORY_FILTERS } from "@/lib/categoryFilters";
import { SITE, fullAddress } from "@/lib/siteConfig";

interface Props {
  /** The page's path; its title, text, cars and empty message all come from seoPages.ts / categoryFilters.ts. */
  path: string;
  /** An extra first button, e.g. "Apply for Financing". */
  primaryAction?: ReactNode;
}

// Shared layout for the SEO plan's category/city landing pages: heading and quick buttons, the client's text,
// then the matching live cars (the text says "check the listings below"), then a link to /contact.
const CategoryPage = ({ path, primaryAction }: Props) => {
  const page = SEO_PAGES[path];
  const inventory = page.inventory!;
  useSeo({ ...PAGE_META[path], canonical: path, ogType: "website" });

  const buttonClass =
    "inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:border-primary hover:text-primary transition-colors";

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="pt-24 pb-8">
        <div className="section-padding">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
            <h1 className="heading-section mb-4">{page.h1}</h1>
            {/* Buyers on a phone can skip the text: the first button jumps straight to the cars. */}
            <div className="flex flex-wrap items-center gap-3 mb-8">
              {primaryAction}
              <a href="#available-cars" className={buttonClass}>
                <ArrowDown className="w-4 h-4" /> See Available Cars
              </a>
              <a href={SITE.directionsUrl} target="_blank" rel="noopener noreferrer" aria-label={`Get directions to ${fullAddress()}`} className={buttonClass}>
                <MapPin className="w-4 h-4" /> Get Directions
              </a>
              <a href={SITE.phoneTel} className={buttonClass}>
                <Phone className="w-4 h-4" /> {SITE.phone}
              </a>
            </div>
            <SeoText blocks={page.blocks} />
          </motion.div>
        </div>
      </main>

      <section id="available-cars" className="section-padding pb-16 scroll-mt-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-foreground">{inventory.heading ?? "Available Now"}</h2>
          <Link to="/inventory" className="text-sm font-semibold text-primary hover:underline">
            Browse All Inventory →
          </Link>
        </div>
        <VehicleGrid filter={CATEGORY_FILTERS[path]} emptyMessage={inventory.emptyMessage} />
      </section>

      <section className="section-padding pb-16 text-center">
        <Link to="/contact" className="btn-hero inline-flex items-center gap-2">
          Contact Us
        </Link>
      </section>

      <Footer />
    </div>
  );
};

export default CategoryPage;
