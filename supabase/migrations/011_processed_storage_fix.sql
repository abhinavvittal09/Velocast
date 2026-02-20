-- Fix the UPDATE policy on storage.objects for the processed bucket.
-- The previous migration was missing WITH CHECK on the UPDATE policy,
-- which caused upsert operations to fail RLS checks.

DO $$
BEGIN
  -- Drop old incomplete UPDATE policy
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
      AND policyname = 'Authenticated users can update processed variants'
  ) THEN
    DROP POLICY "Authenticated users can update processed variants" ON storage.objects;
  END IF;
END $$;

-- Recreate with both USING and WITH CHECK
CREATE POLICY "Authenticated users can update processed variants"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING   (bucket_id = 'processed')
  WITH CHECK (bucket_id = 'processed');

-- Also add a DELETE policy so upsert cleanup works
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
      AND policyname = 'Authenticated users can delete processed variants'
  ) THEN
    CREATE POLICY "Authenticated users can delete processed variants"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'processed');
  END IF;
END $$;
