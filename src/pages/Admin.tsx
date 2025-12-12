import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, Plus, Trash2, Edit, Users, Landmark, BookOpen } from "lucide-react";

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

interface Story {
  id: string;
  title: string;
  author_name: string | null;
  monument_id: string;
  created_at: string;
  monuments?: { title: string };
}

interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  roles: string[];
}

export default function Admin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { toast } = useToast();

  const [monuments, setMonuments] = useState<Monument[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Monument form state
  const [monumentDialogOpen, setMonumentDialogOpen] = useState(false);
  const [editingMonument, setEditingMonument] = useState<Monument | null>(null);
  const [monumentForm, setMonumentForm] = useState({
    title: "",
    location: "",
    era: "",
    image_url: "",
    description: "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin dashboard",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [roleLoading, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchMonuments(), fetchStories()]);
    setLoading(false);
  };

  const fetchMonuments = async () => {
    const { data, error } = await supabase
      .from("monuments")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setMonuments(data);
    }
  };

  const fetchStories = async () => {
    const { data, error } = await supabase
      .from("stories")
      .select("id, title, author_name, monument_id, created_at, monuments(title)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setStories(data as Story[]);
    }
  };

  const handleMonumentSubmit = async () => {
    if (!monumentForm.title || !monumentForm.location || !monumentForm.era || !monumentForm.image_url) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      if (editingMonument) {
        const { error } = await supabase
          .from("monuments")
          .update({
            ...monumentForm,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingMonument.id);

        if (error) throw error;

        toast({ title: "Monument updated successfully" });
      } else {
        const { error } = await supabase
          .from("monuments")
          .insert(monumentForm);

        if (error) throw error;

        toast({ title: "Monument created successfully" });
      }

      setMonumentDialogOpen(false);
      setEditingMonument(null);
      setMonumentForm({ title: "", location: "", era: "", image_url: "", description: "" });
      fetchMonuments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save monument",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMonument = async (id: string) => {
    if (!confirm("Are you sure you want to delete this monument?")) return;

    try {
      const { error } = await supabase.from("monuments").delete().eq("id", id);
      if (error) throw error;

      toast({ title: "Monument deleted" });
      fetchMonuments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete monument",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this story?")) return;

    try {
      const { error } = await supabase.from("stories").delete().eq("id", id);
      if (error) throw error;

      toast({ title: "Story deleted" });
      fetchStories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete story",
        variant: "destructive",
      });
    }
  };

  const openEditMonument = (monument: Monument) => {
    setEditingMonument(monument);
    setMonumentForm({
      title: monument.title,
      location: monument.location,
      era: monument.era,
      image_url: monument.image_url,
      description: monument.description || "",
    });
    setMonumentDialogOpen(true);
  };

  if (loading || roleLoading) {
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

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-24">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-10 h-10 text-heritage-terracotta" />
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Manage monuments, stories, and users
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-heritage-terracotta/10 rounded-lg">
                <Landmark className="w-6 h-6 text-heritage-terracotta" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{monuments.length}</p>
                <p className="text-muted-foreground">Monuments</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-heritage-gold/10 rounded-lg">
                <BookOpen className="w-6 h-6 text-heritage-gold" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stories.length}</p>
                <p className="text-muted-foreground">Stories</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <Users className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">Admin</p>
                <p className="text-muted-foreground">Your Role</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="monuments" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="monuments">Monuments</TabsTrigger>
            <TabsTrigger value="stories">Stories</TabsTrigger>
          </TabsList>

          <TabsContent value="monuments">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-foreground">Manage Monuments</h2>
                <Dialog open={monumentDialogOpen} onOpenChange={(open) => {
                  setMonumentDialogOpen(open);
                  if (!open) {
                    setEditingMonument(null);
                    setMonumentForm({ title: "", location: "", era: "", image_url: "", description: "" });
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button className="bg-heritage-terracotta hover:bg-heritage-terracotta/90">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Monument
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingMonument ? "Edit Monument" : "Add New Monument"}
                      </DialogTitle>
                      <DialogDescription>
                        Fill in the details for the monument
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Title *</Label>
                        <Input
                          value={monumentForm.title}
                          onChange={(e) => setMonumentForm({ ...monumentForm, title: e.target.value })}
                          placeholder="Monument name"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Location *</Label>
                          <Input
                            value={monumentForm.location}
                            onChange={(e) => setMonumentForm({ ...monumentForm, location: e.target.value })}
                            placeholder="City, State"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Era *</Label>
                          <Input
                            value={monumentForm.era}
                            onChange={(e) => setMonumentForm({ ...monumentForm, era: e.target.value })}
                            placeholder="e.g., 14th Century"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Image URL *</Label>
                        <Input
                          value={monumentForm.image_url}
                          onChange={(e) => setMonumentForm({ ...monumentForm, image_url: e.target.value })}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={monumentForm.description}
                          onChange={(e) => setMonumentForm({ ...monumentForm, description: e.target.value })}
                          placeholder="Describe the monument's history and significance..."
                          rows={5}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setMonumentDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleMonumentSubmit} disabled={saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {editingMonument ? "Update" : "Create"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Era</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Stories</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monuments.map((monument) => (
                      <TableRow key={monument.id}>
                        <TableCell className="font-medium">{monument.title}</TableCell>
                        <TableCell>{monument.location}</TableCell>
                        <TableCell>{monument.era}</TableCell>
                        <TableCell>{monument.rating}</TableCell>
                        <TableCell>{monument.stories_count}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditMonument(monument)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteMonument(monument.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="stories">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-6">Moderate Stories</h2>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Monument</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stories.map((story) => (
                      <TableRow key={story.id}>
                        <TableCell className="font-medium">{story.title}</TableCell>
                        <TableCell>{story.author_name || "Anonymous"}</TableCell>
                        <TableCell>{story.monuments?.title || "Unknown"}</TableCell>
                        <TableCell>{new Date(story.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteStory(story.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
