-- 005_video_bucket_update.sql
-- Update processed bucket to accept video files and increase size limit

UPDATE storage.buckets
SET
  file_size_limit = 209715200, -- 200 MB (videos)
  allowed_mime_types = ARRAY[
    'image/jpeg', 'image/png', 'image/webp',
    'video/mp4', 'video/webm', 'video/quicktime'
  ]
WHERE id = 'processed';
