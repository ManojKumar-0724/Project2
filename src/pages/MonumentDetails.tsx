import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin, Clock, Star, Volume2, Gamepad2, Heart, ArrowLeft, Eye, PenTool } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useRating } from "@/hooks/useRating";
import { StarRating } from "@/components/StarRating";
import { cn } from "@/lib/utils";

interface Monument {
  id: string;
  title: string;
  location: string;
  image_url: string;
  description: string;
  stories_count: number;
  rating: number;
  era: string;
}

interface Story {
  id: string;
  title: string;
  content: string;
  author_name: string;
  created_at: string;
}

export default function MonumentDetails() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const monumentId = searchParams.get('id');
  const [monument, setMonument] = useState<Monument | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioLoading, setAudioLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'detailed'>('short');
  const [narrationModal, setNarrationModal] = useState(false);
  const [narrationText, setNarrationText] = useState('');
  const [narrationLanguage, setNarrationLanguage] = useState('');
  const { toast } = useToast();
  const { isFavorite, loading: favoriteLoading, toggleFavorite } = useFavorites(monumentId || '');
  const { userRating, averageRating, totalRatings, loading: ratingLoading, submitRating } = useRating(monumentId || '');

  useEffect(() => {
    if (monumentId) {
      fetchMonument();
      fetchStories();
    }
  }, [monumentId]);

  const fetchMonument = async () => {
    try {
      const { data, error } = await supabase
        .from('monuments')
        .select('*')
        .eq('id', monumentId)
        .maybeSingle();

      if (error) throw error;
      setMonument(data);
    } catch (error) {
      toast({
        title: "Error loading monument",
        description: "Failed to fetch monument details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStories = async () => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('monument_id', monumentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStories(data || []);
    } catch (error) {
      console.error('Error fetching stories:', error);
    }
  };

  const handleAudio = async (language: string) => {
    if (!monument) return;
    
    setAudioLoading(true);
    try {
      // First get AI-enhanced narration text
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text: monument.description, language }
      });

      if (error) throw error;

      const textToSpeak = data.text || monument.description;
      setNarrationText(textToSpeak);
      setNarrationLanguage(language === 'en' ? 'English' : 'Kannada');
      setNarrationModal(true);

      // Use Web Speech API for actual audio playback
      if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = language === 'en' ? 'en-US' : 'kn-IN';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        
        // Get available voices and select appropriate one
        const voices = window.speechSynthesis.getVoices();
        const langCode = language === 'en' ? 'en' : 'kn';
        const voice = voices.find(v => v.lang.startsWith(langCode)) || voices[0];
        if (voice) utterance.voice = voice;
        
        window.speechSynthesis.speak(utterance);
        
        toast({
          title: "Now Playing",
          description: `${language === 'en' ? 'English' : 'Kannada'} narration started`,
        });
      } else {
        toast({
          title: "Narration Ready",
          description: "Your browser doesn't support audio playback. Read the text below.",
          variant: "default",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate audio",
        variant: "destructive",
      });
    } finally {
      setAudioLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!monument) return;
    
    setSummaryLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('summarize-text', {
        body: { text: monument.description, length: summaryLength }
      });

      if (error) throw error;
      setSummary(data.summary);
      
      toast({
        title: "Summary Generated",
        description: "AI-powered summary is ready",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate summary",
        variant: "destructive",
      });
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleQuiz = () => {
    if (!monument) return;
    navigate(`/quiz?monumentId=${monument.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-24 flex justify-center items-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-heritage-terracotta" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!monument) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-24 text-center">
          <h2 className="text-2xl font-bold mb-4">Monument not found</h2>
          <Button onClick={() => navigate('/')}>Return Home</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-20">
        {/* Hero Section */}
        <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
          <img
            src={monument.image_url}
            alt={monument.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 pb-8">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-4 text-heritage-cream hover:bg-heritage-cream/20"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-heritage-cream mb-4">
                  {monument.title}
                </h1>
                <div className="flex flex-wrap gap-4 text-heritage-cream/90">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    <span>{monument.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span>{monument.era}</span>
                  </div>
                  <StarRating 
                    rating={averageRating} 
                    userRating={userRating}
                    totalRatings={totalRatings}
                    onRate={submitRating}
                    size="md"
                  />
                </div>
              </div>
              
              <button
                onClick={toggleFavorite}
                disabled={favoriteLoading}
                className="p-3 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-all duration-300 disabled:opacity-50 self-start"
              >
                <Heart
                  className={cn(
                    "w-6 h-6 transition-all duration-300",
                    isFavorite ? "fill-heritage-terracotta text-heritage-terracotta" : "text-foreground"
                  )}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="container mx-auto px-4 py-8 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              <Tabs defaultValue="description" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="summary">AI Summary</TabsTrigger>
                  <TabsTrigger value="stories">Stories ({stories.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="description" className="space-y-4">
                  <Card className="p-6">
                    <p className="text-lg leading-relaxed text-foreground whitespace-pre-line">
                      {monument.description}
                    </p>
                  </Card>
                </TabsContent>
                
                <TabsContent value="summary" className="space-y-4">
                  <Card className="p-6">
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant={summaryLength === 'short' ? 'default' : 'outline'}
                          onClick={() => setSummaryLength('short')}
                        >
                          Short
                        </Button>
                        <Button
                          size="sm"
                          variant={summaryLength === 'medium' ? 'default' : 'outline'}
                          onClick={() => setSummaryLength('medium')}
                        >
                          Medium
                        </Button>
                        <Button
                          size="sm"
                          variant={summaryLength === 'detailed' ? 'default' : 'outline'}
                          onClick={() => setSummaryLength('detailed')}
                        >
                          Detailed
                        </Button>
                        <Button
                          onClick={handleSummarize}
                          disabled={summaryLoading}
                          className="ml-auto"
                        >
                          {summaryLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Generate Summary'
                          )}
                        </Button>
                      </div>
                      
                      {summary && (
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-foreground whitespace-pre-line">{summary}</p>
                        </div>
                      )}
                    </div>
                  </Card>
                </TabsContent>
                
                <TabsContent value="stories" className="space-y-4">
                  {stories.length === 0 ? (
                    <Card className="p-8 text-center">
                      <p className="text-muted-foreground">No stories yet. Be the first to contribute!</p>
                      <Button 
                        className="mt-4"
                        onClick={() => navigate(`/contribute?monumentId=${monument.id}`)}
                      >
                        <PenTool className="mr-2 h-4 w-4" />
                        Contribute a Story
                      </Button>
                    </Card>
                  ) : (
                    stories.map((story) => (
                      <Card key={story.id} className="p-6 space-y-3">
                        <h3 className="text-xl font-semibold text-foreground">{story.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          By {story.author_name || 'Anonymous'} • {new Date(story.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-foreground leading-relaxed">{story.content}</p>
                      </Card>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="p-6 space-y-4">
                <h3 className="text-xl font-semibold text-foreground">Interactive Features</h3>
                
                <div className="space-y-3">
                  <Button
                    onClick={() => handleAudio('en')}
                    disabled={audioLoading}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    {audioLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Volume2 className="mr-2 h-4 w-4" />}
                    Listen in English
                  </Button>
                  
                  <Button
                    onClick={() => handleAudio('kn')}
                    disabled={audioLoading}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    {audioLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Volume2 className="mr-2 h-4 w-4" />}
                    Listen in Kannada
                  </Button>
                  
                  <Button
                    onClick={handleQuiz}
                    className="w-full justify-start bg-heritage-terracotta hover:bg-heritage-terracotta/90 text-heritage-cream"
                  >
                    <Gamepad2 className="mr-2 h-4 w-4" />
                    Take Quiz
                  </Button>
                  
                  <Button
                    onClick={() => navigate(`/ar?monument=${monument.id}`)}
                    className="w-full justify-start"
                    variant="secondary"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View in AR
                  </Button>

                  <Button
                    onClick={() => navigate(`/contribute?monumentId=${monument.id}`)}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <PenTool className="mr-2 h-4 w-4" />
                    Contribute Story
                  </Button>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-4">Location</h3>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  <iframe
                    title="Monument Location"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(monument.title + ' ' + monument.location)}`}
                  />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  📍 {monument.location}
                </p>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Narration Modal */}
      <Dialog open={narrationModal} onOpenChange={(open) => {
        setNarrationModal(open);
        if (!open && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-heritage-terracotta" />
              {narrationLanguage} Narration
            </DialogTitle>
            <DialogDescription>
              AI-generated narration for {monument?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-foreground whitespace-pre-line leading-relaxed">
              {narrationText}
            </p>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => {
                if ('speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                  const utterance = new SpeechSynthesisUtterance(narrationText);
                  utterance.lang = narrationLanguage === 'English' ? 'en-US' : 'kn-IN';
                  utterance.rate = 0.9;
                  window.speechSynthesis.speak(utterance);
                }
              }}
              className="flex-1"
            >
              <Volume2 className="mr-2 h-4 w-4" />
              Play Again
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if ('speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                }
              }}
              className="flex-1"
            >
              Stop
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
