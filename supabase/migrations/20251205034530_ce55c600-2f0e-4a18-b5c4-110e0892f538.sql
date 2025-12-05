-- Add title and keywords columns to article_updates table
ALTER TABLE public.article_updates 
ADD COLUMN title TEXT,
ADD COLUMN keywords TEXT[];

-- Add comment for documentation
COMMENT ON COLUMN public.article_updates.title IS 'Optional title for the update (e.g., Correction, New Info)';
COMMENT ON COLUMN public.article_updates.keywords IS 'Optional SEO keywords specific to this update';