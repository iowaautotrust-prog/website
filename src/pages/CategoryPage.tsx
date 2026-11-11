import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { MapPin, Phone } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VehicleGrid from "@/components/VehicleGrid";
import FaqSection from "@/components/FaqSection";
import { useSeo } from "@/hooks/useSeo";
import { SITE, fullAddress, type FaqItem } from "@/lib/siteConfig";
import type { Vehicle } from "@/lib/types";

interface Props {
  title: string;
  description: string;
  canonical: string;
  /** The page's H1 — usually close to the title tag, but written for a person, not a search engine. */
  heading: string;
  /** 250–500 words of unique body copy for this page. */
  children: ReactNode;
  filter: (v: Vehicle) => boolean;
  emptyMessage: string;
  faq?: FaqItem[];
  inventoryHeading?: string;
  /** Buyer-first layout: heading, two action buttons, then the cars; the copy sits below the cars. */
  compact?: boolean;
}

// Shared layout for the SEO plan's category/city landing pages (/financing, /used-suvs,
// /rebuilt-title-cars, /used-cars-des-moines): unique intro copy, directions, the matching filtered
// inventory, and links back to /inventory and /contact — per section 3.2's per-page requirements.
const CategoryPage = ({ title, description, canonical, heading, children, filter, emptyMessage, faq, inventoryHeading = "Available Now", compact = false }: Props) => {
  useSeo({ title, description, canonical, ogType: "website" });

  const buttonClass =
    "inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:border-primary hover:text-primary transition-colors";

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className={compact ? "pt-24 pb-2" : "pt-28 pb-8"}>
        <div className="section-padding">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className={`max-w-3xl ${compact ? "mb-6" : "mb-12"}`}>
            <h1 className="heading-section mb-4">{heading}</h1>
            {compact ? (
              <div className="flex flex-wrap items-center gap-3">
                <a href={SITE.directionsUrl} target="_blank" rel="noopener noreferrer" aria-label={`Get directions to ${fullAddress()}`} className={buttonClass}>
                  <MapPin className="w-4 h-4" /> Get Directions
                </a>
                <a href={SITE.phoneTel} className={buttonClass}>
                  <Phone className="w-4 h-4" /> {SITE.phone}
                </a>
              </div>
            ) : (
              <>
                <div className="space-y-4">{children}</div>
                <div className="flex flex-wrap items-center gap-4 mt-6 text-sm">
                  <a href={SITE.directionsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-primary underline underline-offset-2 hover:no-underline">
                    <MapPin className="w-4 h-4" /> Get Directions — {fullAddress()}
                  </a>
                  <a href={SITE.phoneTel} className="inline-flex items-center gap-1.5 text-primary underline underline-offset-2 hover:no-underline">
                    <Phone className="w-4 h-4" /> {SITE.phone}
                  </a>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </main>

      <section className={`section-padding ${compact ? "pb-10" : "pb-16"}`}>
        <div className={`flex items-center justify-between ${compact ? "mb-5" : "mb-8"}`}>
          <h2 className="text-2xl font-bold text-foreground">{inventoryHeading}</h2>
          <Link to="/inventory" className="text-sm font-semibold text-primary hover:underline">
            Browse All Inventory →
          </Link>
        </div>
        <VehicleGrid filter={filter} emptyMessage={emptyMessage} />
      </section>

      {compact && (
        <section className="section-padding pb-10">
          <div className="max-w-3xl space-y-3 [&_p]:text-base">{children}</div>
        </section>
      )}

      {faq && faq.length > 0 && <FaqSection items={faq} heading="Common Questions" />}

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
