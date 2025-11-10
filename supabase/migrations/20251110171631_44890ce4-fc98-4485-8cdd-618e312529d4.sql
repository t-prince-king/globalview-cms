-- Add animation_type column to ticker_settings table
ALTER TABLE public.ticker_settings 
ADD COLUMN animation_type TEXT NOT NULL DEFAULT 'scroll';

-- Add check constraint to ensure valid animation types
ALTER TABLE public.ticker_settings
ADD CONSTRAINT ticker_settings_animation_type_check 
CHECK (animation_type IN ('scroll', 'fade', 'slide'));