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
};
