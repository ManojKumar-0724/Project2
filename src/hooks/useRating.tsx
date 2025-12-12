import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export function useRating(monumentId: string) {
  const [userRating, setUserRating] = useState<number | null>(null);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalRatings, setTotalRatings] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (monumentId) {
      fetchRatings();
    }
  }, [monumentId, user]);

  const fetchRatings = async () => {
    try {
      // Get all ratings for this monument
      const { data: ratings, error } = await supabase
        .from("monument_ratings")
        .select("rating, user_id")
        .eq("monument_id", monumentId);

      if (error) throw error;

      if (ratings && ratings.length > 0) {
        const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        setAverageRating(Math.round(avg * 10) / 10);
        setTotalRatings(ratings.length);

        // Check if current user has rated
        if (user) {
          const userRate = ratings.find(r => r.user_id === user.id);
          setUserRating(userRate?.rating || null);
        }
      } else {
        setAverageRating(0);
        setTotalRatings(0);
      }
    } catch (error) {
      console.error("Error fetching ratings:", error);
    }
  };

  const submitRating = async (rating: number) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to rate monuments",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (userRating) {
        // Update existing rating
        const { error } = await supabase
          .from("monument_ratings")
          .update({ rating, updated_at: new Date().toISOString() })
          .eq("monument_id", monumentId)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Insert new rating
        const { error } = await supabase
          .from("monument_ratings")
          .insert({
            monument_id: monumentId,
            user_id: user.id,
            rating,
          });

        if (error) throw error;
      }

      setUserRating(rating);
      await fetchRatings();

      toast({
        title: "Rating submitted",
        description: `You rated this monument ${rating} stars`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit rating",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return { userRating, averageRating, totalRatings, loading, submitRating };
}
