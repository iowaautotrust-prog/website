// Pure helpers for vehicle titles, readable URLs, meta text and JSON-LD.
// Shared by the React app and the Netlify edge functions: no React, no aliases.

import { SITE } from "./siteConfig.ts";

export interface SeoVehicle {
  id: string;
  name: string;
  make?: string | null;
  model?: string | null;
  trim?: string | null;
  year?: number | null;
  price: number;
  mileage?: number | null;
  fuel?: string | null;
  type?: string | null;
  transmission?: string | null;
  engine?: string | null;
  drivetrain?: string | null;
  stock_no?: string | null;
  title_status?: string | null;
  exterior_color?: string | null;
  interior_color?: string | null;
  vin?: string | null;
  description?: string | null;
  features?: string[] | null;
  status?: string | null;
  image_url?: string | null;
  image_urls?: string[] | null;
  carfax_url?: string | null;
  discount_amount?: number | null;
  discount_expires?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
}

export const FUEL_TYPES = ["Gasoline", "Diesel", "Hybrid", "Plug-in Hybrid", "Electric", "Flex Fuel"];
export const TITLE_STATUSES = ["Clean", "Rebuilt"];
export const DRIVETRAINS = ["FWD", "RWD", "AWD", "4WD"];

/** US wording: legacy "Petrol" becomes "Gasoline". */
export const normalizeFuel = (fuel?: string | null): string => {
  const f = (fuel ?? "").trim();
  if (!f) return "";
  if (f.toLowerCase() === "petrol") return "Gasoline";
  return f;
};

export const slugify = (s: string): string =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** "2017 Nissan Rogue SV AWD", built from Year / Make / Model / Trim (not the free-text name). */
export const vehicleTitle = (v: SeoVehicle): string => {
  const model = (v.model ?? "").trim();
  const trim = (v.trim ?? "").trim();
  const parts: string[] = [];
  if (v.year) parts.push(String(v.year));
  if (v.make) parts.push(v.make.trim());
  if (model) parts.push(model);
  // Older records keep the trim inside "model" (e.g. "Malibu LT"); don't repeat it.
  if (trim && !model.toLowerCase().includes(trim.toLowerCase())) parts.push(trim);
  const built = parts.join(" ").replace(/\s+/g, " ").trim();
  return built || v.name;
};

export const shortId = (id: string): string => id.replace(/-/g, "").slice(0, 8).toLowerCase();

/** /vehicle/2017-nissan-rogue-sv-awd-a148fbd4 */
export const vehiclePath = (v: SeoVehicle): string => {
  const slug = slugify(vehicleTitle(v));
  return `/vehicle/${slug ? `${slug}-` : ""}${shortId(v.id)}`;
};

export const vehicleUrl = (v: SeoVehicle): string => `${SITE.url}${vehiclePath(v)}`;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHORT_ID_RE = /(?:^|-)([0-9a-f]{8})$/i;

export type VehicleParam = { kind: "uuid"; id: string } | { kind: "short"; prefix: string } | null;

/** Reads the last URL segment: an old full UUID link or a new readable slug. */
export const parseVehicleParam = (param: string): VehicleParam => {
  const p = (param ?? "").trim();
  if (UUID_RE.test(p)) return { kind: "uuid", id: p.toLowerCase() };
  const m = SHORT_ID_RE.exec(p);
  if (m) return { kind: "short", prefix: m[1].toLowerCase() };
  return null;
};

/** PostgREST filter that matches a vehicle by its 8-char id prefix (uuid range). */
export const shortIdFilter = (prefix: string): string =>
  `id=gte.${prefix}-0000-0000-0000-000000000000&id=lte.${prefix}-ffff-ffff-ffff-ffffffffffff`;

export const hasActiveDiscount = (v: SeoVehicle): boolean =>
  !!v.discount_amount &&
  v.discount_amount > 0 &&
  (!v.discount_expires || new Date(v.discount_expires) > new Date());

/** Price the customer actually sees (discount applied). */
export const currentPrice = (v: SeoVehicle): number =>
  hasActiveDiscount(v) ? v.price - (v.discount_amount as number) : v.price;

export const formatUsd = (n: number): string => `$${Math.round(n).toLocaleString("en-US")}`;
export const formatMiles = (n: number): string => `${Math.round(n).toLocaleString("en-US")} miles`;

export const vehicleImages = (v: SeoVehicle): string[] =>
  v.image_urls && v.image_urls.length > 0 ? v.image_urls : v.image_url ? [v.image_url] : [];

export const vehicleAlt = (v: SeoVehicle, index: number): string =>
  `${vehicleTitle(v)} – photo ${index + 1}`;

export const vehicleTitleTag = (v: SeoVehicle): string =>
  `${vehicleTitle(v)} for Sale in ${SITE.address.city}, ${SITE.address.region} | ${SITE.name}`;

/** "$12,200 · 55,890 miles · AWD, Backup Camera, Heated Seats. Available at Iowa Trust Motors in Johnston, IA." */
export const vehicleMetaDescription = (v: SeoVehicle): string => {
  const where = `${SITE.name} in ${SITE.address.city}, ${SITE.address.region}`;
  const tail =
    v.status === "sold"
      ? `Sold. See our current inventory at ${where}.`
      : v.status === "pending"
        ? `Sale pending at ${where}.`
        : `Available at ${where}.`;
  const lead = [formatUsd(currentPrice(v))];
  if (v.mileage != null) lead.push(formatMiles(v.mileage));
  // The drivetrain is often also listed as a feature ("AWD"): say it once.
  const seen = new Set<string>();
  const feats = [...(v.drivetrain ? [v.drivetrain] : []), ...(v.features ?? [])].filter((f) => {
    const k = f.trim().toLowerCase();
    return k !== "" && !seen.has(k) && !!seen.add(k);
  });

  let chosen = feats.slice(0, 3);
  const build = () => `${[...lead, ...(chosen.length ? [chosen.join(", ")] : [])].join(" · ")}. ${tail}`;
  let text = build();
  // Keep within ~160 characters so Google doesn't cut it off.
  while (text.length > 160 && chosen.length > 0) {
    chosen = chosen.slice(0, -1);
    text = build();
  }
  return text;
};

export const availabilityUrl = (status?: string | null): string => {
  if (status === "sold") return "https://schema.org/SoldOut";
  if (status === "pending") return "https://schema.org/LimitedAvailability";
  return "https://schema.org/InStock";
};

const clean = (obj: Record<string, unknown>): Record<string, unknown> => {
  for (const k of Object.keys(obj)) {
    const val = obj[k];
    if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
      delete obj[k];
    }
  }
  return obj;
};

/** schema.org Car + Offer for a vehicle page. */
export const vehicleJsonLd = (v: SeoVehicle): Record<string, unknown> => {
  const url = vehicleUrl(v);
  const images = vehicleImages(v);
  return clean({
    "@context": "https://schema.org",
    "@type": "Car",
    name: vehicleTitle(v),
    brand: v.make ? { "@type": "Brand", name: v.make } : undefined,
    model: v.model || undefined,
    vehicleModelDate: v.year ? String(v.year) : undefined,
    vehicleIdentificationNumber: v.vin || undefined,
    mileageFromOdometer:
      v.mileage != null
        ? { "@type": "QuantitativeValue", value: v.mileage, unitCode: "SMI" }
        : undefined,
    fuelType: normalizeFuel(v.fuel) || undefined,
    color: v.exterior_color || undefined,
    vehicleInteriorColor: v.interior_color || undefined,
    driveWheelConfiguration: v.drivetrain || undefined,
    vehicleTransmission: v.transmission || undefined,
    bodyType: v.type || undefined,
    sku: v.stock_no || undefined,
    description: v.description || undefined,
    image: images.length ? images : undefined,
    url,
    itemCondition: "https://schema.org/UsedCondition",
    offers: clean({
      "@type": "Offer",
      price: currentPrice(v),
      priceCurrency: "USD",
      availability: availabilityUrl(v.status),
      itemCondition: "https://schema.org/UsedCondition",
      url,
      seller: { "@type": "AutoDealer", name: SITE.name, "@id": `${SITE.url}/#dealer` },
    }),
  });
};

/** Responsive widths for the main photo on a vehicle page, so phones don't download the 1200px version. */
export const GALLERY_SIZES = "(min-width: 1024px) 60vw, 100vw";
const GALLERY_WIDTHS = [480, 800, 1200];
export const gallerySrcSet = (url: string | null | undefined): string => {
  if (!url || optimizeImage(url, GALLERY_WIDTHS[0]) === url) return "";
  return GALLERY_WIDTHS.map((w) => `${optimizeImage(url, w)} ${w}w`).join(", ");
};

/**
 * Cloudinary delivery transform: automatic WebP/AVIF, automatic quality, capped width.
 * Non-Cloudinary URLs and already-transformed URLs are returned unchanged.
 */
export const optimizeImage = (
  url: string | null | undefined,
  width = 800,
  opts: { jpg?: boolean; height?: number } = {}
): string => {
  if (!url) return "";
  const marker = "/image/upload/";
  const i = url.indexOf(marker);
  if (i === -1 || !url.includes("res.cloudinary.com")) return url;
  const rest = url.slice(i + marker.length);
  // Already has a transform segment (e.g. "f_auto,..."), leave it alone.
  if (/^[a-z]{1,3}_[^/]*\//.test(rest) && !/^v\d+\//.test(rest)) return url;
  const t = [opts.jpg ? "f_jpg" : "f_auto", "q_auto"];
  if (opts.height) t.push("c_fill", `h_${opts.height}`);
  else t.push("c_limit");
  t.push(`w_${width}`);
  return `${url.slice(0, i + marker.length)}${t.join(",")}/${rest}`;
};
