// Wording for the About / How We Work / Areas We Serve pages. Kept as plain data so the React pages and
// the Netlify edge function (which writes the first HTML response for crawlers) print the same text.
// Exact client wording (homepage content doc, Nov 11 2026) — do not paraphrase.

import { SITE, fullAddress } from "./siteConfig.ts";

export const ABOUT_PARAGRAPHS: string[] = [
  "Iowa Trust Motors is a locally owned used car dealership in Johnston, Iowa, serving drivers across the Des Moines metro. We buy quality vehicles, repair them professionally, have them inspected, and sell them at fair, clearly listed prices.",
  "Many of our vehicles carry a rebuilt title. We believe you should know exactly what you're buying, so every listing shows the title status, the repairs that were done, and real photos of the car. Repair details and photos are available on request.",
  "Our goal is simple: honest cars, honest prices, and a straightforward buying experience — no pressure and no surprises.",
];

export interface WorkStep {
  title: string;
  body: string;
}

export const HOW_WE_WORK_STEPS: WorkStep[] = [
  {
    title: "Step 1 — We select the vehicle",
    body: "We buy vehicles we believe are worth repairing and that will make reliable daily drivers.",
  },
  {
    title: "Step 2 — We repair it professionally",
    body: "Every needed repair is completed before the car is listed. We document the work and can share repair details and photos with you.",
  },
  {
    title: "Step 3 — It passes inspection",
    body: "Before it is offered for sale, the vehicle must pass the Iowa state inspection required for a rebuilt title.",
  },
  {
    title: "Step 4 — Clear listing",
    body: "Each car is listed with real photos, mileage, VIN, title status and price — what you see is what you get.",
  },
  {
    title: "Step 5 — Test drive and drive home",
    body: "Visit us in Johnston for a same-day test drive. Financing is available, and we keep the paperwork simple.",
  },
];

export const AREAS_INTRO = `Iowa Trust Motors is located at ${fullAddress()} — a short drive from anywhere in the Des Moines metro. We welcome customers from:`;

// `to` is set where the site has a dedicated page for that city.
export const AREAS: { name: string; to?: string }[] = [
  { name: "Johnston" },
  { name: "Des Moines", to: "/used-cars-des-moines" },
  { name: "Urbandale", to: "/used-cars-urbandale" },
  { name: "West Des Moines", to: "/used-cars-west-des-moines" },
  { name: "Clive" },
  { name: "Grimes" },
  { name: "Waukee", to: "/used-cars-waukee" },
  { name: "Ankeny" },
];

export const AREAS_CONTACT = `Hours: ${SITE.hoursLabel}. Call or text: ${SITE.phone}.`;

/** Header "About" menu, the mobile menu and the footer all read this list. */
export const ABOUT_LINKS: { to: string; label: string }[] = [
  { to: "/about", label: "About Iowa Trust Motors" },
  { to: "/how-we-work", label: "How We Work" },
  { to: "/areas-we-serve", label: "Areas We Serve" },
];

/** Category and city pages, for the footer "Browse By" column. */
export const BROWSE_LINKS: { to: string; label: string }[] = [
  { to: "/used-suvs", label: "Used SUVs" },
  { to: "/used-cars-under-10000", label: "Cars Under $10,000" },
  { to: "/rebuilt-title-cars", label: "Rebuilt Title Cars" },
  { to: "/financing", label: "Financing" },
  { to: "/used-cars-des-moines", label: "Des Moines" },
  { to: "/used-cars-west-des-moines", label: "West Des Moines" },
  { to: "/used-cars-urbandale", label: "Urbandale" },
  { to: "/used-cars-waukee", label: "Waukee" },
];
