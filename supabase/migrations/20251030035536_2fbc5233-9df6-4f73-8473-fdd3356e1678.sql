-- Add support for multiple images and videos in articles
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS videos TEXT[] DEFAULT '{}';

-- Update existing articles to migrate single image to images array
UPDATE public.articles 
SET images = ARRAY[image_url]::TEXT[]
WHERE image_url IS NOT NULL AND (images IS NULL OR array_length(images, 1) IS NULL);

-- Create storage bucket for videos if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'article-videos', 
  'article-videos', 
  true,
  104857600, -- 100MB limit
  ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for video storage
CREATE POLICY "Anyone can view article videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'article-videos');

CREATE POLICY "Admins and editors can upload article videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'article-videos' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
);

CREATE POLICY "Admins and editors can delete article videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'article-videos'
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
);