import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Eye, BookOpen, Trophy, TrendingUp, Globe, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AnalyticsData {
  totalMonumentViews: number;
  totalStoryViews: number;
  totalQuizCompletions: number;
  averageQuizScore: number;
  topMonuments: { name: string; views: number }[];
  topStories: { name: string; views: number }[];
  languageDistribution: { name: string; value: number }[];
  viewsTrend: { date: string; monuments: number; stories: number }[];
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "#8884d8", "#82ca9d"];

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch monument views
      const { data: monumentViews, error: mvError } = await supabase
        .from("monument_views")
        .select("monument_id, viewed_at");

      if (mvError) throw mvError;

      // Fetch story views
      const { data: storyViews, error: svError } = await supabase
        .from("story_views")
        .select("story_id, language, viewed_at");

      if (svError) throw svError;

      // Fetch quiz completions
      const { data: quizCompletions, error: qcError } = await supabase
        .from("quiz_completions")
        .select("score, total_questions, completed_at");

      if (qcError) throw qcError;

      // Fetch monuments for names
      const { data: monuments } = await supabase
        .from("monuments")
        .select("id, title");

      // Fetch stories for names
      const { data: stories } = await supabase
        .from("stories")
        .select("id, title");

      // Process monument views
      const monumentViewCounts: Record<string, number> = {};
      monumentViews?.forEach((v) => {
        monumentViewCounts[v.monument_id] = (monumentViewCounts[v.monument_id] || 0) + 1;
      });

      const topMonuments = Object.entries(monumentViewCounts)
        .map(([id, views]) => ({
          name: monuments?.find((m) => m.id === id)?.title || "Unknown",
          views,
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);

      // Process story views
      const storyViewCounts: Record<string, number> = {};
      const languageCounts: Record<string, number> = {};
      storyViews?.forEach((v) => {
        storyViewCounts[v.story_id] = (storyViewCounts[v.story_id] || 0) + 1;
        const lang = v.language || "en";
        languageCounts[lang] = (languageCounts[lang] || 0) + 1;
      });

      const topStories = Object.entries(storyViewCounts)
        .map(([id, views]) => ({
          name: stories?.find((s) => s.id === id)?.title || "Unknown",
          views,
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);

      const languageDistribution = Object.entries(languageCounts).map(([name, value]) => ({
        name: getLanguageName(name),
        value,
      }));

      // Process quiz completions
      const avgScore =
        quizCompletions && quizCompletions.length > 0
          ? quizCompletions.reduce((sum, q) => sum + (q.score / q.total_questions) * 100, 0) /
            quizCompletions.length
          : 0;

      // Process views trend (last 7 days)
      const today = new Date();
      const viewsTrend = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];

        const monumentCount =
          monumentViews?.filter((v) => v.viewed_at.startsWith(dateStr)).length || 0;
        const storyCount =
          storyViews?.filter((v) => v.viewed_at.startsWith(dateStr)).length || 0;

        viewsTrend.push({
          date: date.toLocaleDateString("en-US", { weekday: "short" }),
          monuments: monumentCount,
          stories: storyCount,
        });
      }

      setData({
        totalMonumentViews: monumentViews?.length || 0,
        totalStoryViews: storyViews?.length || 0,
        totalQuizCompletions: quizCompletions?.length || 0,
        averageQuizScore: Math.round(avgScore),
        topMonuments,
        topStories,
        languageDistribution,
        viewsTrend,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLanguageName = (code: string): string => {
    const languages: Record<string, string> = {
      en: "English",
      hi: "Hindi",
      ta: "Tamil",
      te: "Telugu",
      kn: "Kannada",
      ml: "Malayalam",
      mr: "Marathi",
      bn: "Bengali",
      gu: "Gujarati",
      pa: "Punjabi",
    };
    return languages[code] || code;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-center text-muted-foreground">Failed to load analytics</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monument Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalMonumentViews}</div>
            <p className="text-xs text-muted-foreground">Total monument page views</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Story Views</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalStoryViews}</div>
            <p className="text-xs text-muted-foreground">Total story views</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Quiz Completions</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalQuizCompletions}</div>
            <p className="text-xs text-muted-foreground">Total quizzes completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Quiz Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.averageQuizScore}%</div>
            <p className="text-xs text-muted-foreground">Average quiz performance</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trend" className="w-full">
        <TabsList>
          <TabsTrigger value="trend">Views Trend</TabsTrigger>
          <TabsTrigger value="monuments">Top Monuments</TabsTrigger>
          <TabsTrigger value="stories">Top Stories</TabsTrigger>
          <TabsTrigger value="languages">Languages</TabsTrigger>
        </TabsList>

        <TabsContent value="trend" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Views Trend (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.viewsTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="monuments"
                      stroke="hsl(var(--primary))"
                      name="Monument Views"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="stories"
                      stroke="hsl(var(--secondary))"
                      name="Story Views"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monuments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Most Viewed Monuments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {data.topMonuments.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.topMonuments} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={150} />
                      <Tooltip />
                      <Bar dataKey="views" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No monument views recorded yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stories" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Most Viewed Stories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {data.topStories.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.topStories} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={150} />
                      <Tooltip />
                      <Bar dataKey="views" fill="hsl(var(--secondary))" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No story views recorded yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="languages" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Language Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {data.languageDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.languageDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {data.languageDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No language data recorded yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
