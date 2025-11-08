-- Create ticker items table for custom content
CREATE TABLE public.ticker_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  link_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ticker settings table
CREATE TABLE public.ticker_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  display_mode TEXT NOT NULL DEFAULT 'breaking_news',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CHECK (display_mode IN ('breaking_news', 'custom', 'both'))
);

-- Insert default settings
INSERT INTO public.ticker_settings (display_mode) VALUES ('breaking_news');

-- Enable RLS
ALTER TABLE public.ticker_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticker_settings ENABLE ROW LEVEL SECURITY;

-- Policies for ticker_items
CREATE POLICY "Anyone can view active ticker items"
ON public.ticker_items
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage ticker items"
ON public.ticker_items
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policies for ticker_settings
CREATE POLICY "Anyone can view ticker settings"
ON public.ticker_settings
FOR SELECT
USING (true);

CREATE POLICY "Admins can update ticker settings"
ON public.ticker_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for ticker_items updated_at
CREATE TRIGGER update_ticker_items_updated_at
BEFORE UPDATE ON public.ticker_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();