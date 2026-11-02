// Netlify Edge Function: https://iowatrustmotors.com/feeds/inventory.csv
// Always-current CSV of the available vehicles, for Carsforsale.com / Facebook Marketplace imports.
// ON HOLD at the client's request: the URL answers 404 until the Netlify environment variable
// INVENTORY_FEED_ENABLED is set to "true" (no code change or redeploy of the app needed besides a normal redeploy).

import { listVehicles } from "./_lib/data.ts";
import { buildInventoryCsv } from "./_lib/feed.ts";

export const config = { path: "/feeds/inventory.csv" };

export default async function handler(): Promise<Response> {
  if (Deno.env.get("INVENTORY_FEED_ENABLED") !== "true") {
    return new Response("Not found", { status: 404, headers: { "x-robots-tag": "noindex" } });
  }
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
