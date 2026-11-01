// Netlify Edge Function: server-side HTML for the public pages.
//
// The React app is a client-side SPA, so the raw HTML used to be an empty <div id="root">.
// This function takes that same index.html and, before it leaves the CDN, fills in
//   - a page-specific <title>, meta description, canonical, Open Graph tags
//   - JSON-LD (AutoDealer on every page, Car + Offer on vehicle pages)
//   - real content (name, price, mileage, VIN, description, photos, links) inside #root
// React then mounts over it exactly as before, so design and features are untouched.
// It also 301-redirects old /vehicle/<uuid> links to the readable URL.
//
// If anything fails (e.g. Supabase unreachable) the untouched index.html is returned.

import { findVehicle, listVehicles } from "./_lib/data.ts";
import { renderNotFound, renderStaticPage, renderVehiclePage, type Page } from "./_lib/html.ts";
import { vehiclePath } from "../../src/lib/vehicleSeo.ts";

type Ctx = { next: () => Promise<Response> };

export const config = {
  path: ["/", "/inventory", "/vehicle/*", "/contact", "/compare", "/privacy", "/terms"],
};

const normalize = (pathname: string): string => pathname.replace(/\/+$/, "") || "/";

export default async function handler(request: Request, context: Ctx): Promise<Response | undefined> {
  if (request.method !== "GET" && request.method !== "HEAD") return undefined;

  const original = await context.next();
  if (!(original.headers.get("content-type") ?? "").includes("text/html")) return original;

  const url = new URL(request.url);
  const path = normalize(url.pathname);
  const indexHtml = await original.text();
  const passthrough = () => new Response(indexHtml, { status: original.status, headers: original.headers });

  try {
    let page: Page | null = null;

    if (path.startsWith("/vehicle/")) {
      const segment = decodeURIComponent(path.slice("/vehicle/".length));
      const vehicle = await findVehicle(segment);
      if (!vehicle) {
        page = renderNotFound(indexHtml);
      } else {
        const canonicalPath = vehiclePath(vehicle);
        if (path !== canonicalPath) {
          // Old /vehicle/<uuid> links and outdated slugs: permanent redirect to the readable URL.
          return Response.redirect(`${url.origin}${canonicalPath}${url.search}`, 301);
        }
        page = renderVehiclePage(indexHtml, vehicle);
      }
    } else {
      const needsInventory = path === "/" || path === "/inventory";
      const vehicles = needsInventory ? await listVehicles() : [];
      page = renderStaticPage(indexHtml, path, vehicles);
    }

    if (!page) return passthrough();

    const headers = new Headers(original.headers);
    headers.delete("content-length");
    headers.delete("content-encoding");
    headers.set("content-type", "text/html; charset=utf-8");
    headers.set("cache-control", "public, max-age=0, must-revalidate");
    return new Response(request.method === "HEAD" ? null : page.html, { status: page.status, headers });
  } catch (err) {
    console.error("seo edge function failed, serving plain index.html:", err);
    return passthrough();
  }
}
