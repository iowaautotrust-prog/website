import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { SITE, fullAddress } from "@/lib/siteConfig";

// Exact wording the client supplied (homepage content doc, Nov 11 2026) — do not paraphrase.
// Covers: who we are / how we work / areas served / financing / title disclosure / hours / address,
// plus internal links to the new category and city pages (SEO plan section 3.1).
const HomeContent = () => (
  <section className="section-spacing section-padding border-t border-border">
    <div className="max-w-3xl mx-auto space-y-16">
      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.5 }}>
        <h2 className="heading-section mb-4">About Iowa Trust Motors</h2>
        <p className="text-body mb-4">
          Iowa Trust Motors is a locally owned used car dealership in Johnston, Iowa, serving drivers
          across the Des Moines metro. We buy quality vehicles, repair them professionally, have them
          inspected, and sell them at fair, clearly listed prices.
        </p>
        <p className="text-body mb-4">
          Many of our vehicles carry a <Link to="/rebuilt-title-cars" className="text-primary underline underline-offset-2 hover:no-underline">rebuilt title</Link>. We believe you should know exactly what you're buying, so every listing
          shows the title status, the repairs that were done, and real photos of the car. Repair details
          and photos are available on request.
        </p>
        <p className="text-body">
          Our goal is simple: honest cars, honest prices, and a straightforward buying experience — no
          pressure and no surprises.
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.5, delay: 0.05 }}>
        <h2 className="heading-section mb-4">How We Work</h2>
        <ol className="space-y-4">
          <li>
            <p className="font-semibold text-foreground">Step 1 — We select the vehicle</p>
            <p className="text-body">We buy vehicles we believe are worth repairing and that will make reliable daily drivers.</p>
          </li>
          <li>
            <p className="font-semibold text-foreground">Step 2 — We repair it professionally</p>
            <p className="text-body">Every needed repair is completed before the car is listed. We document the work and can share repair details and photos with you.</p>
          </li>
          <li>
            <p className="font-semibold text-foreground">Step 3 — It passes inspection</p>
            <p className="text-body">Before it is offered for sale, the vehicle must pass the Iowa state inspection required for a rebuilt title.</p>
          </li>
          <li>
            <p className="font-semibold text-foreground">Step 4 — Clear listing</p>
            <p className="text-body">Each car is listed with real photos, mileage, VIN, title status and price — what you see is what you get.</p>
          </li>
          <li>
            <p className="font-semibold text-foreground">Step 5 — Test drive and drive home</p>
            <p className="text-body">
              Visit us in Johnston for a same-day test drive.{" "}
              <Link to="/financing" className="text-primary underline underline-offset-2 hover:no-underline">Financing is available</Link>, and we keep the paperwork simple.
            </p>
          </li>
        </ol>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.5, delay: 0.1 }}>
        <h2 className="heading-section mb-4">Serving Johnston and the Des Moines Metro</h2>
        <p className="text-body mb-4">
          Iowa Trust Motors is located at {fullAddress()} — a short drive from anywhere in the Des
          Moines metro. We welcome customers from:
        </p>
        <p className="text-body font-medium mb-4">
          Johnston ·{" "}
          <Link to="/used-cars-des-moines" className="text-primary underline underline-offset-2 hover:no-underline">Des Moines</Link>{" "}
          · Urbandale · West Des Moines · Clive · Grimes · Waukee · Ankeny
        </p>
        <p className="text-body">
          Hours: {SITE.hoursLabel}<br />
          Call or text: <a href={SITE.phoneTel} className="text-primary underline underline-offset-2 hover:no-underline">{SITE.phone}</a>
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="flex flex-wrap gap-3"
      >
        {[
          { to: "/inventory", label: "Browse All Inventory" },
          { to: "/used-suvs", label: "Used SUVs" },
          { to: "/financing", label: "Financing" },
          { to: "/used-cars-under-10000", label: "Under $10,000" },
          { to: "/rebuilt-title-cars", label: "Rebuilt Title Cars" },
          { to: "/used-cars-des-moines", label: "Des Moines Buyers" },
          { to: "/used-cars-west-des-moines", label: "West Des Moines Buyers" },
          { to: "/used-cars-waukee", label: "Waukee Buyers" },
          { to: "/used-cars-urbandale", label: "Urbandale Buyers" },
        ].map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
          >
            {label} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        ))}
      </motion.div>
    </div>
  </section>
);

export default HomeContent;
