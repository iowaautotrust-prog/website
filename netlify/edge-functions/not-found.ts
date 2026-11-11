// Netlify Edge Function: real 404s.
//
// Netlify's catch-all (`/* /index.html 200` in public/_redirects) makes the single-page app work on any
// deep link, but it also answered /abc-xyz, /llms.txt or /.well-known/... with the home page and HTTP 200
// (a "soft 404"). This function lets real files and the app's own pages through untouched and turns every
// other address into a proper 404 page that search engines drop.
//
// If anything fails the response is passed through unchanged (fail open).

import { renderPageNotFound } from "./_lib/html.ts";
import { isKnownRoute } from "./_lib/routes.ts";

type Ctx = { next: () => Promise<Response> };

export const config = {
  path: "/*",
  // Built files are never page addresses; skip them to keep the function off the hot path.
  excludedPath: ["/assets/*", "/feeds/*", "/sitemap.xml"],
};

export default async function handler(request: Request, context: Ctx): Promise<Response | undefined> {
  if (request.method !== "GET" && request.method !== "HEAD") return undefined;

  const url = new URL(request.url);
  // The app's own pages are handled by the app (and by seo.ts for the public ones).
  if (isKnownRoute(url.pathname)) return undefined;

  const original = await context.next();
  // Real files (robots.txt, llms.txt, images, ...) come back with their own type: leave them alone.
  if (!(original.headers.get("content-type") ?? "").includes("text/html")) return original;

  const indexHtml = await original.text();
  try {
    const page = renderPageNotFound(indexHtml);
    const headers = new Headers(original.headers);
    headers.delete("content-length");
    headers.delete("content-encoding");
    headers.set("content-type", "text/html; charset=utf-8");
    headers.set("cache-control", "public, max-age=0, must-revalidate");
    headers.set("x-robots-tag", "noindex");
    return new Response(request.method === "HEAD" ? null : page.html, { status: 404, headers });
  } catch (err) {
    console.error("not-found edge function failed, passing the response through:", err);
    return new Response(indexHtml, { status: original.status, headers: original.headers });
  }
}
