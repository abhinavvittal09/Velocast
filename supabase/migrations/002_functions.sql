-- =============================================
-- Velocast — Helper Functions
-- Run after 001_initial_schema.sql
-- =============================================

-- Increment monthly upload count
CREATE OR REPLACE FUNCTION public.increment_uploads(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET uploads_this_month = uploads_this_month + 1,
      updated_at = now()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reset monthly upload counts (run via cron on 1st of month)
CREATE OR REPLACE FUNCTION public.reset_monthly_uploads()
RETURNS void AS $$
BEGIN
  UPDATE public.profiles SET uploads_this_month = 0, updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment AI credits used
CREATE OR REPLACE FUNCTION public.increment_ai_credits(user_id UUID, amount INT DEFAULT 1)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET ai_credits_used = ai_credits_used + amount,
      updated_at = now()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
