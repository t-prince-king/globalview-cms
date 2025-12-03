import { Navigation } from "@/components/Navigation";
import { BreakingNewsTicker } from "@/components/BreakingNewsTicker";
import { ArticleCard } from "@/components/ArticleCard";
import { Footer } from "@/components/Footer";
import { SubscriptionForm } from "@/components/SubscriptionForm";
import { SEOHead } from "@/components/SEOHead";
import { WebsiteStructuredData } from "@/components/ArticleStructuredData";
import { useEffect, useState, memo, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFeaturedArticles, usePopularArticles, useEditorsPickArticles } from "@/hooks/useArticles";
import heroImage from "@/assets/hero-global.jpg";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Skeleton } from "@/components/ui/skeleton";

// Memoized article card to prevent unnecessary re-renders
const MemoizedArticleCard = memo(ArticleCard);

// Loading skeleton for articles
const ArticleSkeleton = ({ size = "medium" }: { size?: "small" | "medium" | "large" }) => (
  <div className={`rounded-lg overflow-hidden ${size === "large" ? "h-96" : size === "small" ? "h-24" : "h-64"}`}>
    <Skeleton className="w-full h-full" />
  </div>
);

export const Home = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  // Use React Query hooks with caching - these are automatically cached and deduplicated
  const { data: featuredArticles = [], isLoading: featuredLoading } = useFeaturedArticles(5);
  const { data: trendingArticles = [], isLoading: trendingLoading } = usePopularArticles(5);
  const { data: editorsPicks = [], isLoading: editorsLoading } = useEditorsPickArticles(6);

  // Memoize autoplay plugin to prevent recreation on each render
  const autoplayPlugin = useMemo(() => Autoplay({ delay: 5000 }), []);

  useEffect(() => {
    let isMounted = true;
    
    const checkSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user && isMounted) {
          const { data } = await supabase
            .from("subscriptions")
            .select("id")
            .eq("user_id", user.id)
            .eq("is_active", true)
            .maybeSingle();
          
          if (isMounted) {
            setIsSubscribed(!!data);
          }
        }
      } finally {
        if (isMounted) {
          setCheckingSubscription(false);
        }
      }
    };

    checkSubscription();
    
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* SEO Head */}
      <SEOHead
        title="GlobalView Times - See the World, One Story at a Time"
        description="Your premier source for global news coverage. Breaking news, in-depth analysis, and comprehensive reporting on World, Politics, Technology, Business, Sports, Entertainment, and Lifestyle."
        canonical={typeof window !== 'undefined' ? window.location.origin : ''}
      />
      <WebsiteStructuredData />
      
      <Navigation />
      <BreakingNewsTicker />

      <main className="container mx-auto px-4 py-8">
        {/* Hero/Featured Carousel */}
        <section className="mb-12">
          {featuredLoading ? (
            <ArticleSkeleton size="large" />
          ) : featuredArticles.length > 0 ? (
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              plugins={[autoplayPlugin]}
              className="w-full"
            >
              <CarouselContent>
                {featuredArticles.map((article) => (
                  <CarouselItem key={article.id}>
                    <MemoizedArticleCard
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
                loading="eager"
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
                {editorsLoading ? (
                  <>
                    <ArticleSkeleton />
                    <ArticleSkeleton />
                    <ArticleSkeleton />
                    <ArticleSkeleton />
                  </>
                ) : editorsPicks.length > 0 ? (
                  editorsPicks.map((article) => (
                    <MemoizedArticleCard
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
                {trendingLoading ? (
                  <>
                    <ArticleSkeleton size="small" />
                    <ArticleSkeleton size="small" />
                    <ArticleSkeleton size="small" />
                  </>
                ) : trendingArticles.length > 0 ? (
                  trendingArticles.map((article) => (
                    <MemoizedArticleCard
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
        {!checkingSubscription && !isSubscribed && (
          <section className="mt-16">
            <SubscriptionForm />
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};
