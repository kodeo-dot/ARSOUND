CREATE TABLE IF NOT EXISTS public.pack_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pack_id uuid NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, pack_id)
);

ALTER TABLE public.pack_likes ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS pack_likes_user_id_idx ON public.pack_likes(user_id);
CREATE INDEX IF NOT EXISTS pack_likes_pack_id_idx ON public.pack_likes(pack_id);
