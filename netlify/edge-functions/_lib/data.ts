// Reads vehicles from Supabase over its public REST API (same anon key the website already ships).
// Requires these Netlify environment variables (already used by the Vite build):
//   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY   (SUPABASE_URL / SUPABASE_ANON_KEY also work)
// Row Level Security still applies: only what the public site can already read is returned.

import { parseVehicleParam, shortIdFilter, type SeoVehicle } from "../../../src/lib/vehicleSeo.ts";

const env = (k: string): string | undefined =>
  (globalThis as { Deno?: { env: { get(k: string): string | undefined } } }).Deno?.env.get(k);

const config = () => {
  const url = env("SUPABASE_URL") ?? env("VITE_SUPABASE_URL");
  const key =
    env("SUPABASE_ANON_KEY") ??
    env("VITE_SUPABASE_ANON_KEY") ??
    env("SUPABASE_PUBLISHABLE_KEY") ??
    env("VITE_SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key) throw new Error("Supabase env vars missing (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)");
  return { url: url.replace(/\/$/, ""), key };
};

async function rest<T>(query: string): Promise<T> {
  const { url, key } = config();
  const res = await fetch(`${url}/rest/v1/${query}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as T;
}

// Tiny per-isolate cache so a burst of crawler hits doesn't hammer the database.
let cache: { at: number; rows: SeoVehicle[] } | null = null;
const TTL_MS = 60_000;

export async function listVehicles(): Promise<SeoVehicle[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.rows;
  const rows = await rest<SeoVehicle[]>("vehicles?select=*&order=created_at.desc");
  cache = { at: Date.now(), rows };
  return rows;
}

/** Finds a vehicle from the URL segment: a readable slug (…-a148fbd4) or an old full uuid. */
export async function findVehicle(segment: string): Promise<SeoVehicle | null> {
  const parsed = parseVehicleParam(segment);
  if (!parsed) return null;
  // Same select as the vehicle page itself (category join included), so the row can be embedded as-is.
  const select = "*,category:categories(id,name)";
  const q =
    parsed.kind === "uuid"
      ? `vehicles?select=${select}&id=eq.${parsed.id}&limit=1`
      : `vehicles?select=${select}&${shortIdFilter(parsed.prefix)}&limit=1`;
  const rows = await rest<SeoVehicle[]>(q);
  return rows[0] ?? null;
}

/**
 * A vehicle that no longer exists (deleted, not merely sold) has nothing to embed on a page, but
 * may still have a tombstone row (see migrations/20261111_deleted_vehicle_tombstone.sql) recording
 * its type/title_status/price — enough to redirect its old URL to a matching category page
 * instead of a bare 404. Returns null if there is no tombstone (never existed, or not deleted this way).
 */
export async function findDeletedVehicle(
  segment: string
): Promise<{ type: string | null; title_status: string | null; price: number | null } | null> {
  const parsed = parseVehicleParam(segment);
  if (!parsed) return null;
  const q =
    parsed.kind === "uuid"
      ? `deleted_vehicles?select=type,title_status,price&id=eq.${parsed.id}&limit=1`
      : `deleted_vehicles?select=type,title_status,price&${shortIdFilter(parsed.prefix)}&limit=1`;
  try {
    const rows = await rest<{ type: string | null; title_status: string | null; price: number | null }[]>(q);
    return rows[0] ?? null;
  } catch {
    // The migration may not have run yet on this environment: fail open to a normal 404, not an error.
    return null;
  }
}
