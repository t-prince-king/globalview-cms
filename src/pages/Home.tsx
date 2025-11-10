import { Navigation } from "@/components/Navigation";
import { BreakingNewsTicker } from "@/components/BreakingNewsTicker";
import { ArticleCard } from "@/components/ArticleCard";
import { Footer } from "@/components/Footer";
import { SubscriptionForm } from "@/components/SubscriptionForm";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-global.jpg";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

interface Article {
  id: string;
  title: string;
  slug: string;
  description: string;
  image_url: string | null;
  category: string;
  published_at: string;
  is_featured: boolean;
  is_editors_pick: boolean;
  views: number;
}

export const Home = () => {
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
  const [trendingArticles, setTrendingArticles] = useState<Article[]>([]);
  const [editorsPicks, setEditorsPicks] = useState<Article[]>([]);

  useEffect(() => {
    const fetchArticles = async () => {
      // Featured articles (multiple for carousel)
      const { data: featured } = await supabase
        .from("articles")
        .select("*")
        .eq("is_featured", true)
        .order("published_at", { ascending: false })
        .limit(5);

      if (featured) {
        setFeaturedArticles(featured);
      }

      // Trending articles (most viewed)
      const { data: trending } = await supabase
        .from("articles")
        .select("*")
        .order("views", { ascending: false })
        .limit(5);

      if (trending) {
        setTrendingArticles(trending);
      }

      // Editor's picks
      const { data: picks } = await supabase
        .from("articles")
        .select("*")
        .eq("is_editors_pick", true)
        .order("published_at", { ascending: false })
        .limit(6);

      if (picks) {
        setEditorsPicks(picks);
      }
    };

    fetchArticles();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <BreakingNewsTicker />

      <main className="container mx-auto px-4 py-8">
        {/* Hero/Featured Carousel */}
        <section className="mb-12">
          {featuredArticles.length > 0 ? (
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              plugins={[
                Autoplay({
                  delay: 5000,
                }),
              ]}
              className="w-full"
            >
              <CarouselContent>
                {featuredArticles.map((article) => (
                  <CarouselItem key={article.id}>
                    <ArticleCard
                      {...article}
                      imageUrl={article.image_url || heroImage}
                      size="large"
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </Carousel>
          ) : (
            <div className="relative h-96 overflow-hidden rounded-lg shadow-article">
              <img
                src={heroImage}
                alt="Global News"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h2 className="text-4xl font-serif font-bold mb-2">
                  Welcome to GlobalView Times
                </h2>
                <p className="text-lg">
                  Your premier source for global news and analysis
                </p>
              </div>
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Editor's Picks */}
            <section>
              <h2 className="text-2xl font-serif font-bold mb-6 pb-2 border-b-2 border-accent">
                Editor's Picks
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {editorsPicks.length > 0 ? (
                  editorsPicks.map((article) => (
                    <ArticleCard
                      key={article.id}
                      {...article}
                      imageUrl={article.image_url || undefined}
                    />
                  ))
                ) : (
                  <p className="text-muted-foreground col-span-2">
                    No articles available yet. Admin can add articles from the dashboard.
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside>
            <div className="sticky top-24">
              <h3 className="text-xl font-serif font-bold mb-4 pb-2 border-b-2 border-primary">
                Trending Now
              </h3>
              <div className="space-y-4">
                {trendingArticles.length > 0 ? (
                  trendingArticles.map((article) => (
                    <ArticleCard
                      key={article.id}
                      {...article}
                      imageUrl={article.image_url || undefined}
                      size="small"
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No trending articles yet
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>

        {/* Subscription Form */}
        <section className="mt-16">
          <SubscriptionForm />
        </section>
      </main>

      <Footer />
    </div>
  );
};
