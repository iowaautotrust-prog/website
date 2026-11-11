import CategoryPage from "@/pages/CategoryPage";
import { SITE, fullAddress } from "@/lib/siteConfig";
import { HOMEPAGE_FAQ } from "@/lib/siteConfig";

const faq = HOMEPAGE_FAQ.filter((f) => /financ|test drive|located|hours/i.test(f.q));

const UsedCarsDesMoines = () => (
  <CategoryPage
    title="Used Cars Near Des Moines, IA | Iowa Trust Motors"
    description="Used cars for Des Moines drivers, 15 minutes away in Johnston. Inspected vehicles, financing, same-day test drives."
    canonical="/used-cars-des-moines"
    heading="Used Cars Near Des Moines, IA"
    filter={(v) => v.status !== "sold"}
    emptyMessage="Check back soon — or browse our full inventory for what's available today."
  >
    <p className="text-body">
      If you're searching for a used car from Des Moines, Iowa Trust Motors is about 15 minutes north
      in Johnston — a quick, straightforward drive up NW Beaver Dr, and well worth it if you want a
      dealership that's upfront about every car's condition and price.
    </p>
    <p className="text-body">
      We're located at {fullAddress()}. From most parts of Des Moines, that's a short trip north via
      I-35/I-80 or Merle Hay Road into Johnston — not a cross-town trek.
    </p>
    <p className="text-body">
      Des Moines shoppers calling us tend to ask the same few things: whether we offer financing (yes,
      through our lending partner, Marine Credit Union), whether a car's title is clean or rebuilt
      (we list it on every vehicle page, never buried), and whether they can test drive the same day
      they call (usually, yes — just call or text ahead at {SITE.phone} so the car's ready when you
      arrive).
    </p>
    <p className="text-body">
      Every vehicle is inspected before it's listed, with real photos, mileage and VIN shown clearly.
      Browse what's in stock below, or see our complete current inventory.
    </p>
  </CategoryPage>
);

export default UsedCarsDesMoines;
