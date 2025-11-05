-- Add author_email column to articles table
ALTER TABLE public.articles 
ADD COLUMN author_email text;

-- Add a comment to the column
COMMENT ON COLUMN public.articles.author_email IS 'Email address of the article author';