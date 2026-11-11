import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import BrandStory from "@/components/BrandStory";
import DiscoveryQuiz from "@/components/DiscoveryQuiz";
import GoogleReviews from "@/components/GoogleReviews";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import { useSeo } from "@/hooks/useSeo";
import { PAGE_META } from "@/lib/pageMeta";

const Index = () => {
  useSeo({ ...PAGE_META["/"], canonical: "/" });
  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <HeroSection />
      <BrandStory />
      <DiscoveryQuiz />
      <GoogleReviews />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default Index;
