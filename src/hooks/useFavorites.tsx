import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export function useFavorites(monumentId: string) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      checkFavorite();
    } else {
      setIsFavorite(false);
    }
  }, [user, monumentId]);

  const checkFavorite = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("favorite_monuments")
      .select("id")
      .eq("user_id", user.id)
      .eq("monument_id", monumentId)
      .maybeSingle();

    setIsFavorite(!!data);
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save favorites",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from("favorite_monuments")
          .delete()
          .eq("user_id", user.id)
          .eq("monument_id", monumentId);

        if (error) throw error;

        setIsFavorite(false);
        toast({
          title: "Removed from favorites",
          description: "Monument removed from your collection",
        });
      } else {
        const { error } = await supabase
          .from("favorite_monuments")
          .insert({
            user_id: user.id,
            monument_id: monumentId,
          });

        if (error) throw error;

        setIsFavorite(true);
        toast({
          title: "Added to favorites",
          description: "Monument saved to your collection",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return { isFavorite, loading, toggleFavorite };
}
