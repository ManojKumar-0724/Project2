import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Star, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";

interface MonumentCardProps {
  title: string;
  location: string;
  image: string;
  stories: number;
  rating: number;
  era: string;
  monumentId: string;
}

export const MonumentCard = ({ title, location, image, stories, rating, era, monumentId }: MonumentCardProps) => {
  const navigate = useNavigate();
  const { isFavorite, loading, toggleFavorite } = useFavorites(monumentId);

  return (
    <Card 
      onClick={() => navigate(`/monument?id=${monumentId}`)}
      className="group overflow-hidden border-0 shadow-card-soft hover:shadow-monument transition-all duration-500 cursor-pointer"
    >
      <div className="relative h-64 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-monument opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Floating Badges */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <Badge className="bg-heritage-gold/90 text-heritage-earth border-0 backdrop-blur-sm">
            {stories} Stories
          </Badge>
        </div>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite();
          }}
          disabled={loading}
          className="absolute top-4 left-4 p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-all duration-300 disabled:opacity-50"
        >
          <Heart
            className={cn(
              "w-5 h-5 transition-all duration-300",
              isFavorite ? "fill-heritage-terracotta text-heritage-terracotta" : "text-foreground"
            )}
          />
        </button>

        {/* View AR Button - appears on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <Button 
            onClick={() => navigate(`/ar?monument=${monumentId}`)}
            className="bg-heritage-terracotta hover:bg-heritage-terracotta/90 text-heritage-cream shadow-glow"
          >
            View in AR
          </Button>
        </div>
      </div>

      <div className="p-5 bg-gradient-card">
        <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-heritage-terracotta transition-colors">
          {title}
        </h3>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{era}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-heritage-gold text-heritage-gold" />
          <span className="text-sm font-medium text-foreground">{rating}</span>
          <span className="text-sm text-muted-foreground ml-1">rating</span>
        </div>
      </div>
    </Card>
  );
};
