import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import BrandStory from "@/components/BrandStory";
import DiscoveryQuiz from "@/components/DiscoveryQuiz";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <HeroSection />
      <BrandStory />
      <DiscoveryQuiz />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default Index;
