import CategoryPage from "@/pages/CategoryPage";
import { HOMEPAGE_FAQ } from "@/lib/siteConfig";

const faq = HOMEPAGE_FAQ.filter((f) => /financ|test drive|warranty/i.test(f.q));

const UsedSuvs = () => (
  <CategoryPage
    title="Used SUVs for Sale in Johnston, IA | Iowa Trust Motors"
    description="Shop inspected used SUVs near Des Moines. AWD options, clear pricing and financing available at Iowa Trust Motors, Johnston IA."
    canonical="/used-suvs"
    heading="Used SUVs for Sale in Johnston, IA"
    filter={(v) => v.type === "SUV"}
    emptyMessage="We're between SUVs in stock right now — check back soon, or browse our full inventory for what's available today."
    faq={faq}
    inventoryHeading="SUVs Available Now"
  >
    <p className="text-body">
      SUVs make up most of what we carry at Iowa Trust Motors, and for good reason — drivers across
      Johnston and the Des Moines metro want the extra ground clearance, cargo room and all-wheel
      drive options that get them through an Iowa winter without a second thought.
    </p>
    <p className="text-body">
      Every SUV on our lot is inspected before it's listed, with its mileage, VIN, drivetrain and
      title status shown clearly on the vehicle page — no guessing whether a listing is hiding
      something. Many of our SUVs carry a rebuilt title at a lower price than a comparable clean-title
      vehicle; we're upfront about exactly what that means and what repairs were done.
    </p>
    <p className="text-body">
      Financing is available on every SUV in stock, and same-day test drives mean you can be behind
      the wheel the day you call.
    </p>
  </CategoryPage>
);

export default UsedSuvs;
