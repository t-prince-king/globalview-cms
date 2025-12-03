import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ArticleCard } from "@/components/ArticleCard";
import { ImageViewer } from "@/components/ImageViewer";
import { VideoPlayer } from "@/components/VideoPlayer";
import { ArticleEngagement } from "@/components/ArticleEngagement";
import { BookmarkButton } from "@/components/BookmarkButton";
import { InternalLinks } from "@/components/InternalLinks";
import { SEOHead } from "@/components/SEOHead";
import { ArticleStructuredData, BreadcrumbStructuredData } from "@/components/ArticleStructuredData";
import { useParams } from "react-router-dom";
import { useEffect, useState, memo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useArticle, useRelatedArticles } from "@/hooks/useArticles";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Share2, Facebook, Twitter } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { calculateWordCount, generateImageAlt, formatDateISO } from "@/utils/seo";

type ImageSettings = {
  width?: number;
  height?: number;
};

type ContentBlock = 
  | { type: "text"; content: string }
  | { type: "image"; urls: string[]; layout: "single" | "grid" | "row"; imageSettings?: { [key: string]: ImageSettings } }
  | { type: "video"; urls: string[] };

// Memoized article card
const MemoizedArticleCard = memo(ArticleCard);

// Loading skeleton
const ArticleLoadingSkeleton = () => (
  <div className="min-h-screen bg-background">
    <Navigation />
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Skeleton className="h-8 w-24 mb-4" />
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-6 w-48 mx-auto mb-8" />
        <Skeleton className="h-96 w-full mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  </div>
);

export const Article = () => {
  const { slug } = useParams<{ slug: string }>();
  const [readingProgress, setReadingProgress] = useState(0);
  const [viewIncremented, setViewIncremented] = useState(false);

  // Use React Query for caching
  const { data: articleData, isLoading } = useArticle(slug || "");
  
  // Transform content_blocks to proper type
  const article = articleData ? {
    ...articleData,
    content_blocks: articleData.content_blocks as ContentBlock[] | undefined,
    images: articleData.images || [],
    videos: articleData.videos || [],
    tags: articleData.tags || [],
  } : null;

  // Fetch related articles only when we have the article
  const { data: relatedArticles = [] } = useRelatedArticles(
    article?.category || "",
    article?.id || "",
    3
  );

  // Increment view count once per page load
  useEffect(() => {
    if (article && !viewIncremented) {
      setViewIncremented(true);
      // Fire and forget - don't wait for this
      supabase
        .from("articles")
        .update({ views: (article.views || 0) + 1 })
        .eq("id", article.id)
        .then(() => {});
    }
  }, [article, viewIncremented]);

  // Reset view increment when slug changes
  useEffect(() => {
    setViewIncremented(false);
  }, [slug]);

  // Optimized scroll handler with throttling
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const windowHeight = window.innerHeight;
          const documentHeight = document.documentElement.scrollHeight;
          const scrollTop = window.scrollY;
          const progress = (scrollTop / (documentHeight - windowHeight)) * 100;
          setReadingProgress(Math.min(progress, 100));
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard!");
  }, [shareUrl]);

  const handleFacebookShare = useCallback(() => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, "_blank");
  }, [shareUrl]);

  const handleTwitterShare = useCallback(() => {
    if (article) {
      window.open(`https://twitter.com/intent/tweet?url=${shareUrl}&text=${article.title}`, "_blank");
    }
  }, [shareUrl, article]);

  if (isLoading) {
    return <ArticleLoadingSkeleton />;
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

  const articleImage = article.images?.[0] || article.image_url || "";
  const wordCount = calculateWordCount(article.content);
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: article.category.charAt(0).toUpperCase() + article.category.slice(1), url: `/category/${article.category}` },
    { name: article.title.substring(0, 50), url: `/article/${article.slug}` },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* SEO Meta Tags */}
      <SEOHead
        title={article.title}
        description={article.description}
        canonical={shareUrl}
        image={articleImage}
        type="article"
        publishedTime={formatDateISO(article.published_at || new Date())}
        modifiedTime={formatDateISO(article.updated_at || article.published_at || new Date())}
        author={article.author}
        section={article.category}
        tags={article.tags}
      />
      
      {/* Structured Data for Google */}
      <ArticleStructuredData
        headline={article.title}
        description={article.description}
        image={articleImage}
        author={article.author}
        datePublished={formatDateISO(article.published_at || new Date())}
        dateModified={formatDateISO(article.updated_at || article.published_at || new Date())}
        articleSection={article.category}
        keywords={article.tags}
        url={shareUrl}
        wordCount={wordCount}
      />
      
      {/* Breadcrumb Structured Data */}
      <BreadcrumbStructuredData items={breadcrumbs} />
      
      <div className="fixed top-0 left-0 right-0 z-50">
        <Progress value={readingProgress} className="h-1 rounded-none" />
      </div>
      
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="max-w-4xl mx-auto mb-6">
          <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
            {breadcrumbs.map((crumb, index) => (
              <li key={crumb.url} className="flex items-center">
                {index > 0 && <span className="mx-2">/</span>}
                {index === breadcrumbs.length - 1 ? (
                  <span className="text-foreground truncate max-w-[200px]">{crumb.name}</span>
                ) : (
                  <a href={crumb.url} className="hover:text-primary transition-colors">
                    {crumb.name}
                  </a>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <article itemScope itemType="https://schema.org/NewsArticle" className="max-w-4xl mx-auto">
          <header>
            <div className="flex items-center justify-between mb-4">
              <Badge>{article.category}</Badge>
              <BookmarkButton articleId={article.id} />
            </div>

            <h1 itemProp="headline" className="text-4xl md:text-5xl font-serif font-bold mb-4 text-center">
              {article.title}
            </h1>

            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-8">
              <span itemProp="author" itemScope itemType="https://schema.org/Person">
                By <span itemProp="name">{article.author}</span>
              </span>
              <span>•</span>
              <time itemProp="datePublished" dateTime={formatDateISO(article.published_at || new Date())}>
                {format(new Date(article.published_at || new Date()), "MMMM d, yyyy")}
              </time>
            </div>
          </header>

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
                            loading="lazy"
                            decoding="async"
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
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFacebookShare}
            >
              <Facebook className="h-4 w-4 mr-2" />
              Facebook
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTwitterShare}
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
                  <MemoizedArticleCard
                    key={related.id}
                    {...related}
                    imageUrl={related.image_url || undefined}
                  />
                ))}
              </div>
            </section>
          )}
        </article>
        
        {/* Internal Links for SEO */}
        <InternalLinks 
          articles={relatedArticles.map(a => ({ id: a.id, title: a.title, slug: a.slug, category: a.category }))} 
          currentCategory={article.category} 
        />
      </main>

      <Footer />
    </div>
  );
};
