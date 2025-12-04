import { memo } from "react";
import { format } from "date-fns";

interface ArticleUpdate {
  id: string;
  content: string;
  images: string[];
  created_at: string;
}

interface ArticleUpdatesProps {
  updates: ArticleUpdate[];
}

export const ArticleUpdates = memo(({ updates }: ArticleUpdatesProps) => {
  if (!updates || updates.length === 0) return null;

  return (
    <section className="mt-12 pt-8 border-t" aria-label="Article Updates">
      <h2 className="text-2xl font-serif font-bold mb-6 text-center">
        Updates & Corrections
      </h2>
      <div className="space-y-6 max-w-3xl mx-auto">
        {updates.map((update, index) => (
          <article
            key={update.id}
            className="border-l-4 border-primary pl-4 py-3 bg-muted/30 rounded-r-lg"
            itemScope
            itemType="https://schema.org/CorrectionComment"
          >
            <header className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold text-primary">
                Update #{index + 1}
              </span>
              <span className="text-xs text-muted-foreground">
                — <time itemProp="datePublished" dateTime={update.created_at}>
                  {format(new Date(update.created_at), "MMMM d, yyyy")}
                </time>
              </span>
            </header>
            
            <div className="prose prose-sm max-w-none" itemProp="text">
              {update.content.split("\n\n").map((paragraph, pIndex) => (
                <p key={pIndex} className="mb-2 text-foreground leading-relaxed">
                  {paragraph.split("\n").map((line, lIndex) => (
                    <span key={lIndex}>
                      {line}
                      {lIndex < paragraph.split("\n").length - 1 && <br />}
                    </span>
                  ))}
                </p>
              ))}
            </div>

            {update.images && update.images.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4">
                {update.images.map((imageUrl, imgIndex) => (
                  <figure key={imgIndex} className="m-0">
                    <img
                      src={imageUrl}
                      alt={`Update ${index + 1} - Image ${imgIndex + 1}`}
                      className="max-w-full sm:max-w-[300px] rounded-lg shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                      loading="lazy"
                      onClick={() => window.open(imageUrl, '_blank')}
                    />
                  </figure>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
});

ArticleUpdates.displayName = "ArticleUpdates";
