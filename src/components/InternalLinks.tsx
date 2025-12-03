import { Link } from "react-router-dom";
import { memo } from "react";

interface RelatedArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
}

interface InternalLinksProps {
  articles: RelatedArticle[];
  currentCategory: string;
}

export const InternalLinks = memo(({ articles, currentCategory }: InternalLinksProps) => {
  if (articles.length === 0) return null;

  return (
    <aside className="mt-8 p-6 bg-muted/50 rounded-lg border" aria-label="Related articles">
      <h3 className="text-lg font-semibold mb-4">
        More in {currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)}
      </h3>
      <nav aria-label="Related articles navigation">
        <ul className="space-y-2">
          {articles.slice(0, 5).map((article) => (
            <li key={article.id}>
              <Link
                to={`/article/${article.slug}`}
                className="text-primary hover:underline hover:text-primary/80 transition-colors line-clamp-2"
                title={article.title}
              >
                {article.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <Link 
        to={`/category/${currentCategory}`}
        className="inline-block mt-4 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
      >
        View all {currentCategory} articles →
      </Link>
    </aside>
  );
});

InternalLinks.displayName = "InternalLinks";
