import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Volume2, BookOpen, Eye, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type StoryRecord = {
  id: string;
  title: string;
  content: string;
  author_name: string | null;
  monument_id: string | null;
  monuments?: {
    title: string;
    location: string;
    era: string;
  } | null;
};

type Monument = {
  id: string;
  title: string;
};

// Helper function to generate summaries of different lengths
const generateSummary = (content: string, wordLimit: number): string => {
  const words = content.split(' ');
  if (words.length <= wordLimit) return content;
  return words.slice(0, wordLimit).join(' ') + '...';
};

export const StoryPreview = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [audioLoading, setAudioLoading] = useState(false);
  const [story, setStory] = useState<StoryRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [monuments, setMonuments] = useState<Monument[]>([]);
  const [selectedMonumentId, setSelectedMonumentId] = useState<string>('');

  useEffect(() => {
    const fetchMonuments = async () => {
      try {
        const { data, error } = await supabase
          .from('monuments')
          .select('id, title')
          .order('title');

        if (error) throw error;

        if (data && data.length > 0) {
          setMonuments(data);
          setSelectedMonumentId(data[0].id);
        }
      } catch (error: any) {
        toast({
          title: 'Error loading monuments',
          description: error.message,
          variant: 'destructive',
        });
      }
    };

    fetchMonuments();
  }, [toast]);

  useEffect(() => {
    if (!selectedMonumentId) return;

    const fetchStory = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('stories')
        .select('id, title, content, author_name, monument_id, monuments(title, location, era)')
        .eq('monument_id', selectedMonumentId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        toast({
          title: 'Error loading stories',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setStory(data);
      }
      setLoading(false);
    };

    fetchStory();
  }, [selectedMonumentId, toast]);

  const handleAudio = async (language: string) => {
    setAudioLoading(true);
    try {
      const text = story?.content || '';
      
      if (!text) {
        throw new Error('No story content available');
      }

      // Call the edge function to get audio from Google TTS
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, language: language === 'en' ? 'en' : 'kn' }
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate audio');
      }

      if (!data?.audioContent) {
        throw new Error('No audio data received');
      }

      // Convert base64 to blob and play
      const binaryString = atob(data.audioContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onplay = () => {
        toast({
          title: "Playing Narration",
          description: `${language === 'en' ? 'English' : 'Kannada'} narration is now playing`,
        });
      };

      audio.onended = () => {
        setAudioLoading(false);
        URL.revokeObjectURL(audioUrl);
        toast({
          title: "Narration Complete",
          description: `${language === 'en' ? 'English' : 'Kannada'} narration finished`,
        });
      };

      audio.onerror = () => {
        setAudioLoading(false);
        toast({
          title: "Error",
          description: "Failed to play audio",
          variant: "destructive",
        });
      };

      audio.play();
    } catch (error: any) {
      setAudioLoading(false);
      console.error('Audio error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate audio narration",
        variant: "destructive",
      });
    }
  };

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              AI-Powered Story Experience
            </h2>
            <p className="text-xl text-muted-foreground">
              Choose your preferred length and language for each folk story
            </p>
          </div>

          <Card className="p-8 border-0 shadow-monument bg-gradient-card">
            <div className="mb-8">
              <label className="block text-sm font-semibold text-foreground mb-2">
                Select a Monument
              </label>
              <Select value={selectedMonumentId} onValueChange={setSelectedMonumentId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a monument..." />
                </SelectTrigger>
                <SelectContent>
                  {monuments.map((monument) => (
                    <SelectItem key={monument.id} value={monument.id}>
                      {monument.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading story...
              </div>
            )}

            {!loading && !story && (
              <div className="text-center py-12 text-muted-foreground">
                No stories available yet.
              </div>
            )}

            {!loading && story && (
              <>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-foreground">
                      {story.title}
                    </h3>
                    {story.monuments?.title ? (
                      <Badge className="bg-heritage-indigo text-heritage-cream">
                        {story.monuments.title}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {story.monuments?.era ? (
                      <Badge variant="outline" className="border-heritage-gold text-heritage-terracotta">
                        {story.monuments.era}
                      </Badge>
                    ) : null}
                    {story.monuments?.location ? (
                      <Badge variant="outline" className="border-heritage-gold text-heritage-terracotta">
                        {story.monuments.location}
                      </Badge>
                    ) : null}
                    {story.author_name ? (
                      <Badge variant="outline" className="border-heritage-gold text-heritage-terracotta">
                        By {story.author_name}
                      </Badge>
                    ) : null}
                  </div>
                </div>

                <Tabs defaultValue="medium" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="short">Short (2 min)</TabsTrigger>
                    <TabsTrigger value="medium">Medium (5 min)</TabsTrigger>
                    <TabsTrigger value="detailed">Detailed (Full)</TabsTrigger>
                  </TabsList>

                  <TabsContent value="short" className="space-y-4">
                    <div className="prose prose-lg max-w-none text-foreground whitespace-pre-line">
                      <p className="leading-relaxed">{generateSummary(story.content, 75)}</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="medium" className="space-y-4">
                    <div className="prose prose-lg max-w-none text-foreground whitespace-pre-line">
                      <p className="leading-relaxed">{generateSummary(story.content, 150)}</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="detailed" className="space-y-4">
                    <div className="prose prose-lg max-w-none text-foreground whitespace-pre-line">
                      <p className="leading-relaxed">{story.content}</p>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex flex-wrap gap-4 mt-8 pt-8 border-t border-border">
                  <Button 
                    onClick={() => handleAudio('en')}
                    disabled={audioLoading || loading || !story}
                    className="bg-heritage-terracotta hover:bg-heritage-terracotta/90 text-heritage-cream"
                  >
                    {audioLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Volume2 className="mr-2 h-4 w-4" />}
                    Listen in English
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleAudio('kn')}
                    disabled={audioLoading || loading || !story}
                    className="border-heritage-indigo text-heritage-indigo hover:bg-heritage-indigo/10"
                  >
                    {audioLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Volume2 className="mr-2 h-4 w-4" />}
                    ಕನ್ನಡದಲ್ಲಿ ಕೇಳಿ
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/ar?monument=hampi')}
                    className="border-heritage-gold text-heritage-earth hover:bg-heritage-gold/10"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View in AR
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
};
