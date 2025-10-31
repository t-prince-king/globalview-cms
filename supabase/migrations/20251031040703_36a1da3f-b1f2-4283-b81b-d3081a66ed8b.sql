-- Normalize existing article slugs and enforce uniqueness
WITH normalized AS (
  SELECT 
    id,
    TRIM(BOTH '-' FROM LOWER(regexp_replace(trim(slug), '[^a-z0-9]+', '-', 'gi'))) AS norm,
    created_at
  FROM public.articles
), ranked AS (
  SELECT 
    n.id,
    n.norm,
    ROW_NUMBER() OVER (PARTITION BY n.norm ORDER BY n.created_at, n.id) AS rn
  FROM normalized n
)
UPDATE public.articles a
SET slug = CASE 
  WHEN r.rn = 1 THEN r.norm
  ELSE r.norm || '-' || (r.rn - 1)
END
FROM ranked r
WHERE a.id = r.id;

-- Add a unique index on slug to avoid future duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_indexes 
    WHERE schemaname = 'public' AND indexname = 'articles_slug_unique_idx'
  ) THEN
    CREATE UNIQUE INDEX articles_slug_unique_idx ON public.articles(slug);
  END IF;
END $$;

-- Optional: ensure slug matches pattern (letters, numbers, hyphens)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'articles_slug_format_check'
  ) THEN
    ALTER TABLE public.articles
    ADD CONSTRAINT articles_slug_format_check
    CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
  END IF;
END $$;