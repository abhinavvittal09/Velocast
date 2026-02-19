-- =============================================
-- Velocast — Processed (variants) storage bucket
-- =============================================

-- Create the 'processed' bucket for resized platform variants
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'processed',
  'processed',
  true,
  52428800, -- 50 MB max per variant
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read on processed files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND policyname = 'Processed files are publicly readable'
  ) THEN
    CREATE POLICY "Processed files are publicly readable"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'processed');
  END IF;
END $$;

-- Add unique constraint on content_variants (content_item_id, platform)
-- so we can upsert safely
ALTER TABLE public.content_variants
  DROP CONSTRAINT IF EXISTS content_variants_item_platform_unique;

ALTER TABLE public.content_variants
  ADD CONSTRAINT content_variants_item_platform_unique
  UNIQUE (content_item_id, platform);
