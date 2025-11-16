import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MonumentCard } from "@/components/MonumentCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Loader2, Heart } from "lucide-react";

interface Monument {
  id: string;
  title: string;
  location: string;
  image_url: string;
  stories_count: number;
  rating: number;
  era: string;
}

export default function Favorites() {
  const [monuments, setMonuments] = useState<Monument[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchFavorites();
  }, [user, navigate]);

  const fetchFavorites = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("favorite_monuments")
        .select(`
          monument_id,
          monuments (
            id,
            title,
            location,
            image_url,
            stories_count,
            rating,
            era
          )
        `)
        .eq("user_id", user.id);

      if (error) throw error;

      const formattedMonuments = data
        .map((fav: any) => fav.monuments)
        .filter(Boolean);

      setMonuments(formattedMonuments);
    } catch (error) {
      toast({
        title: "Error loading favorites",
        description: "Failed to fetch your favorite monuments.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-24 flex justify-center items-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-heritage-terracotta" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Heart className="w-10 h-10 fill-heritage-terracotta text-heritage-terracotta" />
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                My Favorites
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your collection of beloved monuments and heritage sites
            </p>
          </div>

          {monuments.length === 0 ? (
            <div className="text-center py-16">
              <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-2xl font-semibold text-foreground mb-2">
                No favorites yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Start exploring monuments and save your favorites
              </p>
              <a
                href="/#monuments"
                className="inline-block px-6 py-3 bg-heritage-terracotta hover:bg-heritage-terracotta/90 text-heritage-cream rounded-md transition-colors"
              >
                Explore Monuments
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {monuments.map((monument) => (
                <MonumentCard
                  key={monument.id}
                  monumentId={monument.id}
                  title={monument.title}
                  location={monument.location}
                  image={monument.image_url}
                  stories={monument.stories_count}
                  rating={monument.rating}
                  era={monument.era}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
