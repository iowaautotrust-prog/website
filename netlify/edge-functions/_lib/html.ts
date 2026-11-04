// Pure HTML helpers for the SEO edge function: no network and no Deno APIs, so they can be
// unit-tested in Node. Imports are relative with explicit .ts extensions (Deno-compatible).

import { SITE, dealerJsonLd, fullAddress } from "../../../src/lib/siteConfig.ts";
import { PAGE_META } from "../../../src/lib/pageMeta.ts";
import {
  GALLERY_SIZES,
  currentPrice,
  formatMiles,
  formatUsd,
  gallerySrcSet,
  normalizeFuel,
  optimizeImage,
  vehicleAlt,
  vehicleImages,
  vehicleJsonLd,
  vehicleMetaDescription,
  vehiclePath,
  vehicleTitle,
  vehicleTitleTag,
  type SeoVehicle,
} from "../../../src/lib/vehicleSeo.ts";

export const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** JSON-LD must never be able to close its own <script> tag. */
export const jsonLdScript = (obj: unknown): string =>
  `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`;

export interface HeadOptions {
  title: string;
  description: string;
  /** Path ("/inventory") or absolute URL on the production domain. */
  canonical: string;
  image?: string;
  ogType?: string;
  noindex?: boolean;
  jsonLd?: unknown[];
  /** First photo of a vehicle page: preloaded so the browser starts fetching it before the app boots. */
  preloadImage?: { href: string; srcset: string; sizes: string };
}

const absolute = (pathOrUrl: string): string =>
  pathOrUrl.startsWith("http") ? pathOrUrl : `${SITE.url}${pathOrUrl}`;

/** Replaces the generic title / description / OG tags / JSON-LD in index.html with page-specific ones. */
export function applyHead(html: string, o: HeadOptions): string {
  const url = o.canonical === "/" ? `${SITE.url}/` : absolute(o.canonical);
  const ogImage = o.image || SITE.image || "";

  let out = html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, "")
    .replace(/<meta\s+name="description"[^>]*>\s*/gi, "")
    .replace(/<meta\s+property="og:[^"]*"[^>]*>\s*/gi, "")
    .replace(/<meta\s+name="twitter:[^"]*"[^>]*>\s*/gi, "")
    .replace(/<meta\s+name="robots"[^>]*>\s*/gi, "")
    .replace(/<link\s+rel="canonical"[^>]*>\s*/gi, "")
    .replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>\s*/gi, "");

  const tags = [
    `<title>${esc(o.title)}</title>`,
    `<meta name="description" content="${esc(o.description)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    o.noindex ? `<meta name="robots" content="noindex, follow" />` : "",
    `<meta property="og:site_name" content="${esc(SITE.name)}" />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta property="og:type" content="${esc(o.ogType ?? "website")}" />`,
    `<meta property="og:title" content="${esc(o.title)}" />`,
    `<meta property="og:description" content="${esc(o.description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    ogImage ? `<meta property="og:image" content="${esc(ogImage)}" />` : "",
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(o.title)}" />`,
    `<meta name="twitter:description" content="${esc(o.description)}" />`,
    ogImage ? `<meta name="twitter:image" content="${esc(ogImage)}" />` : "",
    `<link rel="preconnect" href="https://res.cloudinary.com" />`,
    o.preloadImage
      ? `<link rel="preload" as="image" href="${esc(o.preloadImage.href)}"${
          o.preloadImage.srcset
            ? ` imagesrcset="${esc(o.preloadImage.srcset)}" imagesizes="${esc(o.preloadImage.sizes)}"`
            : ""
        } fetchpriority="high" />`
      : "",
    ...[dealerJsonLd(), ...(o.jsonLd ?? [])].map(jsonLdScript),
  ]
    .filter(Boolean)
    .join("\n    ");

  return out.replace(/<\/head>/i, () => `    ${tags}\n  </head>`);
}

/** Puts server-rendered content inside #root. React replaces it as soon as the app mounts. */
export function injectBody(html: string, content: string): string {
  return html.replace(/<div id="root"><\/div>/, () => `<div id="root">${content}</div>`);
}

// ─── Body content ───────────────────────────────────────────────────────────────

// This markup is for crawlers and screen readers. Visitors must never see it, otherwise the unstyled
// text flashes on screen until the app loads and replaces it. Visually hidden, not display:none.
const WRAP_STYLE =
  "position:absolute;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap";

const statusLabel = (v: SeoVehicle): string =>
  v.status === "sold" ? "Sold" : v.status === "pending" ? "Sale Pending" : "Available";

const siteNav = (): string =>
  `<nav aria-label="Main"><a href="/">Home</a> | <a href="/inventory">Browse Inventory</a> | <a href="/compare">Compare Vehicles</a> | <a href="/contact">Contact Us</a></nav>`;

const siteFooter = (): string => {
  const a = SITE.address;
  return `<footer>
  <p><strong>${esc(SITE.name)}</strong></p>
  <address>${esc(a.street)}, ${esc(a.city)}, ${esc(a.region)} ${esc(a.postalCode)}</address>
  <p>Phone: <a href="${esc(SITE.phoneTel)}">${esc(SITE.phone)}</a> | Email: <a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a></p>
  <p>Hours: ${esc(SITE.hoursLabel)}</p>
  <p><a href="/privacy">Privacy Policy</a> | <a href="/terms">Terms of Service</a></p>
</footer>`;
};

const shell = (inner: string): string =>
  `<div id="ssr-content" style="${WRAP_STYLE}">${siteNav()}<main>${inner}</main>${siteFooter()}</div>`;

const vehicleLi = (v: SeoVehicle): string => {
  const img = vehicleImages(v)[0];
  const bits = [
    formatUsd(currentPrice(v)),
    v.mileage != null ? formatMiles(v.mileage) : "",
    normalizeFuel(v.fuel),
    statusLabel(v),
  ].filter(Boolean);
  return `<li><a href="${esc(vehiclePath(v))}">${
    img
      ? `<img src="${esc(optimizeImage(img, 400))}" alt="${esc(vehicleAlt(v, 0))}" loading="lazy" decoding="async" width="200" height="125" style="width:200px;max-width:100%;height:auto;aspect-ratio:16/10;object-fit:cover;display:block" />`
      : ""
  }${esc(vehicleTitle(v))}</a> &ndash; ${esc(bits.join(" \u00b7 "))}</li>`;
};

export function homeContent(vehicles: SeoVehicle[]): string {
  const live = vehicles.filter((v) => v.status !== "sold").slice(0, 12);
  return shell(`
  <h1>Used Cars for Sale in ${esc(SITE.address.city)}, ${esc(SITE.address.region)}</h1>
  <p>${esc(SITE.tagline)}</p>
  <h2>Current inventory</h2>
  <ul>${live.map(vehicleLi).join("\n")}</ul>
  <p><a href="/inventory">View all inventory</a></p>
  <h2>Visit ${esc(SITE.name)}</h2>
  <p>Find us at ${esc(fullAddress())}. Call ${esc(SITE.phone)} or email ${esc(SITE.email)}. Open ${esc(SITE.hoursLabel)}.</p>`);
}

export function inventoryContent(vehicles: SeoVehicle[]): string {
  const order = (v: SeoVehicle) => (v.status === "sold" ? 2 : v.status === "pending" ? 1 : 0);
  const sorted = [...vehicles].sort((a, b) => order(a) - order(b));
  return shell(`
  <h1>Used Car Inventory in ${esc(SITE.address.city)}, ${esc(SITE.address.region)}</h1>
  <p>${esc(vehicles.filter((v) => v.status !== "sold").length)} vehicles available at ${esc(SITE.name)}.</p>
  <ul>${sorted.map(vehicleLi).join("\n")}</ul>`);
}

export function vehicleContent(v: SeoVehicle): string {
  const specs: [string, string | number | null | undefined][] = [
    ["Price", formatUsd(currentPrice(v))],
    ["Status", statusLabel(v)],
    ["Year", v.year],
    ["Make", v.make],
    ["Model", v.model],
    ["Trim", v.trim],
    ["Mileage", v.mileage != null ? formatMiles(v.mileage) : null],
    ["VIN", v.vin],
    ["Stock #", v.stock_no],
    ["Fuel", normalizeFuel(v.fuel)],
    ["Transmission", v.transmission],
    ["Engine", v.engine],
    ["Drivetrain", v.drivetrain],
    ["Body Style", v.type],
    ["Exterior Color", v.exterior_color],
    ["Interior Color", v.interior_color],
    ["Title Status", v.title_status],
  ];
  const photos = vehicleImages(v);
  return shell(`
  <p><a href="/inventory">&larr; Back to Inventory</a></p>
  <h1>${esc(vehicleTitle(v))}</h1>
  <p><strong>${esc(formatUsd(currentPrice(v)))}</strong> &middot; ${esc(statusLabel(v))}</p>
  <p>${esc(SITE.asIsNotice)}</p>
  <h2>Vehicle details</h2>
  <ul>${specs
    .filter(([, val]) => val !== null && val !== undefined && val !== "")
    .map(([k, val]) => `<li><strong>${esc(k)}:</strong> ${esc(val)}</li>`)
    .join("\n")}</ul>
  ${v.description ? `<h2>Description</h2>\n  <p>${esc(v.description)}</p>` : ""}
  ${
    v.features && v.features.length
      ? `<h2>Features</h2>\n  <ul>${v.features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>`
      : ""
  }
  ${
    photos.length
      ? `<h2>Photos</h2>\n  <div>${photos
          .map(
            (p, i) =>
              `<img src="${esc(optimizeImage(p, 800))}" alt="${esc(vehicleAlt(v, i))}" loading="lazy" decoding="async" width="400" height="250" style="max-width:100%;height:auto;aspect-ratio:16/10;object-fit:cover" />`
          )
          .join("\n")}</div>`
      : ""
  }
  <h2>Interested in this ${esc(vehicleTitle(v))}?</h2>
  <p>Call <a href="${esc(SITE.phoneTel)}">${esc(SITE.phone)}</a>, email <a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a> or visit us at ${esc(fullAddress())}.</p>`);
}

export function contactContent(): string {
  return shell(`
  <h1>Contact ${esc(SITE.name)}</h1>
  <p>Have a question about a vehicle or ready to schedule a visit? Reach out &ndash; we'd love to help you find your next car.</p>
  <ul>
    <li><strong>Phone:</strong> <a href="${esc(SITE.phoneTel)}">${esc(SITE.phone)}</a></li>
    <li><strong>Email:</strong> <a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a></li>
    <li><strong>Address:</strong> <a href="${esc(SITE.mapsUrl)}">${esc(fullAddress())}</a></li>
    <li><strong>Hours:</strong> ${esc(SITE.hoursLabel)}</li>
  </ul>`);
}

export function simpleContent(path: string): string {
  const meta = PAGE_META[path];
  const heading = meta ? meta.title.split("|")[0].trim() : SITE.name;
  return shell(`
  <h1>${esc(heading)}</h1>
  <p>${esc(meta?.description ?? SITE.tagline)}</p>`);
}

export function notFoundContent(): string {
  return shell(`
  <h1>Vehicle Not Found</h1>
  <p>We couldn't find that vehicle. It may have been sold or removed.</p>
  <p><a href="/inventory">Browse our current inventory</a></p>`);
}

// ─── Page assembly ──────────────────────────────────────────────────────────────

export interface Page {
  html: string;
  status: number;
}

export function renderStaticPage(indexHtml: string, path: string, vehicles: SeoVehicle[]): Page | null {
  const meta = PAGE_META[path];
  if (!meta) return null;
  const content =
    path === "/" ? homeContent(vehicles)
    : path === "/inventory" ? inventoryContent(vehicles)
    : path === "/contact" ? contactContent()
    : simpleContent(path);
  const html = injectBody(applyHead(indexHtml, { ...meta, canonical: path }), content);
  return { html, status: 200 };
}

export function renderVehiclePage(indexHtml: string, v: SeoVehicle): Page {
  const first = vehicleImages(v)[0];
  const head = applyHead(indexHtml, {
    title: vehicleTitleTag(v),
    description: vehicleMetaDescription(v),
    canonical: vehiclePath(v),
    image: first ? optimizeImage(first, 1200, { jpg: true, height: 630 }) : undefined,
    noindex: v.status === "sold" && SITE.noindexSold,
    jsonLd: [vehicleJsonLd(v)],
    preloadImage: first
      ? { href: optimizeImage(first, 1200), srcset: gallerySrcSet(first), sizes: GALLERY_SIZES }
      : undefined,
  });
  const html = injectBody(head, vehicleContent(v)).replace(
    /<\/body>/i,
    () => `<script type="application/json" id="vehicle-bootstrap">${JSON.stringify(v).replace(/</g, "\\u003c")}</script>\n  </body>`
  );
  return { html, status: 200 };
}

export function renderNotFound(indexHtml: string): Page {
  const head = applyHead(indexHtml, {
    title: `Vehicle Not Found | ${SITE.name}`,
    description: SITE.tagline,
    canonical: "/inventory",
    noindex: true,
  });
  return { html: injectBody(head, notFoundContent()), status: 404 };
}
