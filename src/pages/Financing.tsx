import FinancingLink from "@/components/FinancingLink";
import CategoryPage from "@/pages/CategoryPage";
import { HOMEPAGE_FAQ } from "@/lib/siteConfig";

const faq = HOMEPAGE_FAQ.filter((f) => /financ|warranty/i.test(f.q));

const Financing = () => (
  <CategoryPage
    title="Used Car Financing in Johnston, IA | Iowa Trust Motors"
    description="Apply for used car financing in Johnston, IA. Fast approval through our lending partner. Call (515) 809-8051 or apply online."
    canonical="/financing"
    heading="Used Car Financing in Johnston, IA"
    filter={(v) => v.status !== "sold"}
    emptyMessage="Every vehicle currently in stock qualifies for financing — check back soon, or browse our full inventory."
    faq={faq}
  >
    <p className="text-body">
      Buying a used car shouldn't mean a mountain of paperwork or a guessing game on your monthly
      payment. At Iowa Trust Motors in Johnston, IA, we work with Marine Credit Union to get you a
      financing decision quickly, so you know exactly where you stand before you fall in love with a
      car.
    </p>
    <p className="text-body">
      Click "Apply for Financing" below to submit your application online — it only takes a few
      minutes. If you'd rather talk it through first, call or text us at (515) 809-8051 and we'll
      walk you through what to expect.
    </p>
    <p className="text-body">
      Financing is available on our entire inventory, including vehicles with a rebuilt title. We
      list the price of every car clearly, with no hidden fees added at the finance desk — the price
      you see on the listing is the price we start from.
    </p>
    <p className="text-body">
      Whether you're buying your first car or replacing one that's finally given out, our team in
      Johnston is here to make financing straightforward, not stressful.
    </p>
    <FinancingLink className="btn-hero inline-flex items-center gap-2 mt-2">
      Apply for Financing
    </FinancingLink>
  </CategoryPage>
);

export default Financing;
