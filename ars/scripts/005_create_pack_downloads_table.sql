CREATE TABLE IF NOT EXISTS public.pack_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pack_id uuid NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
  downloaded_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, pack_id)
);

ALTER TABLE public.pack_downloads ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS pack_downloads_user_id_idx ON public.pack_downloads(user_id);
CREATE INDEX IF NOT EXISTS pack_downloads_user_month_idx ON public.pack_downloads(user_id, downloaded_at DESC);
