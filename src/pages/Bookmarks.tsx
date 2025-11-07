import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ArticleCard } from "@/components/ArticleCard";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Bookmark } from "lucide-react";

interface Article {
  id: string;
  title: string;
  slug: string;
  description: string;
  image_url: string | null;
  images: string[];
  category: string;
  published_at: string;
}

export const Bookmarks = () => {
  const [bookmarkedArticles, setBookmarkedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndFetchBookmarks();
  }, []);

  const checkAuthAndFetchBookmarks = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);
    await fetchBookmarks(session.user.id);
  };

  const fetchBookmarks = async (userId: string) => {
    setLoading(true);
    const { data: bookmarks } = await supabase
      .from("article_bookmarks")
      .select(`
        article_id,
        articles (
          id,
          title,
          slug,
          description,
          image_url,
          images,
          category,
          published_at
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (bookmarks) {
      const articles = bookmarks
        .map((b: any) => b.articles)
        .filter(Boolean) as Article[];
      setBookmarkedArticles(articles);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <p className="text-muted-foreground">Loading bookmarks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>My Bookmarks - GlobalView News</title>
        <meta name="description" content="Your saved articles" />
      </Helmet>
      <Navigation />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center gap-3 mb-8">
          <Bookmark className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-serif font-bold">My Bookmarks</h1>
        </div>

        {bookmarkedArticles.length === 0 ? (
          <div className="text-center py-16">
            <Bookmark className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground">No bookmarked articles yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Start bookmarking articles to read them later
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarkedArticles.map((article) => (
              <ArticleCard
                key={article.id}
                {...article}
                imageUrl={article.images?.[0] || article.image_url || undefined}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};