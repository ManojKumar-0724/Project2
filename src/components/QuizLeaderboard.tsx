import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Trophy, Medal, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LeaderboardEntry {
  user_id: string;
  user_email: string;
  monument_id: string;
  monument_title: string;
  average_score: number;
  total_attempts: number;
  highest_score: number;
  completed_at: string;
}

interface MonumentLeaderboard {
  monument_id: string;
  monument_title: string;
  entries: LeaderboardEntry[];
}

export const QuizLeaderboard = () => {
  const [loading, setLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState<MonumentLeaderboard[]>([]);
  const [allTimeLeaders, setAllTimeLeaders] = useState<LeaderboardEntry[]>([]);
  const [selectedMonument, setSelectedMonument] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const fetchLeaderboardData = async () => {
    setLoading(true);
    try {
      // Try using the views first (faster and simpler)
      const { data: allTimeData, error: allTimeError } = await (supabase as any)
        .from("leaderboard_all_time")
        .select("*")
        .limit(100);

      const { data: byMonumentData, error: byMonumentError } = await (supabase as any)
        .from("leaderboard_by_monument")
        .select("*")
        .limit(500);

      // If views don't exist, fall back to raw query
      let completions = allTimeData || [];
      let byMonumentEntries = byMonumentData || [];

      if ((allTimeError || !allTimeData) && (byMonumentError || !byMonumentData)) {
        // Views don't exist, fetch from raw table
        console.warn("Leaderboard views not found, fetching from raw table", allTimeError, byMonumentError);

        const { data: rawCompletions, error: rawError } = await (supabase as any)
          .from("quiz_completions")
          .select("id, user_id, monument_id, score, total_questions, completed_at");

        if (rawError) {
          console.error("Error fetching quiz completions:", rawError);
          toast({
            title: "Error",
            description: "Make sure to run the LEADERBOARD_SETUP.sql script in Supabase SQL Editor",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        completions = rawCompletions || [];

        // Process raw data
        const monumentMap = new Map<string, LeaderboardEntry[]>();
        const userScoresMap = new Map<string, { total: number; count: number; highest: number; lastDate: string; email: string }>();

        (completions || []).forEach((completion: any) => {
          const monumentId = completion.monument_id;
          const userId = completion.user_id;
          const score = completion.score;
          const totalQuestions = completion.total_questions;
          const scorePercentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
          const completedAt = completion.completed_at;

          const key = `${monumentId}-${userId}`;
          const userEmail = `User ${userId.substring(0, 8)}`;

          if (!userScoresMap.has(key)) {
            userScoresMap.set(key, {
              total: 0,
              count: 0,
              highest: scorePercentage,
              lastDate: completedAt,
              email: userEmail,
            });
          }

          const userScore = userScoresMap.get(key)!;
          userScore.total += scorePercentage;
          userScore.count += 1;
          userScore.highest = Math.max(userScore.highest, scorePercentage);
          userScore.lastDate = completedAt;

          if (!monumentMap.has(monumentId)) {
            monumentMap.set(monumentId, []);
          }
        });

        // This path is deprecated - we use views now
        setLeaderboardData([]);
        setAllTimeLeaders([]);
        setLoading(false);
        return;
      }

      // Process view data for all-time leaderboard
      const allTimeLeaders: LeaderboardEntry[] = (allTimeData || []).map((entry: any) => ({
        user_id: entry.user_id,
        user_email: entry.user_email || entry.user_name,
        monument_id: "",
        monument_title: "Overall",
        average_score: entry.average_score || 0,
        total_attempts: entry.total_attempts || 0,
        highest_score: entry.highest_score || 0,
        completed_at: entry.last_completed_at || "",
      }));

      // Process view data for by-monument leaderboard
      const monumentMap = new Map<string, MonumentLeaderboard>();
      (byMonumentData || []).forEach((entry: any) => {
        const key = entry.monument_id;
        if (!monumentMap.has(key)) {
          monumentMap.set(key, {
            monument_id: entry.monument_id,
            monument_title: entry.monument_title || "Unknown",
            entries: [],
          });
        }

        const leaderboardEntry: LeaderboardEntry = {
          user_id: entry.user_id,
          user_email: entry.user_email || entry.user_name,
          monument_id: entry.monument_id,
          monument_title: entry.monument_title || "Unknown",
          average_score: entry.average_score || 0,
          total_attempts: entry.total_attempts || 0,
          highest_score: entry.highest_score || 0,
          completed_at: entry.last_completed_at || "",
        };

        monumentMap.get(key)!.entries.push(leaderboardEntry);
      });

      setAllTimeLeaders(allTimeLeaders);
      setLeaderboardData(Array.from(monumentMap.values()));

      if (monumentMap.size > 0) {
        setSelectedMonument(Array.from(monumentMap.keys())[0]);
      }
    } catch (error: any) {
      console.error("Error fetching leaderboard:", error);
      toast({
        title: "Error Loading Leaderboard",
        description: `${error.message || "Failed to load leaderboard data"}. Please run the LEADERBOARD_SETUP.sql script in Supabase.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-heritage-terracotta" />
          </div>
        </div>
      </section>
    );
  }

  const currentMonumentLeaderboard = leaderboardData.find(
    (l) => l.monument_id === selectedMonument
  );

  const getMedalIcon = (position: number) => {
    if (position === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (position === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (position === 2) return <Medal className="w-5 h-5 text-orange-600" />;
    return null;
  };

  const getPositionBadge = (position: number) => {
    if (position === 0) return "bg-yellow-100 text-yellow-800";
    if (position === 1) return "bg-gray-100 text-gray-800";
    if (position === 2) return "bg-orange-100 text-orange-800";
    return "bg-muted text-foreground";
  };

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 flex items-center justify-center gap-3">
            <Trophy className="w-10 h-10 text-heritage-gold" />
            Quiz Leaderboard
          </h2>
          <p className="text-xl text-muted-foreground">
            See how you rank among other quiz takers
          </p>
        </div>

        <Tabs defaultValue="all-time" className="max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="all-time">All Time</TabsTrigger>
            <TabsTrigger value="by-monument">By Monument</TabsTrigger>
          </TabsList>

          <TabsContent value="all-time">
            <Card className="overflow-hidden">
              {allTimeLeaders.length === 0 ? (
                <div className="p-12 text-center">
                  <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No quiz attempts yet. Be the first to join the leaderboard!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Rank</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Player</th>
                        <th className="px-6 py-3 text-center text-sm font-semibold">Average Score</th>
                        <th className="px-6 py-3 text-center text-sm font-semibold">Highest Score</th>
                        <th className="px-6 py-3 text-center text-sm font-semibold">Attempts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allTimeLeaders.map((entry, index) => (
                        <tr key={entry.user_id} className="border-b hover:bg-muted/50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {getMedalIcon(index)}
                              <Badge className={getPositionBadge(index)}>{index + 1}</Badge>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-foreground">
                              {entry.user_email.split("@")[0]}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-block px-3 py-1 rounded-full bg-heritage-terracotta/10 text-heritage-terracotta font-semibold">
                              {entry.average_score}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-medium">{entry.highest_score}%</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm text-muted-foreground">{entry.total_attempts}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="by-monument">
            <div className="space-y-6">
              {leaderboardData.length === 0 ? (
                <Card className="p-12 text-center">
                  <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No quiz attempts yet. Take a quiz to appear on the leaderboard!</p>
                </Card>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {leaderboardData.map((monument) => (
                      <button
                        key={monument.monument_id}
                        onClick={() => setSelectedMonument(monument.monument_id)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          selectedMonument === monument.monument_id
                            ? "bg-heritage-terracotta text-white"
                            : "bg-muted text-foreground hover:bg-muted/80"
                        }`}
                      >
                        {monument.monument_title}
                      </button>
                    ))}
                  </div>

                  {currentMonumentLeaderboard && (
                    <Card className="overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-muted border-b">
                            <tr>
                              <th className="px-6 py-3 text-left text-sm font-semibold">Rank</th>
                              <th className="px-6 py-3 text-left text-sm font-semibold">Player</th>
                              <th className="px-6 py-3 text-center text-sm font-semibold">Average Score</th>
                              <th className="px-6 py-3 text-center text-sm font-semibold">Highest Score</th>
                              <th className="px-6 py-3 text-center text-sm font-semibold">Attempts</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentMonumentLeaderboard.entries.map((entry, index) => (
                              <tr key={`${entry.monument_id}-${entry.user_id}`} className="border-b hover:bg-muted/50">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    {getMedalIcon(index)}
                                    <Badge className={getPositionBadge(index)}>{index + 1}</Badge>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm font-medium text-foreground">
                                    {entry.user_email.split("@")[0]}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="inline-block px-3 py-1 rounded-full bg-heritage-terracotta/10 text-heritage-terracotta font-semibold">
                                    {entry.average_score}%
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="text-sm font-medium">{entry.highest_score}%</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="text-sm text-muted-foreground">{entry.total_attempts}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  )}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};
