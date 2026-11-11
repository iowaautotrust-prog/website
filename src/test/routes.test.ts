import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { isKnownRoute } from "../../netlify/edge-functions/_lib/routes.ts";

describe("known routes (soft 404 protection)", () => {
  it("knows every page the app really has", () => {
    // Read the <Route path="..."> list straight out of App.tsx so the two can never drift apart.
    const app = readFileSync("src/App.tsx", "utf8");
    const paths = [...app.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]).filter((p) => p !== "*");
    expect(paths.length).toBeGreaterThan(20);
    const missing = paths
      .map((p) => p.replace(/:[A-Za-z]+/g, "example"))
      .filter((p) => !isKnownRoute(p));
    expect(missing).toEqual([]);
  });

  it("treats trailing slashes like the page itself", () => {
    expect(isKnownRoute("/inventory/")).toBe(true);
    expect(isKnownRoute("/")).toBe(true);
    expect(isKnownRoute("/vehicle/2017-nissan-rogue-sv-6876b6d8")).toBe(true);
  });

  it("does not know made-up addresses, so they get a real 404 (unless a real file such as llms.txt exists)", () => {
    for (const p of ["/abc-xyz", "/llms.txt", "/.well-known/ard.json", "/wp-login.php", "/inventory/extra", "/vehicle", "/admin/nothing"]) {
      expect(isKnownRoute(p), p).toBe(false);
    }
  });
});
