-- Add INSERT and DELETE policies for transform_jobs.
-- The SELECT policy already exists in 007_transform_jobs.sql.
-- These policies allow authenticated users to manage their own jobs
-- without requiring the service-role key to bypass RLS.

CREATE POLICY "Users can insert their own transform jobs"
  ON public.transform_jobs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own transform jobs"
  ON public.transform_jobs FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
