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

interface ArticleData {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  image_url: string | null;
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
      const { data } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", slug)
        .single();

      if (data) {
        setArticle(data);

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
        <meta property="og:image" content={article.image_url || ""} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={window.location.href} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={article.description} />
        <meta name="twitter:image" content={article.image_url || ""} />
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

        {article.image_url && (
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-96 object-cover rounded-lg mb-8"
          />
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

        <div className="prose prose-lg max-w-none mb-12">
          {article.content.split("\n\n").map((paragraph, index) => (
            <p key={index} className="mb-4 leading-relaxed">
              {paragraph}
            </p>
          ))}
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
                  imageUrl={related.image_url || undefined}
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
