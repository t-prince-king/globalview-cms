import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ArticleCard } from "@/components/ArticleCard";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Article {
  id: string;
  title: string;
  slug: string;
  description: string;
  image_url: string | null;
  category: string;
  published_at: string;
}

export const Category = () => {
  const { category } = useParams<{ category: string }>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      if (!category) return;

      setLoading(true);
      const { data } = await supabase
        .from("articles")
        .select("*")
        .eq("category", category as any)
        .order("published_at", { ascending: false });

      if (data) {
        setArticles(data);
      }
      setLoading(false);
    };

    fetchArticles();
  }, [category]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-serif font-bold mb-8 capitalize">
          {category} News
        </h1>

        {loading ? (
          <p className="text-muted-foreground">Loading articles...</p>
        ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                {...article}
                imageUrl={article.image_url || undefined}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">
              No articles in this category yet.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
