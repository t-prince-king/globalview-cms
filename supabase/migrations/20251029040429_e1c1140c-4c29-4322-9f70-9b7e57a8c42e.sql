-- Create storage bucket for article images
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-images', 'article-images', true);

-- Create RLS policies for article images
CREATE POLICY "Anyone can view article images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'article-images');

CREATE POLICY "Admins and editors can upload article images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'article-images' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
);

CREATE POLICY "Admins and editors can delete article images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'article-images' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
);