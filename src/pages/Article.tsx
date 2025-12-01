import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ArticleCard } from "@/components/ArticleCard";
import { ImageViewer } from "@/components/ImageViewer";
import { VideoPlayer } from "@/components/VideoPlayer";
import { ArticleEngagement } from "@/components/ArticleEngagement";
import { BookmarkButton } from "@/components/BookmarkButton";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Share2, Facebook, Twitter } from "lucide-react";
import { Helmet } from "react-helmet";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

type ImageSettings = {
  width?: number;
  height?: number;
};

type ContentBlock = 
  | { type: "text"; content: string }
  | { type: "image"; urls: string[]; layout: "single" | "grid" | "row"; imageSettings?: { [key: string]: ImageSettings } }
  | { type: "video"; urls: string[] };

interface ArticleData {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  content_blocks?: ContentBlock[];
  image_url: string | null;
  images: string[];
  videos: string[];
  category: string;
  author: string;
  published_at: string;
  tags: string[];
  views: number;
}

export const Article = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!slug) return;

      setLoading(true);
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error) {
        console.error("Error fetching article:", error);
      }

      if (data) {
        setArticle({
          ...data,
          content_blocks: data.content_blocks as ContentBlock[] | undefined
        });

        // Increment view count
        await supabase
          .from("articles")
          .update({ views: data.views + 1 })
          .eq("id", data.id);

        // Fetch related articles
        const { data: related } = await supabase
          .from("articles")
          .select("*")
          .eq("category", data.category)
          .neq("id", data.id)
          .limit(3);

        if (related) {
          setRelatedArticles(related);
        }
      }
      setLoading(false);
    };

    fetchArticle();
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const progress = (scrollTop / (documentHeight - windowHeight)) * 100;
      setReadingProgress(Math.min(progress, 100));
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const shareUrl = window.location.href;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <p className="text-muted-foreground">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <p className="text-xl text-muted-foreground">Article not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{article.title} - GlobalView News</title>
        <meta name="description" content={article.description} />
        <meta name="keywords" content={article.tags.join(", ")} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.description} />
        <meta property="og:image" content={article.images?.[0] || article.image_url || ""} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={window.location.href} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={article.description} />
        <meta name="twitter:image" content={article.images?.[0] || article.image_url || ""} />
        <meta name="author" content={article.author} />
        <link rel="canonical" href={window.location.href} />
      </Helmet>
      
      <div className="fixed top-0 left-0 right-0 z-50">
        <Progress value={readingProgress} className="h-1 rounded-none" />
      </div>
      
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <article className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Badge>{article.category}</Badge>
            <BookmarkButton articleId={article.id} />
          </div>

          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-center">
            {article.title}
          </h1>

          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-8">
            <span>By {article.author}</span>
            <span>•</span>
            <span>{format(new Date(article.published_at), "MMMM d, yyyy")}</span>
          </div>

          {/* Display content blocks if available */}
          {article.content_blocks && article.content_blocks.length > 0 ? (
            <div className="space-y-8 mb-12">
              {article.content_blocks.map((block, index) => (
                <div key={index}>
                  {block.type === "text" && (
                    <div className="prose prose-lg max-w-none mx-auto">
                      {block.content.split("\n\n").map((paragraph, pIndex) => (
                        <p key={pIndex} className="mb-4 leading-relaxed text-center">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  )}
                  
                  {block.type === "image" && block.urls.length > 0 && (
                    <div className={`max-w-4xl mx-auto ${
                      block.layout === "grid" 
                        ? "grid grid-cols-2 gap-4" 
                        : block.layout === "row"
                        ? "grid grid-cols-3 gap-4"
                        : "space-y-6"
                    }`}>
                      {block.urls.map((url, imgIndex) => {
                        const settings = block.imageSettings?.[url] || {};
                        return (
                          <img
                            key={imgIndex}
                            src={url}
                            alt=""
                            className="rounded-lg cursor-pointer hover:opacity-90 transition-opacity mx-auto"
                            style={{
                              width: settings.width ? `${settings.width}px` : '100%',
                              height: settings.height ? `${settings.height}px` : 'auto',
                              maxWidth: '100%',
                              objectFit: 'cover',
                            }}
                            onClick={() => window.open(url, '_blank')}
                          />
                        );
                      })}
                    </div>
                  )}
                  
                  {block.type === "video" && block.urls.length > 0 && (
                    <div className="space-y-6 max-w-4xl mx-auto">
                      {block.urls.map((url, vidIndex) => (
                        <VideoPlayer key={vidIndex} src={url} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Fallback to old format */}
              {article.images && article.images.length > 0 && (
                <div className="mb-8 max-w-4xl mx-auto">
                  <ImageViewer images={article.images} />
                </div>
              )}

              {article.videos && article.videos.length > 0 && (
                <div className="space-y-6 mb-8 max-w-4xl mx-auto">
                  {article.videos.map((videoUrl, index) => (
                    <VideoPlayer key={index} src={videoUrl} />
                  ))}
                </div>
              )}
              
              <div className="prose prose-lg max-w-none mb-12 mx-auto">
                {article.content.split("\n\n").map((paragraph, index) => (
                  <p key={index} className="mb-4 leading-relaxed text-center">
                    {paragraph}
                  </p>
                ))}
              </div>
            </>
          )}

          <div className="flex justify-center gap-2 mb-8">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
                toast.success("Link copied to clipboard!");
              }}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.open(
                  `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
                  "_blank"
                )
              }
            >
              <Facebook className="h-4 w-4 mr-2" />
              Facebook
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.open(
                  `https://twitter.com/intent/tweet?url=${shareUrl}&text=${article.title}`,
                  "_blank"
                )
              }
            >
              <Twitter className="h-4 w-4 mr-2" />
              Twitter
            </Button>
          </div>

          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              {article.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Likes and Comments */}
          <ArticleEngagement articleId={article.id} />

          {relatedArticles.length > 0 && (
            <section className="mt-16 pt-8 border-t">
              <h2 className="text-2xl font-serif font-bold mb-6 text-center">
                Related Articles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedArticles.map((related) => (
                  <ArticleCard
                    key={related.id}
                    {...related}
                    imageUrl={related.images?.[0] || related.image_url || undefined}
                  />
                ))}
              </div>
            </section>
          )}
        </article>
      </div>

      <Footer />
    </div>
  );
};