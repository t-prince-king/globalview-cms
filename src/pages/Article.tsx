import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ArticleCard } from "@/components/ArticleCard";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Share2, Facebook, Twitter } from "lucide-react";
import { Helmet } from "react-helmet";

type ContentBlock = 
  | { type: "text"; content: string }
  | { type: "image"; urls: string[]; layout: "single" | "grid" | "row" }
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
      <Navigation />

      <article className="container mx-auto px-4 py-8 max-w-4xl">
        <Badge className="mb-4">{article.category}</Badge>

        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
          {article.title}
        </h1>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
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
                  <div className="prose prose-lg max-w-none">
                    {block.content.split("\n\n").map((paragraph, pIndex) => (
                      <p key={pIndex} className="mb-4 leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                )}
                
                {block.type === "image" && block.urls.length > 0 && (
                  <div className={`${
                    block.layout === "grid" 
                      ? "grid grid-cols-2 gap-4" 
                      : block.layout === "row"
                      ? "grid grid-cols-3 gap-4"
                      : "space-y-6"
                  }`}>
                    {block.urls.map((url, imgIndex) => (
                      <div key={imgIndex} className="rounded-lg overflow-hidden shadow-lg">
                        <img
                          src={url}
                          alt={`${article.title} - Image ${imgIndex + 1}`}
                          className={`w-full ${block.layout === "single" ? "max-h-[600px] object-contain" : "h-64 object-cover"} bg-muted`}
                        />
                      </div>
                    ))}
                  </div>
                )}
                
                {block.type === "video" && block.urls.length > 0 && (
                  <div className="space-y-6">
                    {block.urls.map((url, vidIndex) => (
                      <div key={vidIndex} className="rounded-lg overflow-hidden shadow-lg">
                        <video
                          src={url}
                          controls
                          className="w-full max-h-[600px] bg-muted"
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
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
              <div className="space-y-6 mb-8">
                {article.images.map((imageUrl, index) => (
                  <div key={index} className="rounded-lg overflow-hidden shadow-lg">
                    <img
                      src={imageUrl}
                      alt={`${article.title} - Image ${index + 1}`}
                      className="w-full max-h-[600px] object-contain bg-muted"
                    />
                  </div>
                ))}
              </div>
            )}

            {article.videos && article.videos.length > 0 && (
              <div className="space-y-6 mb-8">
                {article.videos.map((videoUrl, index) => (
                  <div key={index} className="rounded-lg overflow-hidden shadow-lg">
                    <video
                      src={videoUrl}
                      controls
                      className="w-full max-h-[600px] bg-muted"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ))}
              </div>
            )}
            
            <div className="prose prose-lg max-w-none mb-12">
              {article.content.split("\n\n").map((paragraph, index) => (
                <p key={index} className="mb-4 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </>
        )}

        <div className="flex gap-2 mb-8">
          <Button variant="outline" size="sm">
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
          <div className="flex flex-wrap gap-2 mb-12">
            {article.tags.map((tag, index) => (
              <Badge key={index} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {relatedArticles.length > 0 && (
          <section className="mt-16 pt-8 border-t">
            <h2 className="text-2xl font-serif font-bold mb-6">
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

      <Footer />
    </div>
  );
};