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
  type SeoVehicle,
} from "@/lib/vehicleSeo";
import { dealerJsonLd, fullAddress, socialLinks } from "@/lib/siteConfig";

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
  it("description matches the requested pattern", () => {
    expect(vehicleMetaDescription({ ...rogue, features: ["Backup Camera", "Heated Seats"], drivetrain: "AWD" })).toBe(
      "$12,200 · 55,890 miles · AWD, Backup Camera, Heated Seats. Available at Iowa Trust Motors in Johnston, IA."
    );
  });
  it("stays under ~160 chars", () => {
    const long = vehicleMetaDescription({ ...rogue, features: ["A very long feature name here", "Another long feature name", "Third long feature"] });
    expect(long.length).toBeLessThanOrEqual(160);
  });
  it("reflects pending / sold", () => {
    expect(vehicleMetaDescription({ ...rogue, status: "pending" })).toContain("Sale pending");
    expect(vehicleMetaDescription({ ...rogue, status: "sold" })).toContain("Sold.");
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
    expect(ld.geo).toBeUndefined(); // until the exact Google Maps pin is added
    expect(fullAddress()).toBe("5421 NW Beaver Dr Unit 2, Johnston, IA 50131");
  });
  it("footer links skip networks without a URL (Facebook is not ready yet)", () => {
    expect(socialLinks().map((s) => s.label)).toEqual(["Instagram", "Yelp"]);
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
});
