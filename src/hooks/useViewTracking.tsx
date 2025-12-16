import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useViewTracking() {
  const { user } = useAuth();

  const trackMonumentView = useCallback(
    async (monumentId: string) => {
      try {
        await supabase.from("monument_views").insert({
          monument_id: monumentId,
          user_id: user?.id || null,
        });
      } catch (error) {
        console.error("Error tracking monument view:", error);
      }
    },
    [user]
  );

  const trackStoryView = useCallback(
    async (storyId: string, language: string = "en") => {
      try {
        await supabase.from("story_views").insert({
          story_id: storyId,
          user_id: user?.id || null,
          language,
        });
      } catch (error) {
        console.error("Error tracking story view:", error);
      }
    },
    [user]
  );

  const trackQuizCompletion = useCallback(
    async (monumentId: string, score: number, totalQuestions: number) => {
      if (!user) return;

      try {
        await supabase.from("quiz_completions").insert({
          monument_id: monumentId,
          user_id: user.id,
          score,
          total_questions: totalQuestions,
        });
      } catch (error) {
        console.error("Error tracking quiz completion:", error);
      }
    },
    [user]
  );

  return {
    trackMonumentView,
    trackStoryView,
    trackQuizCompletion,
  };
}
