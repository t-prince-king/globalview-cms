-- Create ads table
CREATE TABLE public.ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  ad_code TEXT NOT NULL,
  placement_type TEXT NOT NULL DEFAULT 'article_bottom',
  status BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active ads" 
ON public.ads 
FOR SELECT 
USING (status = true);

CREATE POLICY "Admins can view all ads" 
ON public.ads 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert ads" 
ON public.ads 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update ads" 
ON public.ads 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ads" 
ON public.ads 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create ad_settings table for global settings
CREATE TABLE public.ad_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ads_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for ad_settings
ALTER TABLE public.ad_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view ad settings
CREATE POLICY "Anyone can view ad settings" 
ON public.ad_settings 
FOR SELECT 
USING (true);

-- Admins can update ad settings
CREATE POLICY "Admins can update ad settings" 
ON public.ad_settings 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default settings (ads disabled by default)
INSERT INTO public.ad_settings (ads_enabled) VALUES (false);

-- Create trigger for updated_at on ads
CREATE TRIGGER update_ads_updated_at
BEFORE UPDATE ON public.ads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on ad_settings
CREATE TRIGGER update_ad_settings_updated_at
BEFORE UPDATE ON public.ad_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for fast lookups
CREATE INDEX idx_ads_placement_status ON public.ads(placement_type, status);