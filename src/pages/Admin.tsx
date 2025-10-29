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
import { LogOut, Plus, Edit, Trash2, Home, Upload, X } from "lucide-react";

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
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  
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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return formData.image_url || null;

    setUploading(true);
    try {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("article-images")
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("article-images")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error: any) {
      toast.error("Error uploading image: " + error.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Upload image first if there's a new one
    const imageUrl = await uploadImage();
    if (imageFile && !imageUrl) {
      toast.error("Failed to upload image");
      return;
    }

    const slug = formData.slug || generateSlug(formData.title);
    const tagsArray = formData.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag);

    const articleData = {
      ...formData,
      slug,
      tags: tagsArray,
      image_url: imageUrl || formData.image_url,
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
    setImagePreview(article.image_url || "");
    setImageFile(null);
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
    setImageFile(null);
    setImagePreview("");
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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate("/")} className="border-slate-700 hover:bg-slate-800">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            <span className="text-sm text-slate-400">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="border-slate-700 hover:bg-slate-800">
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
          <Card className="mb-8 bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-100">{editingId ? "Edit Article" : "Create New Article"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  placeholder="Article Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />

                <Input
                  placeholder="Slug (auto-generated if empty)"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />

                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
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
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />

                <Textarea
                  placeholder="Full Article Content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={10}
                  required
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />

                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-300">Article Image</label>
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive
                        ? "border-primary bg-slate-800"
                        : "border-slate-700 bg-slate-800/50"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-h-48 mx-auto rounded"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview("");
                            setFormData({ ...formData, image_url: "" });
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                        <p className="text-slate-400 mb-2">
                          Drag and drop an image here, or click to select
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleImageFile(e.target.files[0]);
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </>
                    )}
                  </div>
                </div>

                <Input
                  placeholder="Author"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />

                <Input
                  placeholder="Tags (comma-separated)"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-slate-100"
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
                    <label htmlFor="featured" className="text-sm text-slate-300">
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
                    <label htmlFor="breaking" className="text-sm text-slate-300">
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
                    <label htmlFor="editors" className="text-sm text-slate-300">
                      Editor's Pick
                    </label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={uploading}>
                    {uploading ? "Uploading..." : editingId ? "Update Article" : "Publish Article"}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="outline" onClick={resetForm} className="border-slate-700 hover:bg-slate-800">
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
            <Card key={article.id} className="bg-slate-900 border-slate-800">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-100">{article.title}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded">{article.category}</span>
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
                  <Button variant="outline" size="sm" onClick={() => handleEdit(article)} className="border-slate-700 hover:bg-slate-800">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(article.id)}
                    className="border-slate-700 hover:bg-slate-800"
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
