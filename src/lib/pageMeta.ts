// Titles and descriptions for the public pages. Used by the React pages (useSeo) and by the
// Netlify edge function that fills in the first HTML response, so the two never drift apart.

import { SITE, fullAddress } from "./siteConfig.ts";

export interface PageMeta {
  title: string;
  description: string;
}

export const PAGE_META: Record<string, PageMeta> = {
  "/": {
    title: "Used Cars for Sale in Johnston, IA | Iowa Trust Motors",
    description:
      "Shop inspected pre-owned vehicles at Iowa Trust Motors in Johnston, IA. Transparent pricing, easy financing and same-day test drives.",
  },
  "/inventory": {
    title: "Used Car Inventory in Johnston, IA | Iowa Trust Motors",
    description:
      "Browse inspected pre-owned cars, trucks and SUVs at Iowa Trust Motors in Johnston, IA. Transparent pricing, vehicle history reports available on request.",
  },
  "/contact": {
    title: "Contact Iowa Trust Motors | Johnston, IA",
    description: `Call ${SITE.phone}, email ${SITE.email} or visit us at ${fullAddress()}. Open Mon-Sat 9am-5pm.`,
  },
  "/compare": {
    title: "Compare Vehicles | Iowa Trust Motors",
    description:
      "Compare up to three pre-owned vehicles side by side: price, mileage, engine, fuel and more. Iowa Trust Motors, Johnston, IA.",
  },
  "/privacy": {
    title: "Privacy Policy | Iowa Trust Motors",
    description: "How Iowa Trust Motors in Johnston, IA collects, uses and protects your personal information.",
  },
  "/terms": {
    title: "Terms of Service | Iowa Trust Motors",
    description:
      "The terms of service for using the Iowa Trust Motors website and buying a vehicle from us in Johnston, IA.",
  },
  // The four title/description pairs below are the exact wording from the client's Local SEO Plan
  // (Nov 10, 2026), section 3.2 — used verbatim, not paraphrased.
  "/financing": {
    title: "Used Car Financing in Johnston, IA | Iowa Trust Motors",
    description: "Apply for used car financing in Johnston, IA. Fast approval through our lending partner. Call (515) 809-8051 or apply online.",
  },
  "/used-suvs": {
    title: "Used SUVs for Sale in Johnston, IA | Iowa Trust Motors",
    description: "Shop inspected used SUVs near Des Moines. AWD options, clear pricing and financing available at Iowa Trust Motors, Johnston IA.",
  },
  "/rebuilt-title-cars": {
    title: "Rebuilt Title Cars for Sale in Iowa | Iowa Trust Motors",
    description: "What a rebuilt title means, how we repair and inspect, and rebuilt-title cars for sale in Johnston, IA. Repair details available.",
  },
  "/used-cars-des-moines": {
    title: "Used Cars Near Des Moines, IA | Iowa Trust Motors",
    description: "Used cars for Des Moines drivers, 15 minutes away in Johnston. Inspected vehicles, financing, same-day test drives.",
  },
  // The remaining four pages below: the plan gave only the title tag (or, for Urbandale, not even
  // that) and asked us to "write unique text" for the description — written to match the pattern
  // of the pages above.
  "/used-cars-under-10000": {
    title: "Used Cars Under $10,000 Near Des Moines | Iowa Trust Motors",
    description: "Affordable used cars under $10,000 in Johnston, IA. Inspected, clearly priced, financing available. See today's inventory.",
  },
  "/used-cars-west-des-moines": {
    title: "Used Cars Near West Des Moines, IA | Iowa Trust Motors",
    description: "Used cars for West Des Moines drivers. A quick trip across the metro to Johnston, IA for inspected vehicles, financing and same-day test drives.",
  },
  "/used-cars-waukee": {
    title: "Used Cars Near Waukee, IA | Iowa Trust Motors",
    description: "Used cars for Waukee drivers. Inspected vehicles, financing and same-day test drives at Iowa Trust Motors in Johnston, IA.",
  },
  "/used-cars-urbandale": {
    title: "Used Cars Near Urbandale, IA | Iowa Trust Motors",
    description: "Used cars for Urbandale drivers, just next door to Johnston, IA. Inspected vehicles, financing and same-day test drives at Iowa Trust Motors.",
  },
};
