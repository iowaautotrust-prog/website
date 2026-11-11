import CategoryPage from "@/pages/CategoryPage";
import { HOMEPAGE_FAQ } from "@/lib/siteConfig";

const faq = HOMEPAGE_FAQ.filter((f) => /financ|warranty|rebuilt title/i.test(f.q));

const UsedCarsUnder10000 = () => (
  <CategoryPage
    title="Used Cars Under $10,000 Near Des Moines | Iowa Trust Motors"
    description="Affordable used cars under $10,000 in Johnston, IA. Inspected, clearly priced, financing available. See today's inventory."
    canonical="/used-cars-under-10000"
    heading="Used Cars Under $10,000 Near Des Moines"
    filter={(v) => typeof v.price === "number" && v.price > 0 && v.price < 10000}
    emptyMessage="Nothing under $10,000 is in stock this week — browse our full inventory to see today's prices."
    faq={faq}
    inventoryHeading="Under $10,000 Right Now"
  >
    <p className="text-body">
      A tight budget doesn't have to mean a risky car. Every vehicle we price under $10,000 goes
      through the same inspection as the rest of our inventory — nothing skipped because the price
      tag is lower.
    </p>
    <p className="text-body">
      Cars in this range are sometimes priced low because they carry a rebuilt title rather than
      because something's wrong with them. We mark title status clearly on every listing, so you
      know exactly why a car costs what it costs, not just that it's cheap.
    </p>
    <p className="text-body">
      Financing is available even at this price point, and since most of our inventory moves
      quickly, what's listed below is what we actually have on the lot today — not a stale catalog.
      Call or text us before you drive out so we can confirm a car's still available.
    </p>
  </CategoryPage>
);

export default UsedCarsUnder10000;
