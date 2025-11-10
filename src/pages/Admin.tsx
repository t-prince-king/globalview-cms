import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogOut, Plus, Edit, Trash2, Home, Upload, X, Image, Video, Type, MoveUp, MoveDown, Grid, Columns } from "lucide-react";
import { UserManagement } from "@/components/UserManagement";
import { TickerManagement } from "@/components/TickerManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ContentBlock = 
  | { type: "text"; content: string }
  | { type: "image"; urls: string[]; layout: "single" | "grid" | "row" }
  | { type: "video"; urls: string[] };

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
  const [dragActiveImages, setDragActiveImages] = useState(false);
  const [dragActiveVideos, setDragActiveVideos] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([
    { type: "text", content: "" }
  ]);
  
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    category: "world",
    description: "",
    content: "",
    images: [] as string[],
    videos: [] as string[],
    author: "GlobalView Staff",
    author_email: "",
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
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleImagesDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveImages(true);
    } else if (e.type === "dragleave") {
      setDragActiveImages(false);
    }
  };

  const handleVideosDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveVideos(true);
    } else if (e.type === "dragleave") {
      setDragActiveVideos(false);
    }
  };

  const handleImagesDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveImages(false);

    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith("image/"));
    if (files.length > 0) {
      handleImageFiles(files);
    }
  };

  const handleVideosDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveVideos(false);

    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith("video/"));
    if (files.length > 0) {
      handleVideoFiles(files);
    }
  };

  const handleImageFiles = (files: File[]) => {
    const newFiles = [...imageFiles, ...files];
    setImageFiles(newFiles);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleVideoFiles = (files: File[]) => {
    const newFiles = [...videoFiles, ...files];
    setVideoFiles(newFiles);

    files.forEach(file => {
      const url = URL.createObjectURL(file);
      setVideoPreviews(prev => [...prev, url]);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    URL.revokeObjectURL(videoPreviews[index]);
    setVideoFiles(prev => prev.filter((_, i) => i !== index));
    setVideoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (): Promise<{ images: string[]; videos: string[] }> => {
    setUploading(true);
    const uploadedImages: string[] = [...formData.images];
    const uploadedVideos: string[] = [...formData.videos];

    try {
      // Upload images
      for (const file of imageFiles) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("article-images")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("article-images")
          .getPublicUrl(filePath);

        uploadedImages.push(data.publicUrl);
      }

      // Upload videos
      for (const file of videoFiles) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("article-videos")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("article-videos")
          .getPublicUrl(filePath);

        uploadedVideos.push(data.publicUrl);
      }

      return { images: uploadedImages, videos: uploadedVideos };
    } catch (error: any) {
      toast.error("Error uploading files: " + error.message);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Upload new files
      const { images, videos } = await uploadFiles();

      const slug = formData.slug || generateSlug(formData.title);
      const tagsArray = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      const articleData = {
        ...formData,
        slug,
        tags: tagsArray,
        images,
        videos,
        image_url: images[0] || null,
        content_blocks: contentBlocks,
        user_id: user?.id,
      };

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

  const handleEdit = async (article: any) => {
    // Fetch full article data
    const { data } = await supabase
      .from("articles")
      .select("*")
      .eq("id", article.id)
      .single();

    if (data) {
      setEditingId(data.id);
      setFormData({
        title: data.title,
        slug: data.slug,
        category: data.category,
        description: data.description,
        content: data.content,
        images: data.images || [],
        videos: data.videos || [],
        author: data.author,
        author_email: data.author_email || "",
        tags: data.tags?.join(", ") || "",
        is_featured: data.is_featured,
        is_breaking: data.is_breaking,
        is_editors_pick: data.is_editors_pick,
      });
      
      // Load content blocks if available, otherwise create default text block
      if (data.content_blocks && Array.isArray(data.content_blocks) && data.content_blocks.length > 0) {
        setContentBlocks(data.content_blocks as ContentBlock[]);
      } else {
        setContentBlocks([{ type: "text", content: data.content || "" }]);
      }
      
      setImageFiles([]);
      setVideoFiles([]);
      setImagePreviews([]);
      setVideoPreviews([]);
      setShowForm(true);
    }
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
      images: [],
      videos: [],
      author: "GlobalView Staff",
      author_email: "",
      tags: "",
      is_featured: false,
      is_breaking: false,
      is_editors_pick: false,
    });
    setContentBlocks([{ type: "text", content: "" }]);
    setEditingId(null);
    setShowForm(false);
    setImageFiles([]);
    setVideoFiles([]);
    setImagePreviews([]);
    videoPreviews.forEach(url => URL.revokeObjectURL(url));
    setVideoPreviews([]);
  };

  const addBlock = (type: "text" | "image" | "video") => {
    if (type === "text") {
      setContentBlocks([...contentBlocks, { type: "text", content: "" }]);
    } else if (type === "image") {
      setContentBlocks([...contentBlocks, { type: "image", urls: [], layout: "single" }]);
    } else {
      setContentBlocks([...contentBlocks, { type: "video", urls: [] }]);
    }
  };

  const removeBlock = (index: number) => {
    if (contentBlocks.length === 1) {
      toast.error("You must have at least one content block");
      return;
    }
    setContentBlocks(contentBlocks.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === contentBlocks.length - 1) return;
    
    const newBlocks = [...contentBlocks];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    setContentBlocks(newBlocks);
  };

  const updateBlock = (index: number, updates: Partial<ContentBlock>) => {
    const newBlocks = [...contentBlocks];
    newBlocks[index] = { ...newBlocks[index], ...updates } as ContentBlock;
    setContentBlocks(newBlocks);
  };

  const addMediaToBlock = (blockIndex: number, urls: string[]) => {
    const block = contentBlocks[blockIndex];
    if (block.type === "image" || block.type === "video") {
      updateBlock(blockIndex, { urls: [...block.urls, ...urls] });
    }
  };

  const removeMediaFromBlock = (blockIndex: number, urlIndex: number) => {
    const block = contentBlocks[blockIndex];
    if (block.type === "image" || block.type === "video") {
      updateBlock(blockIndex, { 
        urls: block.urls.filter((_, i) => i !== urlIndex) 
      });
    }
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
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-xl sm:text-2xl font-bold">Admin Dashboard</h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={() => navigate("/")} className="border-slate-700 hover:bg-slate-800 flex-1 sm:flex-none">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
              <span className="text-sm text-slate-400 hidden sm:inline">{user?.email}</span>
              <span className="text-xs text-slate-400 sm:hidden truncate max-w-[150px]">{user?.email}</span>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="border-slate-700 hover:bg-slate-800 flex-1 sm:flex-none">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="articles" className="space-y-6">
          <TabsList className="bg-slate-900 border border-slate-800 grid w-full grid-cols-3">
            <TabsTrigger value="articles">Articles</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="ticker">Ticker</TabsTrigger>
          </TabsList>

          <TabsContent value="articles" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-semibold">Manage Articles</h2>
              <Button onClick={() => setShowForm(!showForm)} className="w-full sm:w-auto">
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
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-slate-300">Title</Label>
                  <Input
                    id="title"
                    placeholder="Article Title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="bg-slate-800 border-slate-700 text-slate-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-slate-300">Slug (auto-generated if empty)</Label>
                  <Input
                    id="slug"
                    placeholder="article-slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-slate-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-slate-300">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="world">World</SelectItem>
                      <SelectItem value="politics">Politics</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="sports">Sports</SelectItem>
                      <SelectItem value="entertainment">Entertainment</SelectItem>
                      <SelectItem value="lifestyle">Lifestyle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-slate-300">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Short Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    required
                    className="bg-slate-800 border-slate-700 text-slate-100"
                  />
                </div>

                {/* Cover Image Upload */}
                <div className="space-y-2">
                  <Label className="text-slate-300">Article Cover Image</Label>
                  <div 
                    className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      dragActiveImages ? "border-blue-500 bg-blue-500/10" : "border-slate-700 bg-slate-900/50"
                    }`}
                    onDragEnter={handleImagesDrag}
                    onDragLeave={handleImagesDrag}
                    onDragOver={handleImagesDrag}
                    onDrop={handleImagesDrop}
                  >
                    <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                    <p className="text-sm text-slate-400 mb-1">
                      Drag and drop cover image here, or click to select
                    </p>
                    <p className="text-xs text-slate-500">
                      First uploaded image will be the cover
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files && handleImageFiles(Array.from(e.target.files))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                  
                  {/* Preview uploaded cover images */}
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded" />
                          {index === 0 && (
                            <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                              Cover
                            </div>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Show existing cover if editing */}
                  {editingId && formData.images.length > 0 && imagePreviews.length === 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-slate-400 mb-2">Current cover image:</p>
                      <img src={formData.images[0]} alt="Current cover" className="w-32 h-20 object-cover rounded" />
                    </div>
                  )}
                </div>

                {/* Content Blocks */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-300">Article Content Blocks</Label>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" onClick={() => addBlock("text")} variant="outline" className="border-slate-700 hover:bg-slate-800">
                        <Type className="h-4 w-4 mr-2" />
                        Add Text
                      </Button>
                      <Button type="button" size="sm" onClick={() => addBlock("image")} variant="outline" className="border-slate-700 hover:bg-slate-800">
                        <Image className="h-4 w-4 mr-2" />
                        Add Images
                      </Button>
                      <Button type="button" size="sm" onClick={() => addBlock("video")} variant="outline" className="border-slate-700 hover:bg-slate-800">
                        <Video className="h-4 w-4 mr-2" />
                        Add Video
                      </Button>
                    </div>
                  </div>

                  {contentBlocks.map((block, blockIndex) => (
                    <Card key={blockIndex} className="bg-slate-800 border-slate-700">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {block.type === "text" && <Type className="h-4 w-4 text-slate-400" />}
                            {block.type === "image" && <Image className="h-4 w-4 text-slate-400" />}
                            {block.type === "video" && <Video className="h-4 w-4 text-slate-400" />}
                            <span className="text-sm text-slate-400 capitalize">{block.type} Block {blockIndex + 1}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button type="button" size="sm" variant="ghost" onClick={() => moveBlock(blockIndex, "up")} disabled={blockIndex === 0}>
                              <MoveUp className="h-4 w-4" />
                            </Button>
                            <Button type="button" size="sm" variant="ghost" onClick={() => moveBlock(blockIndex, "down")} disabled={blockIndex === contentBlocks.length - 1}>
                              <MoveDown className="h-4 w-4" />
                            </Button>
                            <Button type="button" size="sm" variant="ghost" onClick={() => removeBlock(blockIndex)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {block.type === "text" && (
                          <Textarea
                            placeholder="Enter your text content here..."
                            value={block.content}
                            onChange={(e) => updateBlock(blockIndex, { content: e.target.value })}
                            rows={6}
                            className="bg-slate-900 border-slate-700 text-slate-100"
                          />
                        )}

                        {block.type === "image" && (
                          <div className="space-y-3">
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant={block.layout === "single" ? "default" : "outline"}
                                onClick={() => updateBlock(blockIndex, { layout: "single" })}
                                className={block.layout !== "single" ? "border-slate-700 hover:bg-slate-800" : ""}
                              >
                                Single
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={block.layout === "grid" ? "default" : "outline"}
                                onClick={() => updateBlock(blockIndex, { layout: "grid" })}
                                className={block.layout !== "grid" ? "border-slate-700 hover:bg-slate-800" : ""}
                              >
                                <Grid className="h-4 w-4 mr-2" />
                                Grid
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={block.layout === "row" ? "default" : "outline"}
                                onClick={() => updateBlock(blockIndex, { layout: "row" })}
                                className={block.layout !== "row" ? "border-slate-700 hover:bg-slate-800" : ""}
                              >
                                <Columns className="h-4 w-4 mr-2" />
                                Row
                              </Button>
                            </div>
                            
                            <div className="relative border-2 border-dashed rounded-lg p-6 text-center border-slate-700 bg-slate-900/50">
                              <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                              <p className="text-sm text-slate-400 mb-1">Add images to this block</p>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={async (e) => {
                                  if (e.target.files) {
                                    const files = Array.from(e.target.files);
                                    const urls: string[] = [];
                                    for (const file of files) {
                                      const fileExt = file.name.split(".").pop();
                                      const fileName = `${Math.random()}.${fileExt}`;
                                      const { error: uploadError } = await supabase.storage
                                        .from("article-images")
                                        .upload(fileName, file);
                                      if (!uploadError) {
                                        const { data } = supabase.storage
                                          .from("article-images")
                                          .getPublicUrl(fileName);
                                        urls.push(data.publicUrl);
                                      }
                                    }
                                    addMediaToBlock(blockIndex, urls);
                                  }
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                            </div>
                            
                            {block.urls.length > 0 && (
                              <div className={`grid gap-3 ${block.layout === "grid" ? "grid-cols-2" : block.layout === "row" ? "grid-cols-3" : "grid-cols-1"}`}>
                                {block.urls.map((url, urlIndex) => (
                                  <div key={urlIndex} className="relative group">
                                    <img src={url} alt="" className="w-full h-32 object-cover rounded-lg" />
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => removeMediaFromBlock(blockIndex, urlIndex)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {block.type === "video" && (
                          <div className="space-y-3">
                            <div className="relative border-2 border-dashed rounded-lg p-6 text-center border-slate-700 bg-slate-900/50">
                              <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                              <p className="text-sm text-slate-400 mb-1">Add videos to this block</p>
                              <input
                                type="file"
                                accept="video/*"
                                multiple
                                onChange={async (e) => {
                                  if (e.target.files) {
                                    const files = Array.from(e.target.files);
                                    const urls: string[] = [];
                                    for (const file of files) {
                                      const fileExt = file.name.split(".").pop();
                                      const fileName = `${Math.random()}.${fileExt}`;
                                      const { error: uploadError } = await supabase.storage
                                        .from("article-videos")
                                        .upload(fileName, file);
                                      if (!uploadError) {
                                        const { data } = supabase.storage
                                          .from("article-videos")
                                          .getPublicUrl(fileName);
                                        urls.push(data.publicUrl);
                                      }
                                    }
                                    addMediaToBlock(blockIndex, urls);
                                  }
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                            </div>
                            
                            {block.urls.length > 0 && (
                              <div className="space-y-3">
                                {block.urls.map((url, urlIndex) => (
                                  <div key={urlIndex} className="relative group">
                                    <video src={url} controls className="w-full max-h-48 rounded-lg bg-slate-900" />
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => removeMediaFromBlock(blockIndex, urlIndex)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="author" className="text-slate-300">Author</Label>
                  <Input
                    id="author"
                    placeholder="Author"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-slate-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="author_email" className="text-slate-300">Author Email</Label>
                  <Input
                    id="author_email"
                    type="email"
                    placeholder="author@example.com"
                    value={formData.author_email}
                    onChange={(e) => setFormData({ ...formData, author_email: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-slate-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags" className="text-slate-300">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    placeholder="politics, elections, democracy"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-slate-100"
                  />
                </div>

                <div className="flex flex-wrap gap-6">
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
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-100 break-words">{article.title}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
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
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(article)} className="border-slate-700 hover:bg-slate-800 flex-1 sm:flex-none">
                      <Edit className="h-4 w-4 sm:mr-0" />
                      <span className="sm:hidden ml-2">Edit</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(article.id)}
                      className="border-slate-700 hover:bg-slate-800 flex-1 sm:flex-none"
                    >
                      <Trash2 className="h-4 w-4 sm:mr-0" />
                      <span className="sm:hidden ml-2">Delete</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="ticker">
            <TickerManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};