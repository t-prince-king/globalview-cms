import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { usePrefetchArticle } from "@/hooks/useArticles";
import { memo, useCallback, useState } from "react";

interface ArticleCardProps {
  id: string;
  title: string;
  slug: string;
  description: string;
  imageUrl?: string;
  category: string;
  published_at: string;
  size?: "small" | "medium" | "large";
  isFeatured?: boolean;
}

// Memoized component to prevent unnecessary re-renders
export const ArticleCard = memo(({
  title,
  slug,
  description,
  imageUrl,
  category,
  published_at,
  size = "medium",
  isFeatured = false,
}: ArticleCardProps) => {
  const prefetchArticle = usePrefetchArticle();
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const formattedDate = format(new Date(published_at), "MMMM d, yyyy");
  
  // Generate SEO-friendly alt text
  const imageAlt = `${title} - ${category} news`;

  // Prefetch article data on hover for instant navigation
  const handleMouseEnter = useCallback(() => {
    prefetchArticle(slug);
  }, [prefetchArticle, slug]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  if (size === "large") {
    return (
      <article itemScope itemType="https://schema.org/NewsArticle">
        <Link
          to={`/article/${slug}`}
          className="group block overflow-hidden rounded-lg shadow-article hover:shadow-hover transition-all duration-300"
          onMouseEnter={handleMouseEnter}
          onFocus={handleMouseEnter}
          aria-label={`Read article: ${title}`}
        >
          <div className="relative h-96 overflow-hidden bg-muted">
            {imageUrl && (
              <img
                src={imageUrl}
                alt={imageAlt}
                title={title}
                loading="eager"
                decoding="async"
                width={1200}
                height={675}
                onLoad={handleImageLoad}
                className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
                itemProp="image"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <Badge variant="destructive" className="mb-3">
                <span itemProp="articleSection">{category}</span>
              </Badge>
              <h2 itemProp="headline" className="text-3xl font-serif font-bold mb-2 line-clamp-2">
                {title}
              </h2>
              <p itemProp="description" className="text-sm text-gray-200 line-clamp-2">{description}</p>
              <time itemProp="datePublished" dateTime={published_at} className="text-xs text-gray-300 mt-2 block">
                {formattedDate}
              </time>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  if (size === "small") {
    return (
      <article itemScope itemType="https://schema.org/NewsArticle">
        <Link
          to={`/article/${slug}`}
          className="group flex gap-4 hover:bg-news-hover p-3 rounded-lg transition-all duration-300"
          onMouseEnter={handleMouseEnter}
          onFocus={handleMouseEnter}
          aria-label={`Read article: ${title}`}
        >
          {imageUrl && (
            <div className="relative w-32 h-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
              <img
                src={imageUrl}
                alt={imageAlt}
                title={title}
                loading="lazy"
                decoding="async"
                width={128}
                height={96}
                onLoad={handleImageLoad}
                className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
                itemProp="image"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 itemProp="headline" className="font-serif font-bold text-sm line-clamp-2 group-hover:text-accent transition-colors mb-2">
              {title}
            </h3>
            <time itemProp="datePublished" dateTime={published_at} className="text-xs text-muted-foreground">
              {formattedDate}
            </time>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article itemScope itemType="https://schema.org/NewsArticle">
      <Link
        to={`/article/${slug}`}
        className="group block overflow-hidden rounded-xl shadow-article hover:shadow-hover transition-all duration-300 bg-card"
        onMouseEnter={handleMouseEnter}
        onFocus={handleMouseEnter}
        aria-label={`Read article: ${title}`}
      >
        {imageUrl ? (
          <div className="relative h-56 overflow-hidden bg-muted">
            <img
              src={imageUrl}
              alt={imageAlt}
              title={title}
              loading="lazy"
              decoding="async"
              width={400}
              height={225}
              onLoad={handleImageLoad}
              className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              itemProp="image"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        ) : (
          <div className="h-56 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <span className="text-4xl opacity-20">{category}</span>
          </div>
        )}
        <div className="p-5">
          <Badge variant="outline" className="mb-3">
            <span itemProp="articleSection">{category}</span>
          </Badge>
          <h3 itemProp="headline" className="font-serif font-bold text-xl line-clamp-2 mb-3 group-hover:text-accent transition-colors">
            {title}
          </h3>
          <p itemProp="description" className="text-sm text-muted-foreground line-clamp-3 mb-4">
            {description}
          </p>
          <time itemProp="datePublished" dateTime={published_at} className="text-xs text-muted-foreground">
            {formattedDate}
          </time>
        </div>
      </Link>
    </article>
  );
});

ArticleCard.displayName = "ArticleCard";
