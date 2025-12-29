import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BackToHome } from "@/components/BackToHome";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Shield, Plus, Trash2, Edit, Users, Landmark, BookOpen, BarChart3, Check, XCircle } from "lucide-react";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";

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
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  content: string;
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
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { toast } = useToast();

  const [monuments, setMonuments] = useState<Monument[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [pendingStories, setPendingStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [moderating, setModerating] = useState(false);
  const [storyDialogOpen, setStoryDialogOpen] = useState(false);
  const [creatingStory, setCreatingStory] = useState(false);

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

  const [storyForm, setStoryForm] = useState({
    title: "",
    content: "",
    author_name: "",
    monument_id: "",
    status: "approved" as "approved" | "pending",
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      // Do not hard-redirect repeatedly; let UI render gated view below.
      return;
    }
  }, [authLoading, user]);

  // Avoid auto-redirect; show gated UI when not admin

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
      .select("id, title, author_name, monument_id, created_at, status, rejection_reason, content, monuments(title)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      const storiesData = data as Story[];
      setStories(storiesData);
      setPendingStories(storiesData.filter((story) => story.status === "pending"));
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

  const updateStoryStatus = async (
    id: string,
    status: "approved" | "rejected",
    rejection_reason?: string
  ) => {
    setModerating(true);
    try {
      const { error } = await supabase
        .from("stories")
        .update({
          status,
          rejection_reason: status === "rejected" ? rejection_reason || "Rejected by admin" : null,
          moderated_at: new Date().toISOString(),
          moderated_by: user?.id || null,
        })
        .eq("id", id);

      if (error) throw error;

      toast({ title: status === "approved" ? "Story approved" : "Story rejected" });
      fetchStories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update story status",
        variant: "destructive",
      });
    } finally {
      setModerating(false);
    }
  };

  const handleCreateStory = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in again", variant: "destructive" });
      return;
    }

    if (!storyForm.title || !storyForm.content || !storyForm.monument_id) {
      toast({
        title: "Missing fields",
        description: "Title, content, and monument are required",
        variant: "destructive",
      });
      return;
    }

    setCreatingStory(true);
    try {
      const { error } = await supabase.from("stories").insert({
        title: storyForm.title,
        content: storyForm.content,
        author_name: storyForm.author_name || null,
        monument_id: storyForm.monument_id,
        status: storyForm.status,
        user_id: user.id,
      });

      if (error) throw error;

      toast({ title: "Story created" });
      setStoryDialogOpen(false);
      setStoryForm({ title: "", content: "", author_name: "", monument_id: "", status: "approved" });
      fetchStories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create story",
        variant: "destructive",
      });
    } finally {
      setCreatingStory(false);
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

  const statusBadgeClass = (status: Story["status"]) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-muted text-foreground";
    }
  };

  if (loading || roleLoading || authLoading) {
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

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container mx-auto px-4 py-24">
          <Card className="max-w-2xl mx-auto p-8 text-center space-y-6">
            <Shield className="w-10 h-10 mx-auto text-heritage-terracotta" />
            <h1 className="text-3xl font-bold text-foreground">Sign in required</h1>
            <p className="text-muted-foreground">Please sign in to access the admin dashboard.</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate('/auth')}>Go to Sign In</Button>
              <Button variant="outline" onClick={() => navigate('/')}>Back to Home</Button>
            </div>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container mx-auto px-4 py-24">
          <Card className="max-w-2xl mx-auto p-8 text-center space-y-6">
            <Shield className="w-10 h-10 mx-auto text-heritage-terracotta" />
            <h1 className="text-3xl font-bold text-foreground">Access denied</h1>
            <p className="text-muted-foreground">Your account does not have admin privileges.</p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => navigate('/')}>Back to Home</Button>
            </div>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-24">
        <BackToHome className="mb-6" />
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
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="monuments">Monuments</TabsTrigger>
            <TabsTrigger value="stories">Stories</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
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
            <Card className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <BookOpen className="h-5 w-5" /> Stories & Contributions
                </h2>
                <Dialog open={storyDialogOpen} onOpenChange={setStoryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-heritage-terracotta hover:bg-heritage-terracotta/90">
                      <Plus className="mr-2 h-4 w-4" /> Add Story
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add Story</DialogTitle>
                      <DialogDescription>Create or fast-track an approved story.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Monument *</Label>
                        <Select
                          value={storyForm.monument_id}
                          onValueChange={(value) => setStoryForm({ ...storyForm, monument_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a monument" />
                          </SelectTrigger>
                          <SelectContent>
                            {monuments.map((mon) => (
                              <SelectItem key={mon.id} value={mon.id}>
                                {mon.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Title *</Label>
                        <Input
                          value={storyForm.title}
                          onChange={(e) => setStoryForm({ ...storyForm, title: e.target.value })}
                          placeholder="Story title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Author</Label>
                        <Input
                          value={storyForm.author_name}
                          onChange={(e) => setStoryForm({ ...storyForm, author_name: e.target.value })}
                          placeholder="Author name (optional)"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Content *</Label>
                        <Textarea
                          value={storyForm.content}
                          onChange={(e) => setStoryForm({ ...storyForm, content: e.target.value })}
                          rows={8}
                          placeholder="Enter the full story..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                          value={storyForm.status}
                          onValueChange={(value) => setStoryForm({ ...storyForm, status: value as "approved" | "pending" })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setStoryDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleCreateStory} disabled={creatingStory}>
                        {creatingStory ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Create
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-heritage-terracotta" />
                  <h3 className="text-lg font-semibold">Pending approvals ({pendingStories.length})</h3>
                </div>
                {pendingStories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No pending submissions.</p>
                ) : (
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
                        {pendingStories.map((story) => (
                          <TableRow key={story.id}>
                            <TableCell className="font-medium">{story.title}</TableCell>
                            <TableCell>{story.author_name || "Anonymous"}</TableCell>
                            <TableCell>{story.monuments?.title || "Unknown"}</TableCell>
                            <TableCell>{new Date(story.created_at).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={moderating}
                                onClick={() => updateStoryStatus(story.id, "approved")}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={moderating}
                                onClick={() => {
                                  const reason = prompt("Add an optional rejection reason", "Not aligned with guidelines");
                                  updateStoryStatus(story.id, "rejected", reason || undefined);
                                }}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-heritage-indigo" />
                  <h3 className="text-lg font-semibold">All stories</h3>
                </div>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Monument</TableHead>
                        <TableHead>Status</TableHead>
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
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusBadgeClass(story.status)}`}>
                              {story.status}
                            </span>
                          </TableCell>
                          <TableCell>{new Date(story.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={moderating}
                              onClick={() => updateStoryStatus(story.id, "approved")}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
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
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics Dashboard
              </h2>
              <AnalyticsDashboard />
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
