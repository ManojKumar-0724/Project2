import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { MonumentGallery } from "@/components/MonumentGallery";
import { StoryPreview } from "@/components/StoryPreview";
import { CrowdsourceSection } from "@/components/CrowdsourceSection";
import { GameSection } from "@/components/GameSection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <div id="monuments">
        <MonumentGallery />
      </div>
      <div id="stories">
        <StoryPreview />
      </div>
      <div id="contribute">
        <CrowdsourceSection />
      </div>
      <div id="quizzes">
        <GameSection />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
