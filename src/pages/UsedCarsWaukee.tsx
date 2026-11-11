import CategoryPage from "@/pages/CategoryPage";
import { HOMEPAGE_FAQ } from "@/lib/siteConfig";

const faq = HOMEPAGE_FAQ.filter((f) => /financ|test drive|rebuilt title/i.test(f.q));

const UsedCarsWaukee = () => (
  <CategoryPage
    title="Used Cars Near Waukee, IA | Iowa Trust Motors"
    description="Used cars for Waukee drivers. Inspected vehicles, financing and same-day test drives at Iowa Trust Motors in Johnston, IA."
    canonical="/used-cars-waukee"
    heading="Used Cars Near Waukee, IA"
    filter={(v) => v.status !== "sold"}
    emptyMessage="Check back soon — or browse our full inventory for what's available today."
  >
    <p className="text-body">
      Waukee has grown fast, and a lot of that growth is families who'd rather buy locally than
      drive into the city for a dealership. Johnston sits on the other side of the metro loop from
      Waukee, reached via Hickman Road or I-80/35 — not a long trip, just a different side of town.
    </p>
    <p className="text-body">
      Many of the vehicles we sell carry a rebuilt title, which lets us price them below a
      comparable clean-title car without cutting corners on the repair or the inspection. We think
      that's worth the drive for Waukee buyers who want more SUV or truck for their money.
    </p>
    <p className="text-body">
      Financing is available on every vehicle in stock, and same-day test drives are the norm — call
      or text (515) 809-8051 first so the car's ready when you get here.
    </p>
  </CategoryPage>
);

export default UsedCarsWaukee;
