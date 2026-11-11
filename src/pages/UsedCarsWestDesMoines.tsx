import CategoryPage from "@/pages/CategoryPage";
import { HOMEPAGE_FAQ } from "@/lib/siteConfig";

const faq = HOMEPAGE_FAQ.filter((f) => /financ|test drive|located/i.test(f.q));

const UsedCarsWestDesMoines = () => (
  <CategoryPage
    title="Used Cars Near West Des Moines, IA | Iowa Trust Motors"
    description="Used cars for West Des Moines drivers. A quick trip across the metro to Johnston, IA for inspected vehicles, financing and same-day test drives."
    canonical="/used-cars-west-des-moines"
    heading="Used Cars Near West Des Moines, IA"
    filter={(v) => v.status !== "sold"}
    emptyMessage="Check back soon — or browse our full inventory for what's available today."
  >
    <p className="text-body">
      West Des Moines shoppers cross the metro to Johnston more often than you'd think — once
      you're on I-35/I-80, it's a straight run north, not a maze of side streets.
    </p>
    <p className="text-body">
      What usually brings West Des Moines buyers to us specifically: clear, upfront pricing with no
      surprise fees, honest disclosure on any vehicle with a rebuilt title, and financing through
      Marine Credit Union that doesn't require a perfect credit score to get a real answer.
    </p>
    <p className="text-body">
      We're at 5421 NW Beaver Dr Unit 2, Johnston, IA 50131. Call or text (515) 809-8051 before you
      head over and we'll have the car pulled up front for your test drive.
    </p>
  </CategoryPage>
);

export default UsedCarsWestDesMoines;
