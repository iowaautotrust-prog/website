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
      Inspected used SUVs near Des Moines, with AWD options. Each listing shows the mileage, VIN,
      drivetrain and title status. Financing is available, and same-day test drives are too.
    </p>
  </CategoryPage>
);

export default UsedSuvs;
