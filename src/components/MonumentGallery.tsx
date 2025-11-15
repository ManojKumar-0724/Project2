import { MonumentCard } from "./MonumentCard";
import monument1 from "@/assets/monument-1.jpg";
import monument2 from "@/assets/monument-2.jpg";
import monument3 from "@/assets/monument-3.jpg";

const monuments = [
  {
    title: "Hampi Ruins",
    location: "Karnataka",
    image: monument1,
    stories: 12,
    rating: 4.8,
    era: "14th Century",
  },
  {
    title: "Meenakshi Temple",
    location: "Tamil Nadu",
    image: monument2,
    stories: 18,
    rating: 4.9,
    era: "12th Century",
  },
  {
    title: "Golconda Fort",
    location: "Telangana",
    image: monument3,
    stories: 15,
    rating: 4.7,
    era: "16th Century",
  },
];

export const MonumentGallery = () => {
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {monuments.map((monument, index) => (
            <div
              key={index}
              className="animate-slide-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <MonumentCard {...monument} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
