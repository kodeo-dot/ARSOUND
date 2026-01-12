-- Complete database initialization script for ARSOUND

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table with all fields
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text,
  bio text,
  avatar_url text,
  plan text DEFAULT 'free' CHECK (plan IN ('free', 'de_0_a_hit', 'de-0-a-hit', 'studio_plus', 'studio-plus')),
  instagram text,
  twitter text,
  soundcloud text,
  followers_count integer DEFAULT 0,
  total_sales integer DEFAULT 0,
  total_plays_count integer DEFAULT 0,
  total_likes_received integer DEFAULT 0,
  packs_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create packs table with all fields
CREATE TABLE IF NOT EXISTS public.packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  genre text,
  bpm text,
  musical_key text,
  price integer DEFAULT 0,
  cover_image_url text,
  demo_audio_url text,
  file_url text NOT NULL,
  tags text[] DEFAULT '{}'::text[],
  instruments text[] DEFAULT '{}'::text[],
  has_discount boolean DEFAULT false,
  discount_percent integer DEFAULT 0,
  likes_count integer DEFAULT 0,
  downloads_count integer DEFAULT 0,
  total_plays integer DEFAULT 0,
  is_deleted boolean DEFAULT false,
  featured_priority integer DEFAULT 0,
  is_pinned boolean DEFAULT false,
  external_link text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create pack_likes table
CREATE TABLE IF NOT EXISTS public.pack_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pack_id uuid NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, pack_id)
);

-- Create pack_downloads table
CREATE TABLE IF NOT EXISTS public.pack_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pack_id uuid NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
  downloaded_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, pack_id)
);

-- Create pack_plays table
CREATE TABLE IF NOT EXISTS public.pack_plays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  pack_id uuid NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
  ip_address text,
  played_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create purchases table
CREATE TABLE IF NOT EXISTS public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pack_id uuid NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  discount_amount integer DEFAULT 0,
  platform_commission integer DEFAULT 0,
  creator_earnings integer DEFAULT 0,
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method text DEFAULT 'mercado_pago',
  mercado_pago_payment_id text UNIQUE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create discount_codes table
CREATE TABLE IF NOT EXISTS public.discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id uuid NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
  code text NOT NULL,
  discount_percent integer NOT NULL,
  expires_at timestamp with time zone,
  max_uses integer,
  uses_count integer DEFAULT 0,
  for_all_users boolean DEFAULT true,
  for_first_purchase boolean DEFAULT false,
  for_followers boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(pack_id, code)
);

-- Create pack_offers table
CREATE TABLE IF NOT EXISTS public.pack_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id uuid NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
  discount_percent integer NOT NULL,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create followers table
CREATE TABLE IF NOT EXISTS public.followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(follower_id, following_id)
);

-- Create user_plans table
CREATE TABLE IF NOT EXISTS public.user_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_type text NOT NULL CHECK (plan_type IN ('free', 'de_0_a_hit', 'de-0-a-hit', 'studio_plus', 'studio-plus')),
  is_active boolean DEFAULT true,
  started_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_packs_user_id ON public.packs(user_id);
CREATE INDEX IF NOT EXISTS idx_packs_created_at ON public.packs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pack_likes_pack_id ON public.pack_likes(pack_id);
CREATE INDEX IF NOT EXISTS idx_pack_likes_user_id ON public.pack_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_pack_downloads_pack_id ON public.pack_downloads(pack_id);
CREATE INDEX IF NOT EXISTS idx_purchases_buyer_id ON public.purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_pack_id ON public.purchases(pack_id);
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON public.followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON public.followers(following_id);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pack_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pack_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- RLS Policies for packs
CREATE POLICY "Packs are viewable by everyone" ON public.packs
  FOR SELECT USING (is_deleted = false);

CREATE POLICY "Users can insert their own packs" ON public.packs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own packs" ON public.packs
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for purchases
CREATE POLICY "Users can view their own purchases" ON public.purchases
  FOR SELECT USING (auth.uid() = buyer_id OR pack_id IN (
    SELECT id FROM public.packs WHERE user_id = auth.uid()
  ));

CREATE POLICY "System can insert purchases" ON public.purchases
  FOR INSERT WITH CHECK (true);

-- RLS Policies for user_plans
CREATE POLICY "Users can view their own plan" ON public.user_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own plan" ON public.user_plans
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
