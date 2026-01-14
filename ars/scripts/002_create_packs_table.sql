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
  file_url text,
  tags text[] DEFAULT '{}'::text[],
  has_discount boolean DEFAULT false,
  discount_percent integer DEFAULT 0,
  likes_count integer DEFAULT 0,
  downloads_count integer DEFAULT 0,
  total_plays integer DEFAULT 0,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.packs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS packs_user_id_idx ON public.packs(user_id);
CREATE INDEX IF NOT EXISTS packs_created_at_idx ON public.packs(created_at DESC);
CREATE INDEX IF NOT EXISTS packs_price_idx ON public.packs(price);
