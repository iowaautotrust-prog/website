import CategoryPage from "@/pages/CategoryPage";
import { HOMEPAGE_FAQ } from "@/lib/siteConfig";

const faq = HOMEPAGE_FAQ.filter((f) => /financ|test drive|located|hours/i.test(f.q));

const UsedCarsUrbandale = () => (
  <CategoryPage
    title="Used Cars Near Urbandale, IA | Iowa Trust Motors"
    description="Used cars for Urbandale drivers, just next door to Johnston, IA. Inspected vehicles, financing and same-day test drives at Iowa Trust Motors."
    canonical="/used-cars-urbandale"
    heading="Used Cars Near Urbandale, IA"
    filter={(v) => v.status !== "sold"}
    emptyMessage="Check back soon — or browse our full inventory for what's available today."
  >
    <p className="text-body">
      Urbandale and Johnston sit right next to each other, so if you're shopping from Urbandale,
      you're already practically at our door. No interstate stretch to plan around, just a short
      local drive to 5421 NW Beaver Dr Unit 2.
    </p>
    <p className="text-body">
      Because we're this close, a lot of our Urbandale customers just stop by after work to look at
      what's on the lot rather than calling ahead — though if you want a specific car pulled up
      front and ready, calling or texting (515) 809-8051 first still saves you the wait.
    </p>
    <p className="text-body">
      Every vehicle is inspected before it's listed, with its title status, mileage and VIN shown
      plainly, and financing is available through Marine Credit Union on anything in stock.
    </p>
  </CategoryPage>
);

export default UsedCarsUrbandale;
