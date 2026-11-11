import CategoryPage from "@/pages/CategoryPage";
import { HOMEPAGE_FAQ } from "@/lib/siteConfig";

const faq = HOMEPAGE_FAQ.filter((f) => /financ|warranty|rebuilt title/i.test(f.q));

const UsedCarsUnder10000 = () => (
  <CategoryPage
    title="Used Cars Under $10,000 Near Des Moines | Iowa Trust Motors"
    description="Affordable used cars under $10,000 in Johnston, IA. Inspected, clearly priced, financing available. See today's inventory."
    canonical="/used-cars-under-10000"
    compact
    heading="Used Cars Under $10,000 Near Des Moines"
    filter={(v) => typeof v.price === "number" && v.price > 0 && v.price < 10000}
    emptyMessage="Nothing under $10,000 is in stock this week — browse our full inventory to see today's prices."
    faq={faq}
    inventoryHeading="Under $10,000 Right Now"
  >
    <p className="text-body">
      Every car under $10,000 gets the same inspection as the rest of our inventory, and its title
      status is shown on the listing so you know exactly what you're buying. Financing is
      available — call or text (515) 809-8051 to confirm a car is still available.
    </p>
  </CategoryPage>
);

export default UsedCarsUnder10000;
