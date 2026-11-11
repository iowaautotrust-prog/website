import InfoPage from "@/components/InfoPage";
import FaqSection from "@/components/FaqSection";
import { HOMEPAGE_FAQ, faqJsonLd } from "@/lib/siteConfig";

const Faq = () => (
  <InfoPage path="/faq" heading="Frequently Asked Questions" jsonLd={faqJsonLd(HOMEPAGE_FAQ)}>
    <FaqSection items={HOMEPAGE_FAQ} bare />
  </InfoPage>
);

export default Faq;
