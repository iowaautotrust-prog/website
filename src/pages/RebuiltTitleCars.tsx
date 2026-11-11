import CategoryPage from "@/pages/CategoryPage";
import { HOMEPAGE_FAQ } from "@/lib/siteConfig";

const faq = HOMEPAGE_FAQ.filter((f) => /rebuilt title|repairs|insure|warranty/i.test(f.q));

const RebuiltTitleCars = () => (
  <CategoryPage
    title="Rebuilt Title Cars for Sale in Iowa | Iowa Trust Motors"
    description="What a rebuilt title means, how we repair and inspect, and rebuilt-title cars for sale in Johnston, IA. Repair details available."
    canonical="/rebuilt-title-cars"
    heading="Rebuilt Title Cars for Sale in Iowa"
    filter={(v) => (v.title_status ?? "").toLowerCase() === "rebuilt"}
    emptyMessage="None of our current inventory is marked Rebuilt right now — browse our full inventory to see what's available today."
    faq={faq}
    inventoryHeading="Rebuilt Title Cars Available Now"
  >
    <p className="text-body">
      A rebuilt title means a vehicle was previously declared a total loss — usually after an
      accident — and has since been repaired and passed the inspection Iowa requires before it can
      be retitled and driven legally again. It's a real, honest category of used car, not a trick:
      once it passes that inspection, it's registered and insured the same as any other vehicle.
    </p>
    <p className="text-body">
      The tradeoff is the price. A rebuilt-title car typically costs noticeably less than an
      identical clean-title one, which is why it's worth considering if you want more car for your
      budget and you're comfortable knowing its history. We think buyers deserve a dealer who treats
      that history as something to explain clearly, not something to bury in the fine print.
    </p>
    <p className="text-body">
      Every rebuilt-title vehicle we sell has had its repairs completed and documented, and has passed
      Iowa's state inspection before it's listed. We note the title status directly on the vehicle
      page, and we're happy to go over the specific repairs and share photos — just ask, by phone,
      text, or the Request Information button on any listing.
    </p>
    <p className="text-body">
      Before you buy, we'd also recommend a quick call to your insurance agent — most companies
      insure rebuilt-title vehicles, but it's worth confirming your own policy covers it the way you
      expect.
    </p>
  </CategoryPage>
);

export default RebuiltTitleCars;
