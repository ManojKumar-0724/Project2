import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Users, Shield, TrendingUp } from "lucide-react";

const stats = [
  { icon: Users, value: "2,500+", label: "Contributors" },
  { icon: Upload, value: "5,000+", label: "Stories Shared" },
  { icon: Shield, value: "98%", label: "Approval Rate" },
  { icon: TrendingUp, value: "150+", label: "Monuments Covered" },
];

export const CrowdsourceSection = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--heritage-gold)) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Share Your Cultural Stories
              </h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Be part of a community preserving and sharing folk stories, mythological narratives, 
                and cultural heritage. Your contributions help keep traditions alive for future generations.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  "Upload stories in text, audio, or video format",
                  "Add photos and historical context",
                  "Contribute in regional languages",
                  "Moderated by cultural experts",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-heritage-gold/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <div className="w-2 h-2 rounded-full bg-heritage-gold" />
                    </div>
                    <p className="text-foreground">{item}</p>
                  </div>
                ))}
              </div>

              <Button size="lg" className="bg-heritage-indigo hover:bg-heritage-indigo/90 text-heritage-cream shadow-monument">
                <Upload className="mr-2 h-5 w-5" />
                Contribute a Story
              </Button>
            </div>

            {/* Right Stats Grid */}
            <div className="grid grid-cols-2 gap-6">
              {stats.map((stat, idx) => (
                <Card
                  key={idx}
                  className="p-6 border-0 shadow-card-soft hover:shadow-monument transition-all duration-500 group cursor-pointer bg-gradient-card text-center"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-heritage-terracotta to-heritage-gold flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-500">
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
