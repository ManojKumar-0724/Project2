import { Button } from "@/components/ui/button";
import { Sparkles, Scan, Globe, Trophy } from "lucide-react";
import heroImage from "@/assets/hero-monument.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-heritage-earth/90 via-heritage-indigo/80 to-transparent" />
      </div>

      {/* Animated Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute top-20 left-20 w-64 h-64 bg-heritage-gold rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-heritage-terracotta rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 z-10 relative">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-card/10 backdrop-blur-sm border border-heritage-gold/30 rounded-full px-4 py-2 mb-6 animate-slide-in">
            <Sparkles className="w-4 h-4 text-heritage-gold animate-glow" />
            <span className="text-sm font-medium text-heritage-cream">Web-based AR Cultural Experience</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-heritage-cream leading-tight">
            Revive Cultural Heritage with{" "}
            <span className="bg-gradient-to-r from-heritage-terracotta to-heritage-gold bg-clip-text text-transparent">
              AR Folk Stories
            </span>
          </h1>

          <p className="text-xl text-heritage-cream/90 mb-8 leading-relaxed">
            Experience monuments come alive with interactive storytelling, AI-powered narration in multiple languages, and immersive augmented reality overlays.
          </p>

          <div className="flex flex-wrap gap-4 mb-12">
            <Button size="lg" className="bg-heritage-terracotta hover:bg-heritage-terracotta/90 text-heritage-cream shadow-monument">
              <Scan className="mr-2 h-5 w-5" />
              Start AR Experience
            </Button>
            <Button size="lg" variant="outline" className="border-heritage-cream/30 text-heritage-cream hover:bg-heritage-cream/10 backdrop-blur-sm">
              <Globe className="mr-2 h-5 w-5" />
              Explore Monuments
            </Button>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-3">
            {[
              { icon: Sparkles, text: "AI Summarization" },
              { icon: Globe, text: "Multilingual TTS" },
              { icon: Trophy, text: "Gamified Quizzes" },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-card/20 backdrop-blur-sm border border-heritage-cream/20 rounded-full px-4 py-2"
              >
                <feature.icon className="w-4 h-4 text-heritage-gold" />
                <span className="text-sm text-heritage-cream">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <div className="w-6 h-10 border-2 border-heritage-cream/30 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-3 bg-heritage-gold rounded-full animate-glow" />
        </div>
      </div>
    </section>
  );
};
