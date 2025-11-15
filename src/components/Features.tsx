import { Sparkles, Globe, Users, Trophy, Search, Layers } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Summarization",
    description: "Get folk stories in short, medium, or detailed versions with intelligent AI summarization.",
    gradient: "from-heritage-terracotta to-heritage-gold",
  },
  {
    icon: Globe,
    title: "Multilingual Narration",
    description: "Listen to stories in English and regional dialects with natural Text-to-Speech technology.",
    gradient: "from-heritage-indigo to-heritage-terracotta",
  },
  {
    icon: Users,
    title: "Crowdsourced Stories",
    description: "Community-driven content where locals can contribute their cultural narratives and photos.",
    gradient: "from-heritage-gold to-heritage-terracotta",
  },
  {
    icon: Trophy,
    title: "Gamified Learning",
    description: "Engage with cultural quizzes, treasure hunts, and progress tracking for deeper learning.",
    gradient: "from-heritage-terracotta to-heritage-indigo",
  },
  {
    icon: Search,
    title: "Smart Search",
    description: "Find stories by title, character, monument, or theme with intelligent recommendations.",
    gradient: "from-heritage-gold to-heritage-indigo",
  },
  {
    icon: Layers,
    title: "3D Reconstruction",
    description: "Toggle between present and historical views of monuments with detailed 3D models.",
    gradient: "from-heritage-indigo to-heritage-gold",
  },
];

export const Features = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Immersive Cultural Experience
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Combining cutting-edge technology with rich cultural heritage to create unforgettable stories
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="p-6 border-0 shadow-card-soft hover:shadow-monument transition-all duration-500 group cursor-pointer bg-card hover:scale-105"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-heritage-terracotta transition-colors">
                {feature.title}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
