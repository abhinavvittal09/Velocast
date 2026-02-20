-- Allow authenticated users to upload processed variants.
-- The job processor runs as the service role (bypasses RLS), but this policy
-- ensures writes succeed even if the service role key is misconfigured.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND policyname = 'Authenticated users can upload processed variants'
  ) THEN
    CREATE POLICY "Authenticated users can upload processed variants"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'processed');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND policyname = 'Authenticated users can update processed variants'
  ) THEN
    CREATE POLICY "Authenticated users can update processed variants"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'processed');
  END IF;
END $$;
