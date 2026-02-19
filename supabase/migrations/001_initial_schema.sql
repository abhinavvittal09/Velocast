-- =============================================
-- Velocast — Initial Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ── Profiles ──────────────────────────────────────────────
CREATE TABLE public.profiles (
  id                    UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name             TEXT,
  avatar_url            TEXT,
  username              TEXT UNIQUE,
  plan                  TEXT DEFAULT 'free' CHECK (plan IN ('free', 'creator', 'pro', 'brand')),
  stripe_customer_id    TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  uploads_this_month    INT DEFAULT 0,
  ai_credits_used       INT DEFAULT 0,
  onboarding_complete   BOOLEAN DEFAULT false,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Connected Accounts ────────────────────────────────────
CREATE TABLE public.connected_accounts (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id           UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  platform          TEXT NOT NULL,
  platform_user_id  TEXT NOT NULL,
  platform_username TEXT,
  access_token      TEXT NOT NULL,
  refresh_token     TEXT,
  expires_at        TIMESTAMPTZ,
  scopes            TEXT[] DEFAULT '{}',
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, platform, platform_user_id)
);

-- ── Content Items (original uploads) ─────────────────────
CREATE TABLE public.content_items (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id          UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type             TEXT NOT NULL CHECK (type IN ('image', 'video')),
  title            TEXT,
  original_url     TEXT NOT NULL,
  file_size        BIGINT NOT NULL,
  duration_seconds NUMERIC,
  width            INT,
  height           INT,
  storage_path     TEXT NOT NULL,
  status           TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'error')),
  metadata         JSONB DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- ── Content Variants (platform-specific versions) ─────────
CREATE TABLE public.content_variants (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content_item_id       UUID REFERENCES public.content_items(id) ON DELETE CASCADE NOT NULL,
  platform              TEXT NOT NULL,
  variant_url           TEXT NOT NULL,
  storage_path          TEXT NOT NULL,
  width                 INT NOT NULL,
  height                INT NOT NULL,
  file_size             BIGINT NOT NULL,
  caption               TEXT,
  hashtags              TEXT[] DEFAULT '{}',
  subtitle_url          TEXT,
  subtitle_storage_path TEXT,
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- ── Scheduled / Published Posts ───────────────────────────
CREATE TABLE public.posts (
  id                   UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id              UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content_variant_id   UUID REFERENCES public.content_variants(id) ON DELETE CASCADE NOT NULL,
  platform             TEXT NOT NULL,
  connected_account_id UUID REFERENCES public.connected_accounts(id),
  scheduled_at         TIMESTAMPTZ,
  published_at         TIMESTAMPTZ,
  status               TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'failed')),
  platform_post_id     TEXT,
  platform_post_url    TEXT,
  error_message        TEXT,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

-- ── Analytics Snapshots ───────────────────────────────────
CREATE TABLE public.analytics_snapshots (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id          UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  captured_at      TIMESTAMPTZ DEFAULT now(),
  views            INT DEFAULT 0,
  likes            INT DEFAULT 0,
  comments         INT DEFAULT 0,
  shares           INT DEFAULT 0,
  saves            INT DEFAULT 0,
  reach            INT DEFAULT 0,
  impressions      INT DEFAULT 0,
  engagement_rate  NUMERIC DEFAULT 0
);

-- ── AI Usage Logs ─────────────────────────────────────────
CREATE TABLE public.ai_usage_logs (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  feature      TEXT NOT NULL, -- 'caption', 'hashtag', 'subtitle', 'brief'
  model        TEXT NOT NULL,
  input_tokens INT DEFAULT 0,
  output_tokens INT DEFAULT 0,
  cost_usd     NUMERIC DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ── Transform Jobs ────────────────────────────────────────
CREATE TABLE public.transform_jobs (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content_item_id  UUID REFERENCES public.content_items(id) ON DELETE CASCADE NOT NULL,
  status           TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'error')),
  platforms        TEXT[] DEFAULT '{}',
  progress         INT DEFAULT 0,
  error_message    TEXT,
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- ── Waitlist ──────────────────────────────────────────────
CREATE TABLE public.waitlist (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email      TEXT UNIQUE NOT NULL,
  name       TEXT,
  source     TEXT,
  invited    BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────
CREATE INDEX idx_content_items_user_id ON public.content_items(user_id);
CREATE INDEX idx_content_items_status ON public.content_items(status);
CREATE INDEX idx_content_variants_item_id ON public.content_variants(content_item_id);
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_status ON public.posts(status);
CREATE INDEX idx_posts_scheduled_at ON public.posts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_analytics_post_id ON public.analytics_snapshots(post_id);

-- ── Row Level Security ────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transform_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own connected accounts" ON public.connected_accounts FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own content" ON public.content_items FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own variants" ON public.content_variants
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.content_items WHERE id = content_item_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can insert own variants" ON public.content_variants
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.content_items WHERE id = content_item_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can manage own posts" ON public.posts FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own analytics" ON public.analytics_snapshots
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can view own AI usage" ON public.ai_usage_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transform jobs" ON public.transform_jobs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.content_items WHERE id = content_item_id AND user_id = auth.uid())
  );
