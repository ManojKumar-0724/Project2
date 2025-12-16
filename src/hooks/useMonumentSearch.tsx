import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Monument {
  id: string;
  title: string;
  location: string;
  era: string;
  image_url: string;
  description: string | null;
  rating: number;
  stories_count: number;
}

interface SearchFilters {
  query: string;
  era: string;
  location: string;
}

export function useMonumentSearch() {
  const [monuments, setMonuments] = useState<Monument[]>([]);
  const [filteredMonuments, setFilteredMonuments] = useState<Monument[]>([]);
  const [eras, setEras] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMonuments();
  }, []);

  const fetchMonuments = async () => {
    try {
      const { data, error } = await supabase
        .from("monuments")
        .select("*")
        .order("title");

      if (error) throw error;

      setMonuments(data || []);
      setFilteredMonuments(data || []);

      // Extract unique eras and locations
      const uniqueEras = [...new Set(data?.map((m) => m.era) || [])];
      const uniqueLocations = [...new Set(data?.map((m) => m.location) || [])];
      setEras(uniqueEras);
      setLocations(uniqueLocations);
    } catch (error) {
      console.error("Error fetching monuments:", error);
    } finally {
      setLoading(false);
    }
  };

  const search = useCallback(
    async (filters: SearchFilters) => {
      setLoading(true);
      try {
        let filtered = [...monuments];

        // Filter by era
        if (filters.era) {
          filtered = filtered.filter((m) => m.era === filters.era);
        }

        // Filter by location
        if (filters.location) {
          filtered = filtered.filter((m) => m.location === filters.location);
        }

        // Text search
        if (filters.query) {
          const queryLower = filters.query.toLowerCase();

          // First, search in monuments
          const monumentMatches = filtered.filter(
            (m) =>
              m.title.toLowerCase().includes(queryLower) ||
              m.location.toLowerCase().includes(queryLower) ||
              m.era.toLowerCase().includes(queryLower) ||
              m.description?.toLowerCase().includes(queryLower)
          );

          // Then, search in stories and get related monument IDs
          const { data: storyMatches } = await supabase
            .from("stories")
            .select("monument_id")
            .or(`title.ilike.%${filters.query}%,content.ilike.%${filters.query}%,author_name.ilike.%${filters.query}%`);

          const storyMonumentIds = new Set(storyMatches?.map((s) => s.monument_id) || []);

          // Combine results (monuments that match directly OR have matching stories)
          const allMatchIds = new Set([
            ...monumentMatches.map((m) => m.id),
            ...Array.from(storyMonumentIds),
          ]);

          filtered = filtered.filter((m) => allMatchIds.has(m.id));
        }

        setFilteredMonuments(filtered);
      } catch (error) {
        console.error("Error searching monuments:", error);
      } finally {
        setLoading(false);
      }
    },
    [monuments]
  );

  return {
    monuments: filteredMonuments,
    allMonuments: monuments,
    eras,
    locations,
    loading,
    search,
    refetch: fetchMonuments,
  };
}
