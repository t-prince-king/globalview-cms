import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

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

export const ArticleCard = ({
  title,
  slug,
  description,
  imageUrl,
  category,
  published_at,
  size = "medium",
  isFeatured = false,
}: ArticleCardProps) => {
  const formattedDate = format(new Date(published_at), "MMMM d, yyyy");

  if (size === "large") {
    return (
      <Link
        to={`/article/${slug}`}
        className="group block overflow-hidden rounded-lg shadow-article hover:shadow-hover transition-all duration-300"
      >
        <div className="relative h-96 overflow-hidden">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <Badge variant="destructive" className="mb-3">
              {category}
            </Badge>
            <h2 className="text-3xl font-serif font-bold mb-2 line-clamp-2">
              {title}
            </h2>
            <p className="text-sm text-gray-200 line-clamp-2">{description}</p>
            <p className="text-xs text-gray-300 mt-2">{formattedDate}</p>
          </div>
        </div>
      </Link>
    );
  }

  if (size === "small") {
    return (
      <Link
        to={`/article/${slug}`}
        className="group flex gap-4 hover:bg-news-hover p-3 rounded-lg transition-all duration-300"
      >
        {imageUrl && (
          <div className="relative w-32 h-24 flex-shrink-0 overflow-hidden rounded-lg">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-serif font-bold text-sm line-clamp-2 group-hover:text-accent transition-colors mb-2">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground">{formattedDate}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/article/${slug}`}
      className="group block overflow-hidden rounded-xl shadow-article hover:shadow-hover transition-all duration-300 bg-card"
    >
      {imageUrl ? (
        <div className="relative h-56 overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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
          {category}
        </Badge>
        <h3 className="font-serif font-bold text-xl line-clamp-2 mb-3 group-hover:text-accent transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {description}
        </p>
        <p className="text-xs text-muted-foreground">{formattedDate}</p>
      </div>
    </Link>
  );
};
