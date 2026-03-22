import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturedCars from "@/components/FeaturedCars";
import BrandStory from "@/components/BrandStory";
import DiscoveryQuiz from "@/components/DiscoveryQuiz";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <HeroSection />
      <FeaturedCars />
      <BrandStory />
      <DiscoveryQuiz />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default Index;
