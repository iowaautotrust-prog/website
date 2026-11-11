import { describe, it, expect, vi } from "vitest";
import handler from "../../netlify/edge-functions/not-found.ts";

const SHELL = '<!doctype html><html><head><title>Used Cars</title></head><body><div id="root"></div></body></html>';
const html = () => new Response(SHELL, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
const ctx = (res: Response) => ({ next: vi.fn(async () => res) });
const get = (path: string, method = "GET") => new Request(`https://iowatrustmotors.com${path}`, { method });

describe("not-found edge function", () => {
  it("answers an unknown address with a real 404 (not the home page with 200)", async () => {
    const c = ctx(html());
    const res = await handler(get("/abc-xyz"), c);
    expect(res!.status).toBe(404);
    expect(res!.headers.get("x-robots-tag")).toBe("noindex");
    const body = await res!.text();
    expect(body).toContain("Page not found");
    expect(body).toContain("Page Not Found | Iowa Trust Motors");
    expect(body).toContain('<div id="root">'); // the app still mounts and shows its own 404 page
  });

  it("does the same for /.well-known/... paths", async () => {
    const res = await handler(get("/.well-known/ard.json"), ctx(html()));
    expect(res!.status).toBe(404);
  });

  it("lets a real file through untouched (e.g. /llms.txt)", async () => {
    const file = new Response("# Iowa Trust Motors", { status: 200, headers: { "content-type": "text/plain; charset=utf-8" } });
    const res = await handler(get("/llms.txt"), ctx(file));
    expect(res!.status).toBe(200);
    expect(await res!.text()).toBe("# Iowa Trust Motors");
  });

  it("does nothing for the app's own pages (they are handled elsewhere)", async () => {
    const c = ctx(html());
    for (const p of ["/", "/inventory", "/contact", "/vehicle/2017-nissan-rogue-sv-6876b6d8", "/admin/leads", "/login"]) {
      expect(await handler(get(p), c), p).toBeUndefined();
    }
    expect(c.next).not.toHaveBeenCalled();
  });

  it("ignores requests that are not GET or HEAD", async () => {
    const c = ctx(html());
    expect(await handler(get("/abc-xyz", "POST"), c)).toBeUndefined();
    expect(c.next).not.toHaveBeenCalled();
  });

  it("HEAD gets the 404 status without a body", async () => {
    const res = await handler(get("/abc-xyz", "HEAD"), ctx(html()));
    expect(res!.status).toBe(404);
    expect(await res!.text()).toBe("");
  });
});
