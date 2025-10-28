import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { LogOut, Plus, Edit, Trash2 } from "lucide-react";

interface Article {
  id: string;
  title: string;
  category: string;
  published_at: string;
  is_featured: boolean;
  is_breaking: boolean;
}

export const Admin = () => {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    category: "world",
    description: "",
    content: "",
    image_url: "",
    author: "GlobalView Staff",
    tags: "",
    is_featured: false,
    is_breaking: false,
    is_editors_pick: false,
  });

  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    fetchArticles();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      }
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      // Check if user has admin or editor role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const hasAccess = roles?.some(
        (r) => r.role === "admin" || r.role === "editor"
      );

      if (!hasAccess) {
        toast.error("You don't have permission to access the admin dashboard");
        navigate("/");
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error("Auth check error:", error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async () => {
    const { data } = await supabase
      .from("articles")
      .select("id, title, category, published_at, is_featured, is_breaking")
      .order("published_at", { ascending: false });

    if (data) setArticles(data);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const slug = formData.slug || generateSlug(formData.title);
    const tagsArray = formData.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag);

    const articleData = {
      ...formData,
      slug,
      tags: tagsArray,
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from("articles")
          .update(articleData as any)
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Article updated!");
      } else {
        const { error } = await supabase
          .from("articles")
          .insert([articleData as any]);

        if (error) throw error;
        toast.success("Article published!");
      }

      resetForm();
      fetchArticles();
    } catch (error: any) {
      toast.error(error.message || "Error saving article");
    }
  };

  const handleEdit = (article: any) => {
    setEditingId(article.id);
    setFormData({
      title: article.title,
      slug: article.slug,
      category: article.category,
      description: article.description,
      content: article.content,
      image_url: article.image_url || "",
      author: article.author,
      tags: article.tags?.join(", ") || "",
      is_featured: article.is_featured,
      is_breaking: article.is_breaking,
      is_editors_pick: article.is_editors_pick,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return;

    try {
      const { error } = await supabase.from("articles").delete().eq("id", id);

      if (error) throw error;
      toast.success("Article deleted");
      fetchArticles();
    } catch (error: any) {
      toast.error(error.message || "Error deleting article");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      category: "world",
      description: "",
      content: "",
      image_url: "",
      author: "GlobalView Staff",
      tags: "",
      is_featured: false,
      is_breaking: false,
      is_editors_pick: false,
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Manage Articles</h2>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            {showForm ? "Cancel" : "New Article"}
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{editingId ? "Edit Article" : "Create New Article"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  placeholder="Article Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />

                <Input
                  placeholder="Slug (auto-generated if empty)"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />

                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="world">World</SelectItem>
                    <SelectItem value="politics">Politics</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="lifestyle">Lifestyle</SelectItem>
                  </SelectContent>
                </Select>

                <Textarea
                  placeholder="Short Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  required
                />

                <Textarea
                  placeholder="Full Article Content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={10}
                  required
                />

                <Input
                  placeholder="Image URL"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                />

                <Input
                  placeholder="Author"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                />

                <Input
                  placeholder="Tags (comma-separated)"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                />

                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="featured"
                      checked={formData.is_featured}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_featured: checked as boolean })
                      }
                    />
                    <label htmlFor="featured" className="text-sm">
                      Featured
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="breaking"
                      checked={formData.is_breaking}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_breaking: checked as boolean })
                      }
                    />
                    <label htmlFor="breaking" className="text-sm">
                      Breaking News
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="editors"
                      checked={formData.is_editors_pick}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_editors_pick: checked as boolean })
                      }
                    />
                    <label htmlFor="editors" className="text-sm">
                      Editor's Pick
                    </label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    {editingId ? "Update Article" : "Publish Article"}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel Edit
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {articles.map((article) => (
            <Card key={article.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <h3 className="font-semibold">{article.title}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs bg-muted px-2 py-1 rounded">{article.category}</span>
                    {article.is_featured && (
                      <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded">
                        Featured
                      </span>
                    )}
                    {article.is_breaking && (
                      <span className="text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded">
                        Breaking
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(article)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(article.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};
