import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PenTool, ImagePlus, X } from "lucide-react";

export default function Contribute() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselectedMonumentId = searchParams.get('monumentId');
  const [monuments, setMonuments] = useState<any[]>([]);
  const [selectedMonument, setSelectedMonument] = useState(preselectedMonumentId || '');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [monumentsLoading, setMonumentsLoading] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchMonuments();
  }, []);

  useEffect(() => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to contribute stories",
      });
      navigate('/auth');
    }
  }, [user, navigate]);

  const fetchMonuments = async () => {
    try {
      const { data, error } = await supabase
        .from('monuments')
        .select('id, title')
        .order('title');

      if (error) throw error;
      setMonuments(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load monuments",
        variant: "destructive",
      });
    } finally {
      setMonumentsLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user) return null;

    setUploading(true);

    try {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("story-images")
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("story-images")
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error("Image upload error:", error);
      toast({
        title: "Image upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to contribute stories",
      });
      navigate('/auth');
      return;
    }

    if (!selectedMonument || !title || !content) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (content.length < 100) {
      toast({
        title: "Content too short",
        description: "Please write at least 100 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Upload image if present
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      const { error } = await supabase
        .from('stories')
        .insert({
          monument_id: selectedMonument,
          user_id: user.id,
          title,
          content,
          author_name: authorName || 'Anonymous',
          image_url: imageUrl
        });

      if (error) throw error;

      toast({
        title: "Story submitted!",
        description: "Thank you for contributing to our cultural heritage.",
      });

      // Reset form
      setTitle('');
      setContent('');
      setAuthorName('');
      setImageFile(null);
      setImagePreview(null);
      if (!preselectedMonumentId) {
        setSelectedMonument('');
      }

      // Navigate to the monument details page
      navigate(`/monument?id=${selectedMonument}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit story",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (monumentsLoading) {
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

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-24">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <PenTool className="w-10 h-10 text-heritage-terracotta" />
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                Contribute a Story
              </h1>
            </div>
            <p className="text-xl text-muted-foreground">
              Share your knowledge and experiences about cultural monuments
            </p>
          </div>

          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="monument">Monument *</Label>
                <Select
                  value={selectedMonument}
                  onValueChange={setSelectedMonument}
                  disabled={!!preselectedMonumentId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a monument" />
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

              <div className="space-y-2">
                <Label htmlFor="title">Story Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a captivating title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="authorName">Your Name (optional)</Label>
                <Input
                  id="authorName"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Leave blank for 'Anonymous'"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Story Content *</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share your story, memories, historical facts, or cultural insights..."
                  className="min-h-[300px]"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  {content.length}/100 minimum characters
                </p>
              </div>

              {/* Image Upload Section */}
              <div className="space-y-2">
                <Label>Story Image (optional)</Label>
                <div className="flex flex-col gap-4">
                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-full max-h-64 rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border rounded-lg hover:border-heritage-terracotta hover:bg-heritage-terracotta/5 transition-colors cursor-pointer"
                    >
                      <ImagePlus className="w-10 h-10 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">
                        Click to upload an image
                      </span>
                      <span className="text-xs text-muted-foreground">
                        PNG, JPG up to 5MB
                      </span>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={loading || uploading}
                  className="flex-1 bg-heritage-terracotta hover:bg-heritage-terracotta/90"
                >
                  {loading || uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {uploading ? "Uploading image..." : "Submitting..."}
                    </>
                  ) : (
                    'Submit Story'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>

          <div className="mt-8 p-6 bg-muted rounded-lg">
            <h3 className="font-semibold text-foreground mb-2">Contribution Guidelines</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Share authentic stories and verified historical information</li>
              <li>Be respectful of cultural sensitivities and traditions</li>
              <li>Include personal experiences or oral histories when relevant</li>
              <li>Cite sources if sharing historical facts</li>
              <li>Upload relevant images to enhance your story</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
