-- Add indexes for frequently queried columns to improve performance
CREATE INDEX IF NOT EXISTS idx_articles_category ON public.articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_is_featured ON public.articles(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_articles_is_breaking ON public.articles(is_breaking) WHERE is_breaking = true;
CREATE INDEX IF NOT EXISTS idx_articles_is_editors_pick ON public.articles(is_editors_pick) WHERE is_editors_pick = true;
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON public.articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_views ON public.articles(views DESC);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_articles_featured_published ON public.articles(is_featured, published_at DESC) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_articles_category_published ON public.articles(category, published_at DESC);

-- Indexes for other tables
CREATE INDEX IF NOT EXISTS idx_article_bookmarks_user ON public.article_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_article_likes_article ON public.article_likes(article_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_article ON public.article_comments(article_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON public.subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_ticker_items_active ON public.ticker_items(is_active, display_order) WHERE is_active = true;