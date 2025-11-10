-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for subscriptions
CREATE POLICY "Anyone can subscribe" 
ON public.subscriptions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own subscription" 
ON public.subscriptions 
FOR SELECT 
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Users can update their own subscription" 
ON public.subscriptions 
FOR UPDATE 
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Admins can view all subscriptions" 
ON public.subscriptions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete subscriptions" 
ON public.subscriptions 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create subscription settings table
CREATE TABLE public.subscription_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  price DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_settings ENABLE ROW LEVEL SECURITY;

-- Policies for subscription settings
CREATE POLICY "Anyone can view subscription settings" 
ON public.subscription_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can update subscription settings" 
ON public.subscription_settings 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default settings
INSERT INTO public.subscription_settings (is_paid, price) VALUES (false, 0);

-- Add trigger for updated_at on subscriptions
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();