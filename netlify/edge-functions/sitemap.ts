// Netlify Edge Function: /sitemap.xml, generated live from the inventory.
// Lists the public pages plus every available, coming-soon and sale-pending vehicle (sold ones drop out
// automatically), with photos for Google Image search.

import { listVehicles } from "./_lib/data.ts";
import { esc } from "./_lib/html.ts";
import { SITE } from "../../src/lib/siteConfig.ts";
import { vehicleAlt, vehicleImages, vehicleUrl } from "../../src/lib/vehicleSeo.ts";

export const config = { path: "/sitemap.xml" };

const isoDate = (s?: string | null): string | null => (s && !Number.isNaN(Date.parse(s)) ? new Date(s).toISOString() : null);

export default async function handler(): Promise<Response> {
  const vehicles = (await listVehicles()).filter((v) => v.status !== "sold");
  const newest = vehicles.map((v) => isoDate(v.updated_at ?? v.created_at)).filter(Boolean).sort().pop() ?? null;

  const pages: { loc: string; lastmod: string | null; priority: string }[] = [
    { loc: `${SITE.url}/`, lastmod: newest, priority: "1.0" },
    { loc: `${SITE.url}/inventory`, lastmod: newest, priority: "0.9" },
    { loc: `${SITE.url}/contact`, lastmod: null, priority: "0.6" },
    // SEO plan (Nov 10, 2026) category/city landing pages.
    { loc: `${SITE.url}/financing`, lastmod: null, priority: "0.7" },
    { loc: `${SITE.url}/used-suvs`, lastmod: null, priority: "0.7" },
    { loc: `${SITE.url}/rebuilt-title-cars`, lastmod: null, priority: "0.6" },
    { loc: `${SITE.url}/used-cars-des-moines`, lastmod: null, priority: "0.6" },
    { loc: `${SITE.url}/used-cars-under-10000`, lastmod: null, priority: "0.5" },
    { loc: `${SITE.url}/used-cars-west-des-moines`, lastmod: null, priority: "0.5" },
    { loc: `${SITE.url}/used-cars-waukee`, lastmod: null, priority: "0.5" },
    { loc: `${SITE.url}/used-cars-urbandale`, lastmod: null, priority: "0.5" },
    { loc: `${SITE.url}/about`, lastmod: null, priority: "0.5" },
    { loc: `${SITE.url}/how-we-work`, lastmod: null, priority: "0.5" },
    { loc: `${SITE.url}/areas-we-serve`, lastmod: null, priority: "0.5" },
    { loc: `${SITE.url}/faq`, lastmod: null, priority: "0.5" },
    { loc: `${SITE.url}/compare`, lastmod: null, priority: "0.4" },
    { loc: `${SITE.url}/privacy`, lastmod: null, priority: "0.2" },
    { loc: `${SITE.url}/terms`, lastmod: null, priority: "0.2" },
  ];

  const urls = [
    ...pages.map(
      (p) =>
        `  <url><loc>${esc(p.loc)}</loc>${p.lastmod ? `<lastmod>${p.lastmod}</lastmod>` : ""}<priority>${p.priority}</priority></url>`
    ),
    ...vehicles.map((v) => {
      const images = vehicleImages(v)
        .slice(0, 10)
        .map(
          (img, i) =>
            `<image:image><image:loc>${esc(img)}</image:loc><image:title>${esc(vehicleAlt(v, i))}</image:title></image:image>`
        )
        .join("");
      const lastmod = isoDate(v.updated_at ?? v.created_at);
      return `  <url><loc>${esc(vehicleUrl(v))}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}<priority>0.8</priority>${images}</url>`;
    }),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join("\n")}
</urlset>
`;
  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=300",
    },
  });
}
