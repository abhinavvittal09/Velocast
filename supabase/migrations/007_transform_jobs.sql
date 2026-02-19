-- Day 12: Background Job Queue for async transforms
-- Stores one row per platform per content item; worker claims and processes them

CREATE TABLE IF NOT EXISTS public.transform_jobs (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content_item_id   UUID        REFERENCES public.content_items(id) ON DELETE CASCADE NOT NULL,
  platform          TEXT        NOT NULL,
  type              TEXT        NOT NULL,          -- 'image' | 'video'
  status            TEXT        NOT NULL DEFAULT 'pending', -- pending/processing/done/failed
  priority          INT         NOT NULL DEFAULT 5,
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  error_message     TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transform_jobs_pending
  ON public.transform_jobs (priority DESC, created_at ASC)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_transform_jobs_content_item
  ON public.transform_jobs (content_item_id);

-- RLS
ALTER TABLE public.transform_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transform jobs"
  ON public.transform_jobs FOR SELECT
  USING (auth.uid() = user_id);

-- Atomic batch-claim function: marks up to batch_size pending jobs as 'processing'
-- Uses FOR UPDATE SKIP LOCKED so concurrent cron invocations don't collide.
CREATE OR REPLACE FUNCTION public.claim_transform_jobs(batch_size INT DEFAULT 5)
RETURNS SETOF public.transform_jobs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    UPDATE public.transform_jobs
    SET status = 'processing', started_at = NOW()
    WHERE id IN (
      SELECT id FROM public.transform_jobs
      WHERE status = 'pending'
      ORDER BY priority DESC, created_at ASC
      LIMIT batch_size
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *;
END;
$$;

-- Realtime so TransformClient can show live status per platform
ALTER TABLE public.transform_jobs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transform_jobs;
