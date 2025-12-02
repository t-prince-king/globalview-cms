-- Drop redundant indexes that overlap with composite indexes
DROP INDEX IF EXISTS idx_articles_featured;
DROP INDEX IF EXISTS idx_articles_breaking;
DROP INDEX IF EXISTS idx_articles_editors_pick;
DROP INDEX IF EXISTS idx_articles_category;

-- Optimized composite indexes matching actual query patterns
-- For featured articles sorted by published_at
CREATE INDEX IF NOT EXISTS idx_articles_featured_published 
ON articles(is_featured, published_at DESC) 
WHERE is_featured = true;

-- For breaking news sorted by published_at
CREATE INDEX IF NOT EXISTS idx_articles_breaking_published 
ON articles(is_breaking, published_at DESC) 
WHERE is_breaking = true;

-- For editor's picks sorted by published_at
CREATE INDEX IF NOT EXISTS idx_articles_editors_pick_published 
ON articles(is_editors_pick, published_at DESC) 
WHERE is_editors_pick = true;

-- For category pages sorted by published_at (covering index)
CREATE INDEX IF NOT EXISTS idx_articles_category_published 
ON articles(category, published_at DESC);

-- For popular/trending articles
CREATE INDEX IF NOT EXISTS idx_articles_views_desc 
ON articles(views DESC NULLS LAST);

-- For article lookup by slug (high frequency)
CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_slug_unique 
ON articles(slug);

-- For related articles query (category + exclude id)
CREATE INDEX IF NOT EXISTS idx_articles_related 
ON articles(category, id, published_at DESC);

-- For subscriptions user lookup
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_active 
ON subscriptions(user_id, is_active) 
WHERE is_active = true;

-- For bookmarks user lookup
CREATE INDEX IF NOT EXISTS idx_bookmarks_user 
ON article_bookmarks(user_id, created_at DESC);

-- For likes count aggregation
CREATE INDEX IF NOT EXISTS idx_likes_article 
ON article_likes(article_id, is_like);

-- For comments count and listing
CREATE INDEX IF NOT EXISTS idx_comments_article 
ON article_comments(article_id, created_at DESC);