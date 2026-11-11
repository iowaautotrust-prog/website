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
      We work with Marine Credit Union to get you a financing decision quickly. Apply online, or
      call or text (515) 809-8051 and we'll walk you through it. Financing is available on our
      entire inventory, including vehicles with a rebuilt title.
    </p>
    <FinancingLink className="btn-hero inline-flex items-center gap-2 mt-2">
      Apply for Financing
    </FinancingLink>
  </CategoryPage>
);

export default Financing;
