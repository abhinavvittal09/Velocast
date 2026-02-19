-- 008_scheduler.sql
-- Add optional caption override to posts and allow scheduling without a connected account

-- Per-post caption override (falls back to content_variant.caption in the UI)
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS caption TEXT;

-- Allow scheduling before a platform account is connected.
-- The cron job skips posts where connected_account_id IS NULL until the account is linked.
ALTER TABLE public.posts
  ALTER COLUMN connected_account_id DROP NOT NULL;

-- Index for the scheduler cron query (status + scheduled_at)
CREATE INDEX IF NOT EXISTS idx_posts_scheduler
  ON public.posts (status, scheduled_at)
  WHERE status = 'scheduled';
