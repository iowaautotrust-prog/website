import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { SEO_PAGES, SEO_PAGE_PATHS, blocksText } from "../lib/seoPages.ts";
import { PAGE_META } from "../lib/pageMeta.ts";
import { FAQ_ITEMS } from "../lib/siteConfig.ts";
import { CATEGORY_FILTERS } from "../lib/categoryFilters.ts";
import { isKnownRoute } from "../../netlify/edge-functions/_lib/routes.ts";
import { renderStaticPage } from "../../netlify/edge-functions/_lib/html.ts";

const INDEX_HTML = `<!doctype html><html><head><title>Generic</title><meta name="description" content="generic"></head><body><div id="root"></div></body></html>`;

const EXPECTED = [
  "/financing", "/used-suvs", "/used-cars-under-10000", "/rebuilt-title-cars", "/used-cars-des-moines",
  "/used-cars-west-des-moines", "/used-cars-waukee", "/used-cars-urbandale", "/about", "/how-we-work",
  "/areas-we-serve", "/faq",
];

const words = (t: string) => t.split(/\s+/).filter(Boolean).length;

const car = (over: Record<string, unknown>) => ({
  id: "11111111-1111-1111-1111-111111111111", name: "2018 Test SUV", year: 2018, make: "Test", model: "SUV",
  price: 9000, mileage: 50000, type: "SUV", status: "available", title_status: "Rebuilt", ...over,
});

describe("the 12 SEO pages", () => {
  it("covers exactly the pages the client asked for", () => {
    expect([...SEO_PAGE_PATHS].sort()).toEqual([...EXPECTED].sort());
  });

  it("is in the edge function's path list, otherwise Netlify never server-renders the page", () => {
    const src = readFileSync("netlify/edge-functions/seo.ts", "utf8");
    const list = src.match(/export const config = \{\s*path:\s*\[([\s\S]*?)\]/)?.[1] ?? "";
    const listed = [...list.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    expect(EXPECTED.filter((p) => !listed.includes(p))).toEqual([]);
  });

  it.each(EXPECTED)("%s is a known route and its title/description come from the content file", (p) => {
    expect(isKnownRoute(p)).toBe(true);
    expect(PAGE_META[p]).toEqual({ title: SEO_PAGES[p].title, description: SEO_PAGES[p].description });
  });

  it.each(EXPECTED)("%s has 250-500 words of text", (p) => {
    const n = words(blocksText(SEO_PAGES[p].blocks));
    expect(n).toBeGreaterThanOrEqual(250);
    expect(n).toBeLessThanOrEqual(500);
  });

  it.each(EXPECTED)("%s raw HTML has its own title, description, canonical, H1 and full text", (p) => {
    const page = SEO_PAGES[p];
    const html = renderStaticPage(INDEX_HTML, p, [car({}) as never])!.html;
    expect(html).toContain(`<title>${page.title}</title>`.replace(/&/g, "&amp;"));
    expect(html).toContain(`<link rel="canonical" href="https://iowatrustmotors.com${p}" />`);
    expect(html).not.toContain("<title>Generic</title>");
    expect(html).toContain(`<h1>${page.h1}</h1>`);
    const h2s = page.blocks.filter((b): b is { h2: string } => "h2" in b);
    expect(h2s.length).toBeGreaterThan(2);
    for (const b of h2s) expect(html).toContain(`<h2>${b.h2.replace(/"/g, "&quot;")}</h2>`);
    // every paragraph's first sentence is in the HTML
    for (const b of page.blocks) if ("p" in b) expect(html.replace(/&#39;/g, "'").replace(/&quot;/g, '"')).toContain(b.p.split(/[.\n]/)[0].replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").slice(0, 25));
  });

  it("lists the matching live cars on the car pages, and not sold ones", () => {
    const vehicles = [
      car({ id: "a", make: "Alpha" }),
      car({ id: "b", make: "Bravo", status: "sold" }),
      car({ id: "c", make: "Charlie", type: "Truck", title_status: "Clean", price: 30000 }),
    ] as never[];
    const rebuilt = renderStaticPage(INDEX_HTML, "/rebuilt-title-cars", vehicles)!.html;
    expect(rebuilt).toContain("Alpha");
    expect(rebuilt).not.toContain("Bravo");
    expect(rebuilt).not.toContain("Charlie");
    expect(renderStaticPage(INDEX_HTML, "/used-suvs", vehicles)!.html).not.toContain("Charlie");
    expect(renderStaticPage(INDEX_HTML, "/used-cars-under-10000", vehicles)!.html).toContain("Alpha");
    expect(renderStaticPage(INDEX_HTML, "/about", vehicles)!.html).not.toContain("Alpha");
  });

  it("has a car filter for every page that lists cars, and only those", () => {
    const listing = EXPECTED.filter((p) => SEO_PAGES[p].inventory);
    expect(Object.keys(CATEGORY_FILTERS).sort()).toEqual([...listing].sort());
  });

  it("puts the FAQ schema on /faq only, with every question that is on the page", () => {
    expect(FAQ_ITEMS).toHaveLength(10);
    const faq = renderStaticPage(INDEX_HTML, "/faq", [])!.html;
    const ld = [...faq.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .map((m) => JSON.parse(m[1]))
      .find((j) => j["@type"] === "FAQPage");
    expect(ld.mainEntity.map((q: { name: string }) => q.name)).toEqual(FAQ_ITEMS.map((f) => f.q));
    for (const f of FAQ_ITEMS) expect(faq).toContain(`<h2>${f.q.replace(/"/g, "&quot;")}</h2>`);
    for (const p of EXPECTED.filter((x) => x !== "/faq")) expect(renderStaticPage(INDEX_HTML, p, [])!.html).not.toContain("FAQPage");
    expect(renderStaticPage(INDEX_HTML, "/", [])!.html).not.toContain("FAQPage");
  });

  it("uses each page's own wording: no two pages share a sentence", () => {
    const seen = new Map<string, string>();
    const dupes: string[] = [];
    for (const p of EXPECTED.filter((x) => x !== "/faq")) {
      for (const b of SEO_PAGES[p].blocks) {
        if (!("p" in b)) continue;
        for (const s of b.p.split(/(?<=[.!?])\s+/)) {
          if (s.split(" ").length < 9) continue;
          const key = s.toLowerCase();
          if (seen.has(key) && seen.get(key) !== p) dupes.push(`${seen.get(key)} / ${p}: ${s}`);
          seen.set(key, p);
        }
      }
    }
    // The client's own text repeats a few standard lines (hours, financing, rebuilt-title definition) across pages;
    // this guards against whole pages being pasted twice by mistake, not against those.
    expect(dupes.length).toBeLessThan(8);
  });
  it("matches the Nov 24 text: it says the listings are below, and the page really puts the cars after the text", () => {
    for (const p of EXPECTED) expect(blocksText(SEO_PAGES[p].blocks)).not.toMatch(/listings above/);
    const saysBelow = EXPECTED.filter((p) => /listings below/.test(blocksText(SEO_PAGES[p].blocks)));
    expect(saysBelow.sort()).toEqual(["/used-cars-des-moines", "/used-cars-urbandale", "/used-cars-waukee", "/used-cars-west-des-moines", "/used-suvs"]);
    for (const p of saysBelow) expect(SEO_PAGES[p].inventory).toBeDefined();
    const html = renderStaticPage(INDEX_HTML, "/used-suvs", [car({ make: "Alpha" }) as never])!.html;
    expect(html.indexOf("<h2>Visit our Johnston lot</h2>")).toBeLessThan(html.indexOf("Alpha"));
  });});
