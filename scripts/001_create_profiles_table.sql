-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  avatar_url text,
  bio text,
  display_name text,
  plan text DEFAULT 'free' CHECK (plan IN ('free', 'de-0-a-hit', 'studio-plus')),
  followers_count integer DEFAULT 0,
  total_sales integer DEFAULT 0,
  packs_count integer DEFAULT 0,
  total_plays integer DEFAULT 0,
  total_likes_received integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);
CREATE INDEX IF NOT EXISTS profiles_plan_idx ON public.profiles(plan);
