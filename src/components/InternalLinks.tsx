import { Link } from "react-router-dom";
import { memo } from "react";

interface RelatedArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  image_url?: string;
}

interface InternalLinksProps {
  articles: RelatedArticle[];
  currentCategory: string;
  maxLinks?: number;
}

export const InternalLinks = memo(({ 
  articles, 
  currentCategory,
  maxLinks = 6 
}: InternalLinksProps) => {
  if (articles.length === 0) return null;

  const displayArticles = articles.slice(0, maxLinks);
  const categoryLabel = currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1);

  return (
    <aside 
      className="mt-8 p-6 bg-muted/50 rounded-lg border" 
      aria-label="Related articles"
      itemScope 
      itemType="https://schema.org/ItemList"
    >
      <meta itemProp="numberOfItems" content={String(displayArticles.length)} />
      <h3 className="text-lg font-semibold mb-4" itemProp="name">
        More in {categoryLabel}
      </h3>
      <nav aria-label="Related articles navigation">
        <ul className="grid gap-3 sm:grid-cols-2">
          {displayArticles.map((article, index) => (
            <li 
              key={article.id}
              itemScope 
              itemType="https://schema.org/ListItem"
              itemProp="itemListElement"
            >
              <meta itemProp="position" content={String(index + 1)} />
              <Link
                to={`/article/${article.slug}`}
                className="group flex items-start gap-3 p-2 rounded-md hover:bg-muted/80 transition-colors"
                title={article.title}
                itemProp="url"
              >
                {article.image_url && (
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-16 h-12 object-cover rounded flex-shrink-0"
                    loading="lazy"
                    width={64}
                    height={48}
                  />
                )}
                <span 
                  className="text-sm text-primary group-hover:underline line-clamp-2"
                  itemProp="name"
                >
                  {article.title}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <Link 
        to={`/category/${currentCategory}`}
        className="inline-block mt-4 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        aria-label={`View all ${categoryLabel} articles`}
      >
        View all {categoryLabel} articles →
      </Link>
    </aside>
  );
});

InternalLinks.displayName = "InternalLinks";

/**
 * Compact version for embedding within article content
 */
export const InlineRelatedLinks = memo(({ 
  articles 
}: { 
  articles: Array<{ id: string; title: string; slug: string }> 
}) => {
  if (articles.length === 0) return null;

  return (
    <div className="my-6 p-4 bg-muted/30 rounded-lg border-l-4 border-primary">
      <p className="text-sm font-medium text-muted-foreground mb-2">Related reads:</p>
      <ul className="space-y-1">
        {articles.slice(0, 3).map((article) => (
          <li key={article.id}>
            <Link
              to={`/article/${article.slug}`}
              className="text-sm text-primary hover:underline"
            >
              → {article.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
});

InlineRelatedLinks.displayName = "InlineRelatedLinks";
