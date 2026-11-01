// CSV inventory feed for syndication (Carsforsale.com, Facebook Marketplace, etc.).
// Pure function: rows in, CSV text out.

import {
  currentPrice,
  normalizeFuel,
  vehicleImages,
  vehicleUrl,
  type SeoVehicle,
} from "../../../src/lib/vehicleSeo.ts";

export const FEED_COLUMNS = [
  "vin",
  "stock_number",
  "year",
  "make",
  "model",
  "trim",
  "price",
  "mileage",
  "fuel_type",
  "drivetrain",
  "exterior_color",
  "interior_color",
  "title_status",
  "description",
  "photo_urls",
  "vehicle_url",
] as const;

const csvCell = (v: unknown): string => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** "Malibu LT" + trim "LT" -> model "Malibu" so model and trim don't repeat in the feed. */
const modelWithoutTrim = (v: SeoVehicle): string => {
  const model = (v.model ?? "").trim();
  const trim = (v.trim ?? "").trim();
  if (trim && model.toLowerCase().endsWith(trim.toLowerCase())) {
    return model.slice(0, model.length - trim.length).trim() || model;
  }
  return model;
};

export function buildInventoryCsv(vehicles: SeoVehicle[]): string {
  const rows = vehicles
    .filter((v) => v.status === "available")
    .map((v) => [
      v.vin,
      v.stock_no,
      v.year,
      v.make,
      modelWithoutTrim(v),
      v.trim,
      currentPrice(v),
      v.mileage,
      normalizeFuel(v.fuel),
      v.drivetrain,
      v.exterior_color,
      v.interior_color,
      v.title_status,
      (v.description ?? "").replace(/\s+/g, " ").trim(),
      vehicleImages(v).join("|"), // photo URLs, pipe-separated
      vehicleUrl(v),
    ]);
  return [FEED_COLUMNS.join(","), ...rows.map((r) => r.map(csvCell).join(","))].join("\r\n") + "\r\n";
}
