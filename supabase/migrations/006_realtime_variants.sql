-- 006_realtime_variants.sql
-- Enable Supabase Realtime on content_variants so the transform UI can
-- receive live updates as each platform variant is generated.

-- Required so postgres_changes events include the full row data
ALTER TABLE public.content_variants REPLICA IDENTITY FULL;

-- Add table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.content_variants;
