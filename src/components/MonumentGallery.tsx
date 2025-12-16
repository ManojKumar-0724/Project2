import { MonumentCard } from "./MonumentCard";
import { MonumentSearch } from "./MonumentSearch";
import { useMonumentSearch } from "@/hooks/useMonumentSearch";
import { Loader2 } from "lucide-react";

export const MonumentGallery = () => {
  const { monuments, eras, locations, loading, search } = useMonumentSearch();

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Explore Historic Monuments
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover rich folk stories and cultural narratives behind India's iconic heritage sites
          </p>
        </div>

        <div className="max-w-3xl mx-auto mb-12">
          <MonumentSearch
            onSearch={search}
            eras={eras}
            locations={locations}
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-heritage-terracotta" />
          </div>
        ) : monuments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No monuments found matching your search. Try different filters.
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
