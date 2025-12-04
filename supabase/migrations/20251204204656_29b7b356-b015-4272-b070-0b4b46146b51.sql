-- Create article_updates table for storing revisions/updates to articles
CREATE TABLE public.article_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.article_updates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view article updates"
ON public.article_updates
FOR SELECT
USING (true);

CREATE POLICY "Admins and editors can insert updates"
ON public.article_updates
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins and editors can update updates"
ON public.article_updates
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins can delete updates"
ON public.article_updates
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for efficient queries
CREATE INDEX idx_article_updates_article_id ON public.article_updates(article_id);
CREATE INDEX idx_article_updates_created_at ON public.article_updates(article_id, created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_article_updates_updated_at
BEFORE UPDATE ON public.article_updates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();