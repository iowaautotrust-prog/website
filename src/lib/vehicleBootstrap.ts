// The server (netlify/edge-functions/seo.ts) already loaded this vehicle to build the page, so it embeds the
// row in the HTML: <script type="application/json" id="vehicle-bootstrap">. The vehicle page uses it for its
// first render instead of waiting for its own Supabase request, which is what made the photo appear late.
// Anything missing or malformed simply means "no bootstrap" and the page fetches as before.

import type { Vehicle } from "./types";
import { parseVehicleParam, shortId } from "./vehicleSeo";

export const BOOTSTRAP_ID = "vehicle-bootstrap";

let cached: Vehicle | null | undefined; // undefined = not read yet

const read = (): Vehicle | null => {
  if (cached !== undefined) return cached;
  cached = null;
  try {
    const el = typeof document !== "undefined" ? document.getElementById(BOOTSTRAP_ID) : null;
    const parsed = el?.textContent ? JSON.parse(el.textContent) : null;
    if (parsed && typeof parsed.id === "string") cached = parsed as Vehicle;
  } catch {
    cached = null;
  }
  return cached;
};

/** True when `v` is the vehicle that a /vehicle/<slug-or-uuid> URL segment points to. */
export const matchesParam = (v: Pick<Vehicle, "id">, param: string | undefined): boolean => {
  const parsed = param ? parseVehicleParam(param) : null;
  if (!parsed) return false;
  return parsed.kind === "uuid" ? parsed.id === v.id : parsed.prefix === shortId(v.id);
};

/** The embedded vehicle, if there is one and it is the vehicle being asked for. */
export const peekVehicleBootstrap = (param: string | undefined): Vehicle | null => {
  const v = read();
  return v && matchesParam(v, param) ? v : null;
};

/** Once the page has used it, drop it: later visits to this car (client-side) must load fresh data. */
export const clearVehicleBootstrap = (): void => {
  cached = null;
  if (typeof document !== "undefined") document.getElementById(BOOTSTRAP_ID)?.remove();
};
