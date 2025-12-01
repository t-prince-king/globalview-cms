-- Create table for 404 page settings
CREATE TABLE public.page_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_type TEXT NOT NULL UNIQUE DEFAULT 'not_found',
  title TEXT NOT NULL DEFAULT 'Page Not Found',
  subtitle TEXT DEFAULT 'The page you are looking for doesn''t exist or has been moved.',
  content TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  button_text TEXT DEFAULT 'Return to Home',
  button_link TEXT DEFAULT '/',
  show_ads BOOLEAN DEFAULT true,
  ad_content TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.page_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view page settings
CREATE POLICY "Anyone can view page settings"
ON public.page_settings
FOR SELECT
USING (true);

-- Admins can update page settings
CREATE POLICY "Admins can update page settings"
ON public.page_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert page settings
CREATE POLICY "Admins can insert page settings"
ON public.page_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default 404 page settings
INSERT INTO public.page_settings (page_type, title, subtitle, button_text, button_link)
VALUES ('not_found', '404 - Page Not Found', 'Oops! The page you''re looking for doesn''t exist.', 'Go to Homepage', '/');