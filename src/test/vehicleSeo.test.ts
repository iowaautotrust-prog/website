import { describe, it, expect } from "vitest";
import {
  vehicleTitle,
  vehiclePath,
  parseVehicleParam,
  shortIdFilter,
  vehicleMetaDescription,
  vehicleTitleTag,
  vehicleJsonLd,
  availabilityUrl,
  normalizeFuel,
  optimizeImage,
  currentPrice,
  vehicleAlt,
  gallerySrcSet,
  driveWheelUrl,
  categoryRedirectPath,
  hasPrice,
  priceText,
  statusLabel,
  statusRank,
  type SeoVehicle,
} from "@/lib/vehicleSeo";
import { dealerJsonLd, fullAddress, socialLinks } from "@/lib/siteConfig";
import {
  renderVehiclePage,
  renderPageNotFound,
  inventoryContent,
  homeContent,
} from "../../netlify/edge-functions/_lib/html.ts";
import { matchesParam } from "@/lib/vehicleBootstrap";

const rogue: SeoVehicle = {
  id: "a148fbd4-1111-4222-8333-444455556666",
  name: "Nissan Rogue SV",
  make: "Nissan",
  model: "Rogue",
  trim: "SV AWD",
  year: 2017,
  price: 12200,
  mileage: 55890,
  fuel: "Petrol",
  drivetrain: "AWD",
  features: ["Backup Camera", "Heated Seats", "Bluetooth", "Sunroof"],
  status: "available",
  vin: "JN8AS5MV0HW000000",
  image_urls: ["https://res.cloudinary.com/x/image/upload/v1/a.jpg"],
};

describe("vehicleTitle", () => {
  it("builds from year / make / model / trim", () => {
    expect(vehicleTitle(rogue)).toBe("2017 Nissan Rogue SV AWD");
  });
  it("does not repeat a trim already inside model", () => {
    expect(vehicleTitle({ ...rogue, make: "Chevrolet", model: "Malibu LT", trim: "LT", year: 2024 })).toBe(
      "2024 Chevrolet Malibu LT"
    );
  });
  it("falls back to the free-text name when structured fields are empty", () => {
    expect(vehicleTitle({ id: "x", name: "Mystery Car", price: 1, make: "", model: "", year: null })).toBe("Mystery Car");
  });
});

describe("vehicle URLs", () => {
  it("makes a readable slug ending in the short id", () => {
    expect(vehiclePath(rogue)).toBe("/vehicle/2017-nissan-rogue-sv-awd-a148fbd4");
  });
  it("parses old uuid links and new slugs", () => {
    expect(parseVehicleParam(rogue.id)).toEqual({ kind: "uuid", id: rogue.id });
    expect(parseVehicleParam("2017-nissan-rogue-sv-awd-a148fbd4")).toEqual({ kind: "short", prefix: "a148fbd4" });
    expect(parseVehicleParam("a148fbd4")).toEqual({ kind: "short", prefix: "a148fbd4" });
    expect(parseVehicleParam("not-a-vehicle")).toBeNull();
  });
  it("builds a uuid range filter for the short id", () => {
    expect(shortIdFilter("a148fbd4")).toBe(
      "id=gte.a148fbd4-0000-0000-0000-000000000000&id=lte.a148fbd4-ffff-ffff-ffff-ffffffffffff"
    );
  });
});

describe("meta text", () => {
  it("title tag", () => {
    expect(vehicleTitleTag(rogue)).toBe("2017 Nissan Rogue SV AWD for Sale in Johnston, IA | Iowa Trust Motors");
  });
  it("description matches the requested pattern: year make model, price, mileage", () => {
    expect(vehicleMetaDescription(rogue)).toBe(
      "2017 Nissan Rogue SV AWD - $12,200 - 55,890 miles. Inspected, financing available. Iowa Trust Motors, Johnston, IA."
    );
  });
  it("leaves out mileage when unknown", () => {
    expect(vehicleMetaDescription({ ...rogue, mileage: null })).toBe(
      "2017 Nissan Rogue SV AWD - $12,200. Inspected, financing available. Iowa Trust Motors, Johnston, IA."
    );
  });
  it("stays under ~160 chars", () => {
    const long = vehicleMetaDescription({ ...rogue, model: "Rogue Sport Platinum Reserve Edition", trim: "Premium Technology Package" });
    expect(long.length).toBeLessThanOrEqual(160);
    expect(long).toContain("$12,200");
  });
  it("reflects pending / sold", () => {
    expect(vehicleMetaDescription({ ...rogue, status: "pending" })).toContain("Sale pending.");
    const sold = vehicleMetaDescription({ ...rogue, status: "sold" });
    expect(sold).toContain("Sold.");
    expect(sold).not.toContain("financing");
  });
});

describe("structured data", () => {
  it("maps status to schema.org availability", () => {
    expect(availabilityUrl("available")).toBe("https://schema.org/InStock");
    expect(availabilityUrl("pending")).toBe("https://schema.org/LimitedAvailability");
    expect(availabilityUrl("sold")).toBe("https://schema.org/SoldOut");
  });
  it("Car + Offer has the required fields and no empty ones", () => {
    const ld = vehicleJsonLd(rogue) as any;
    expect(ld["@type"]).toBe("Car");
    expect(ld.vehicleIdentificationNumber).toBe("JN8AS5MV0HW000000");
    expect(ld.fuelType).toBe("Gasoline");
    expect(ld.mileageFromOdometer.value).toBe(55890);
    expect(ld.offers.price).toBe(12200);
    expect(ld.offers.priceCurrency).toBe("USD");
    expect(ld.offers.availability).toBe("https://schema.org/InStock");
    expect(ld.color).toBeUndefined();
    expect(ld.url).toBe("https://iowatrustmotors.com/vehicle/2017-nissan-rogue-sv-awd-a148fbd4");
  });
  it("Offer uses the discounted price the customer sees", () => {
    const d = { ...rogue, discount_amount: 500, discount_expires: null };
    expect(currentPrice(d)).toBe(11700);
    expect((vehicleJsonLd(d) as any).offers.price).toBe(11700);
  });
  it("AutoDealer has postal code, logo, sameAs and omits unset optional fields", () => {
    const ld = dealerJsonLd() as any;
    expect(ld["@type"]).toBe("AutoDealer");
    expect(ld.address.postalCode).toBe("50131");
    expect(ld.address.streetAddress).toBe("5421 NW Beaver Dr Unit 2");
    expect(ld.logo).toBe("https://iowatrustmotors.com/iowa_logo.jpeg");
    expect(ld.sameAs).toEqual([
      "https://g.page/r/CWckIMJKiLqiEBM",
      "https://www.instagram.com/iowatrustmotors.ia/",
      "https://yelp.to/2z_OPRyT7B",
    ]);
    expect(ld.geo).toEqual({ "@type": "GeoCoordinates", latitude: 41.65871668274264, longitude: -93.6841880730135 });
    expect(ld.areaServed).toEqual([
      { "@type": "City", name: "Johnston, IA" },
      { "@type": "City", name: "Des Moines, IA" },
      { "@type": "City", name: "Urbandale, IA" },
      { "@type": "City", name: "West Des Moines, IA" },
      { "@type": "City", name: "Waukee, IA" },
      { "@type": "City", name: "Grimes, IA" },
      { "@type": "City", name: "Ankeny, IA" },
    ]);
    expect(ld.hasMap).toBe("https://g.page/r/CWckIMJKiLqiEBM");
    expect(fullAddress()).toBe("5421 NW Beaver Dr Unit 2, Johnston, IA 50131");
  });
  it("footer links skip networks without a URL (Facebook is not ready yet)", () => {
    expect(socialLinks().map((s) => s.label)).toEqual(["Instagram", "Yelp"]);
  });
});

describe("server-rendered vehicle page", () => {
  const shell = '<html><head><title>x</title></head><body><div id="root"></div></body></html>';
  it("carries the as-is notice, in the HTML before any JavaScript runs", () => {
    const { html } = renderVehiclePage(shell, rogue);
    expect(html).toContain("Sold AS-IS – No dealer warranty.");
  });
  it("keeps the crawler text visually hidden, so visitors never see an unstyled flash", () => {
    const { html } = renderVehiclePage(shell, rogue);
    const tag = /<div id="ssr-content" style="([^"]*)">/.exec(html);
    expect(tag).not.toBeNull();
    expect(tag![1]).toContain("clip:rect(0,0,0,0)");
    expect(tag![1]).toContain("width:1px");
    expect(tag![1]).not.toContain("display:none");
  });
  it("embeds the vehicle for the page's first render, safely", () => {
    const nasty = { ...rogue, description: 'try </script><script>alert(1)</script> & "quotes"' };
    const { html } = renderVehiclePage(shell, nasty);
    const m = /<script type="application\/json" id="vehicle-bootstrap">([\s\S]*?)<\/script>/.exec(html);
    expect(m).not.toBeNull();
    expect(m![1]).not.toContain("</script>");
    expect(JSON.parse(m![1])).toEqual(nasty);
    expect(html.indexOf("vehicle-bootstrap")).toBeGreaterThan(html.indexOf('id="root"'));
  });
});

describe("vehicle bootstrap matching", () => {
  it("matches the slug and the old uuid of the same vehicle, and nothing else", () => {
    expect(matchesParam(rogue, "2017-nissan-rogue-sv-awd-a148fbd4")).toBe(true);
    expect(matchesParam(rogue, rogue.id)).toBe(true);
    expect(matchesParam(rogue, "2020-ford-fusion-se-1aa948ec")).toBe(false);
    expect(matchesParam(rogue, undefined)).toBe(false);
  });
});

describe("Coming Soon status and optional price", () => {
  const soon: SeoVehicle = { ...rogue, status: "coming_soon", price: 0, mileage: 41000 };
  it("sorts available, then coming soon, then sale pending, then sold", () => {
    const order = ["sold", "pending", "coming_soon", "available"].sort((a, b) => statusRank(a) - statusRank(b));
    expect(order).toEqual(["available", "coming_soon", "pending", "sold"]);
    expect(statusLabel("coming_soon")).toBe("Coming Soon");
  });
  it("shows Call for Price when there is no price", () => {
    expect(hasPrice(soon)).toBe(false);
    expect(priceText(0)).toBe("Call for Price");
    expect(priceText(null)).toBe("Call for Price");
    expect(priceText(12200)).toBe("$12,200");
  });
  it("uses the PreOrder availability and leaves the price out of the Offer", () => {
    expect(availabilityUrl("coming_soon")).toBe("https://schema.org/PreOrder");
    const offer = (vehicleJsonLd(soon) as any).offers;
    expect(offer.availability).toBe("https://schema.org/PreOrder");
    expect("price" in offer).toBe(false);
  });
  it("meta description says coming soon and Call for price", () => {
    expect(vehicleMetaDescription(soon)).toBe(
      "2017 Nissan Rogue SV AWD - Call for price - 41,000 miles. Coming soon, request info to be notified. Iowa Trust Motors, Johnston, IA."
    );
  });
  it("is NOT hidden from search: only sold cars are noindex", () => {
    const { html } = renderVehiclePage('<html><head><title>x</title></head><body><div id="root"></div></body></html>', soon);
    expect(html).not.toContain('content="noindex');
    expect(html).toContain("Call for Price");
    expect(html).toContain("Coming Soon");
  });
  it("the server-rendered inventory lists coming soon after available and before sold", () => {
    const list = [
      { ...rogue, id: "11111111-aaaa-bbbb-cccc-000000000001", status: "sold", name: "S" },
      { ...rogue, id: "22222222-aaaa-bbbb-cccc-000000000002", status: "coming_soon", price: 0, name: "C" },
      { ...rogue, id: "33333333-aaaa-bbbb-cccc-000000000003", status: "available", name: "A" },
    ] as SeoVehicle[];
    const html = inventoryContent(list);
    const pos = (id: string) => html.indexOf(id.slice(0, 8));
    expect(pos(list[2].id)).toBeLessThan(pos(list[1].id));
    expect(pos(list[1].id)).toBeLessThan(pos(list[0].id));
    expect(homeContent(list)).not.toContain(list[0].id.slice(0, 8)); // sold never on the home page
  });
});

describe("schema.org drive type", () => {
  it("maps AWD / FWD / RWD / 4WD to schema.org URLs and drops unknown values", () => {
    expect(driveWheelUrl("AWD")).toBe("https://schema.org/AllWheelDriveConfiguration");
    expect(driveWheelUrl("FWD")).toBe("https://schema.org/FrontWheelDriveConfiguration");
    expect(driveWheelUrl("RWD")).toBe("https://schema.org/RearWheelDriveConfiguration");
    expect(driveWheelUrl("4WD")).toBe("https://schema.org/FourWheelDriveConfiguration");
    expect(driveWheelUrl("4x4")).toBe("https://schema.org/FourWheelDriveConfiguration");
    expect(driveWheelUrl("Hovercraft")).toBeUndefined();
    expect(driveWheelUrl(null)).toBeUndefined();
    expect((vehicleJsonLd(rogue) as any).driveWheelConfiguration).toBe("https://schema.org/AllWheelDriveConfiguration");
  });
  it("vehicle pages are og:type product", () => {
    const { html } = renderVehiclePage('<html><head><title>x</title></head><body><div id="root"></div></body></html>', rogue);
    expect(html).toContain('<meta property="og:type" content="product" />');
  });
});

describe("categoryRedirectPath", () => {
  it("prioritizes Rebuilt Title, then SUV, then Under $10K, then the general inventory page", () => {
    expect(categoryRedirectPath({ title_status: "Rebuilt", type: "SUV", price: 5000 })).toBe("/rebuilt-title-cars");
    expect(categoryRedirectPath({ title_status: "Clean", type: "SUV", price: 5000 })).toBe("/used-suvs");
    expect(categoryRedirectPath({ title_status: "Clean", type: "Sedan", price: 5000 })).toBe("/used-cars-under-10000");
    expect(categoryRedirectPath({ title_status: "Clean", type: "Sedan", price: 25000 })).toBe("/inventory");
    expect(categoryRedirectPath({})).toBe("/inventory");
  });
  it("a Coming Soon car with no price yet (0) never matches Under $10K", () => {
    expect(categoryRedirectPath({ type: "Sedan", price: 0 })).toBe("/inventory");
    expect(categoryRedirectPath({ type: "Sedan", price: null })).toBe("/inventory");
  });
});

describe("page not found", () => {
  it("is a 404, noindex, with a real heading", () => {
    const page = renderPageNotFound('<html><head><title>x</title></head><body><div id="root"></div></body></html>');
    expect(page.status).toBe(404);
    expect(page.html).toContain('content="noindex, follow"');
    expect(page.html).toContain("<h1>Page not found</h1>");
  });
});
describe("misc", () => {
  it("Petrol -> Gasoline", () => {
    expect(normalizeFuel("Petrol")).toBe("Gasoline");
    expect(normalizeFuel("Hybrid")).toBe("Hybrid");
  });
  it("alt text numbers photos from 1", () => {
    expect(vehicleAlt(rogue, 2)).toBe("2017 Nissan Rogue SV AWD – photo 3");
  });
  it("optimizeImage only touches Cloudinary urls, once", () => {
    const u = "https://res.cloudinary.com/x/image/upload/v1792176100/vehicle-images/a.jpg";
    const o = optimizeImage(u, 640);
    expect(o).toBe("https://res.cloudinary.com/x/image/upload/f_auto,q_auto,c_limit,w_640/v1792176100/vehicle-images/a.jpg");
    expect(optimizeImage(o, 640)).toBe(o);
    expect(optimizeImage("https://example.com/a.jpg", 640)).toBe("https://example.com/a.jpg");
    expect(optimizeImage(u, 1200, { jpg: true, height: 630 })).toContain("f_jpg,q_auto,c_fill,h_630,w_1200");
  });
  it("gallerySrcSet offers phone-sized widths for Cloudinary photos only", () => {
    const u = "https://res.cloudinary.com/x/image/upload/v1/a.jpg";
    expect(gallerySrcSet(u)).toBe(
      "https://res.cloudinary.com/x/image/upload/f_auto,q_auto,c_limit,w_480/v1/a.jpg 480w, " +
        "https://res.cloudinary.com/x/image/upload/f_auto,q_auto,c_limit,w_800/v1/a.jpg 800w, " +
        "https://res.cloudinary.com/x/image/upload/f_auto,q_auto,c_limit,w_1200/v1/a.jpg 1200w"
    );
    expect(gallerySrcSet("https://example.com/a.jpg")).toBe("");
  });
});
