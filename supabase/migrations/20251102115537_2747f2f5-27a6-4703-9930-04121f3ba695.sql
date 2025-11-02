-- Add content_blocks column to support structured content mixing text, images, and videos
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS content_blocks JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.articles.content_blocks IS 'Structured content blocks array with type (text/image/video), content/urls, and layout options';