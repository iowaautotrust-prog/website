import InfoPage from "@/components/InfoPage";
import { FAQ_ITEMS, faqJsonLd } from "@/lib/siteConfig";

const Faq = () => <InfoPage path="/faq" jsonLd={faqJsonLd(FAQ_ITEMS)} />;

export default Faq;