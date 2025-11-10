-- Add font_family column to ticker_settings table
ALTER TABLE ticker_settings 
ADD COLUMN IF NOT EXISTS font_family text NOT NULL DEFAULT 'inter';