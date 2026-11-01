// Netlify Edge Function: https://iowatrustmotors.com/feeds/inventory.csv
// Always-current CSV of the available vehicles, for Carsforsale.com / Facebook Marketplace imports.

import { listVehicles } from "./_lib/data.ts";
import { buildInventoryCsv } from "./_lib/feed.ts";

export const config = { path: "/feeds/inventory.csv" };

export default async function handler(): Promise<Response> {
  const csv = buildInventoryCsv(await listVehicles());
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'inline; filename="iowa-trust-motors-inventory.csv"',
      "cache-control": "public, max-age=0, s-maxage=300",
      "x-robots-tag": "noindex",
    },
  });
}
