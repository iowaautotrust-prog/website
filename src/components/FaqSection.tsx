import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { FaqItem } from "@/lib/siteConfig";

interface Props {
  items: FaqItem[];
  /** Defaults to "Frequently Asked Questions" (the homepage's own heading, per client content). */
  heading?: string;
}

// Plain <details>/<summary> under the hood (via manual open-state, for the chevron animation) — works
// without JS too, and the FAQPage JSON-LD (built from the same `items`) is what actually earns rich
// results, not this component.
const FaqSection = ({ items, heading = "Frequently Asked Questions" }: Props) => {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="section-spacing section-padding border-t border-border">
      <div className="max-w-3xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="heading-section mb-8"
        >
          {heading}
        </motion.h2>
        <div className="divide-y divide-border border-y border-border">
          {items.map((item, i) => (
            <div key={item.q}>
              <button
                onClick={() => setOpen((cur) => (cur === i ? null : i))}
                aria-expanded={open === i}
                className="w-full flex items-center justify-between gap-4 py-5 text-left"
              >
                <span className="font-semibold text-foreground">{item.q}</span>
                <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && <p className="text-body pb-5 pr-8">{item.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
