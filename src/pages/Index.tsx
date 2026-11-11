import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import BrandStory from "@/components/BrandStory";
import DiscoveryQuiz from "@/components/DiscoveryQuiz";
import GoogleReviews from "@/components/GoogleReviews";
import HomeContent from "@/components/HomeContent";
import FaqSection from "@/components/FaqSection";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import { useSeo } from "@/hooks/useSeo";
import { PAGE_META } from "@/lib/pageMeta";
import { HOMEPAGE_FAQ, faqJsonLd } from "@/lib/siteConfig";

const Index = () => {
  useSeo({ ...PAGE_META["/"], canonical: "/", jsonLd: faqJsonLd(HOMEPAGE_FAQ) });
  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <HeroSection />
      <BrandStory />
      <DiscoveryQuiz />
      <GoogleReviews />
      <HomeContent />
      <FaqSection items={HOMEPAGE_FAQ} />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default Index;
