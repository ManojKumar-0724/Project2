import { useEffect, useState } from "react";
import { MonumentCard } from "./MonumentCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Monument {
  id: string;
  title: string;
  location: string;
  image_url: string;
  stories_count: number;
  rating: number;
  era: string;
  description: string | null;
}

export const MonumentGallery = () => {
  const [monuments, setMonuments] = useState<Monument[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMonuments();
  }, []);

  const fetchMonuments = async () => {
    try {
      const { data, error } = await supabase
        .from("monuments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setMonuments(data || []);
    } catch (error) {
      toast({
        title: "Error loading monuments",
        description: "Failed to fetch monuments. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 flex justify-center items-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-heritage-terracotta" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Explore Historic Monuments
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover rich folk stories and cultural narratives behind India's iconic heritage sites
          </p>
        </div>

        {monuments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No monuments found. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {monuments.map((monument, index) => (
              <div
                key={monument.id}
                className="animate-slide-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <MonumentCard
                  monumentId={monument.id}
                  title={monument.title}
                  location={monument.location}
                  image={monument.image_url}
                  stories={monument.stories_count}
                  rating={monument.rating}
                  era={monument.era}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
