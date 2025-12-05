import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Edit, Trash2, X, Upload, Eye, Save, Link2 } from "lucide-react";
import { format } from "date-fns";
import { notifyIndexNow } from "@/hooks/useIndexNow";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ArticleUpdate {
  id: string;
  article_id: string;
  content: string;
  images: string[];
  title: string | null;
  keywords: string[] | null;
  created_at: string;
  updated_at: string;
}

interface RelatedArticle {
  id: string;
  title: string;
  slug: string;
}

interface ArticleUpdatesManagerProps {
  articleId: string;
  articleSlug: string;
  articleCategory?: string;
}

export const ArticleUpdatesManager = ({ articleId, articleSlug, articleCategory }: ArticleUpdatesManagerProps) => {
  const [updates, setUpdates] = useState<ArticleUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [keywords, setKeywords] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [suggestedLinks, setSuggestedLinks] = useState<RelatedArticle[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    fetchUpdates();
  }, [articleId]);

  const fetchUpdates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("article_updates")
      .select("*")
      .eq("article_id", articleId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching updates:", error);
      toast.error("Failed to load updates");
    } else {
      setUpdates(data || []);
    }
    setLoading(false);
  };

  const fetchSuggestedLinks = async () => {
    setLoadingSuggestions(true);
    try {
      let query = supabase
        .from("articles")
        .select("id, title, slug")
        .neq("id", articleId)
        .order("published_at", { ascending: false })
        .limit(10);

      if (articleCategory) {
        query = query.eq("category", articleCategory as any);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSuggestedLinks(data || []);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleImageFiles = (files: File[]) => {
    setImageFiles(prev => [...prev, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number, isExisting: boolean) => {
    if (isExisting) {
      setImages(prev => prev.filter((_, i) => i !== index));
    } else {
      const adjustedIndex = index - images.length;
      setImageFiles(prev => prev.filter((_, i) => i !== adjustedIndex));
      setImagePreviews(prev => prev.filter((_, i) => i !== adjustedIndex));
    }
  };

  const uploadImages = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [...images];
    
    for (const file of imageFiles) {
      const fileExt = file.name.split(".").pop();
      const fileName = `updates/${Date.now()}-${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("article-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("article-images")
        .getPublicUrl(fileName);

      uploadedUrls.push(data.publicUrl);
    }

    return uploadedUrls;
  };

  const insertLink = (article: RelatedArticle) => {
    const linkText = `[${article.title}](/article/${article.slug})`;
    setContent(prev => prev + (prev ? "\n\n" : "") + linkText);
    toast.success("Link added to content");
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("Update content is required");
      return;
    }

    setUploading(true);

    try {
      const uploadedImages = await uploadImages();
      const { data: { user } } = await supabase.auth.getUser();
      const keywordsArray = keywords.trim() 
        ? keywords.split(",").map(k => k.trim()).filter(Boolean)
        : null;

      if (editingId) {
        const { error } = await supabase
          .from("article_updates")
          .update({
            title: title.trim() || null,
            content: content.trim(),
            images: uploadedImages,
            keywords: keywordsArray,
          })
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Update edited successfully");
      } else {
        const { error } = await supabase
          .from("article_updates")
          .insert({
            article_id: articleId,
            title: title.trim() || null,
            content: content.trim(),
            images: uploadedImages,
            keywords: keywordsArray,
            created_by: user?.id,
          });

        if (error) throw error;
        toast.success("Update added successfully");

        // Notify search engines
        notifyIndexNow(articleSlug).then(success => {
          if (success) {
            toast.success("Search engines notified");
          }
        });
      }

      resetForm();
      fetchUpdates();
    } catch (error: any) {
      toast.error(error.message || "Failed to save update");
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (update: ArticleUpdate) => {
    setEditingId(update.id);
    setTitle(update.title || "");
    setContent(update.content);
    setKeywords(update.keywords?.join(", ") || "");
    setImages(update.images || []);
    setImageFiles([]);
    setImagePreviews([]);
    setShowForm(true);
    fetchSuggestedLinks();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this update?")) return;

    try {
      const { error } = await supabase
        .from("article_updates")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Update deleted");
      fetchUpdates();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete update");
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setTitle("");
    setContent("");
    setKeywords("");
    setImages([]);
    setImageFiles([]);
    setImagePreviews([]);
    setSuggestedLinks([]);
  };

  const handleShowForm = () => {
    setShowForm(true);
    fetchSuggestedLinks();
  };

  const allImages = [...images, ...imagePreviews];

  return (
    <Card className="mt-6 bg-slate-900 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Article Updates / Revisions</CardTitle>
        {!showForm && (
          <Button
            size="sm"
            onClick={handleShowForm}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Update
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="p-4 border border-slate-700 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">
                {editingId ? "Edit Update" : "New Update"}
              </h4>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Title (optional) */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Title (optional)
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Correction, New Info, Update #2"
                className="bg-slate-800 border-slate-700"
              />
            </div>

            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your update content here... Use [Link Text](/article/slug) for internal links."
              className="min-h-[150px] bg-slate-800 border-slate-700"
            />

            {/* Suggested Internal Links */}
            {suggestedLinks.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Suggested Internal Links
                </label>
                <div className="flex flex-wrap gap-2">
                  {suggestedLinks.slice(0, 4).map((article) => (
                    <Button
                      key={article.id}
                      variant="outline"
                      size="sm"
                      onClick={() => insertLink(article)}
                      className="text-xs truncate max-w-[200px]"
                    >
                      + {article.title}
                    </Button>
                  ))}
                </div>
                {loadingSuggestions && (
                  <p className="text-xs text-slate-400 mt-1">Loading suggestions...</p>
                )}
              </div>
            )}

            {/* Keywords (optional) */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                SEO Keywords (optional, comma-separated)
              </label>
              <Input
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g., breaking news, update, correction"
                className="bg-slate-800 border-slate-700"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Images (optional)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {allImages.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img}
                      alt={`Update image ${index + 1}`}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index, index < images.length)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <label className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded cursor-pointer hover:bg-slate-700 transition-colors w-fit">
                <Upload className="h-4 w-4" />
                <span className="text-sm">Upload Images</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      handleImageFiles(Array.from(e.target.files));
                    }
                  }}
                />
              </label>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={uploading || !content.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {uploading ? "Saving..." : editingId ? "Save Changes" : "Publish Update"}
              </Button>
              
              <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" disabled={!content.trim()}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Update Preview</DialogTitle>
                  </DialogHeader>
                  <div className="mt-4">
                    <UpdatePreview
                      title={title}
                      content={content}
                      images={allImages}
                      updateNumber={editingId ? updates.findIndex(u => u.id === editingId) + 1 : updates.length + 1}
                      date={new Date().toISOString()}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-slate-400">Loading updates...</p>
        ) : updates.length === 0 ? (
          <p className="text-slate-400 text-sm">No updates yet. Add the first update above.</p>
        ) : (
          <div className="space-y-3">
            {updates.map((update, index) => (
              <div
                key={update.id}
                className="p-3 bg-slate-800 rounded-lg border border-slate-700"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {update.title ? (
                        <span className="text-sm font-medium text-blue-400">
                          {update.title}
                        </span>
                      ) : (
                        <span className="text-sm font-medium text-blue-400">
                          Update #{index + 1}
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        {format(new Date(update.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 line-clamp-3">
                      {update.content}
                    </p>
                    {update.keywords && update.keywords.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {update.keywords.map((kw, i) => (
                          <span key={i} className="text-xs bg-slate-700 px-2 py-0.5 rounded">
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                    {update.images && update.images.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {update.images.slice(0, 3).map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            alt=""
                            className="w-10 h-10 object-cover rounded"
                          />
                        ))}
                        {update.images.length > 3 && (
                          <span className="text-xs text-slate-400 self-center">
                            +{update.images.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(update)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(update.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Preview component for updates
const UpdatePreview = ({
  title,
  content,
  images,
  updateNumber,
  date,
}: {
  title: string;
  content: string;
  images: string[];
  updateNumber: number;
  date: string;
}) => (
  <div className="border-l-4 border-blue-500 pl-4 py-3 bg-muted/30 rounded-r-lg">
    <div className="flex flex-wrap items-center gap-2 mb-3">
      {title ? (
        <span className="text-base font-semibold text-blue-600 dark:text-blue-400">
          {title}
        </span>
      ) : (
        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
          Update #{updateNumber}
        </span>
      )}
      <span className="text-xs text-muted-foreground">
        — {format(new Date(date), "MMMM d, yyyy")}
      </span>
    </div>
    <div className="prose prose-sm max-w-none">
      {content.split("\n\n").map((paragraph, i) => (
        <p key={i} className="mb-2 text-foreground">
          {paragraph.split(/(\[.*?\]\(.*?\))/).map((part, partIndex) => {
            const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
            if (linkMatch) {
              return (
                <a
                  key={partIndex}
                  href={linkMatch[2]}
                  className="text-primary hover:underline"
                >
                  {linkMatch[1]}
                </a>
              );
            }
            return part;
          })}
        </p>
      ))}
    </div>
    {images.length > 0 && (
      <div className="flex flex-wrap gap-2 mt-3">
        {images.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={`Update image ${i + 1}`}
            className="max-w-[200px] rounded-lg"
          />
        ))}
      </div>
    )}
  </div>
);
