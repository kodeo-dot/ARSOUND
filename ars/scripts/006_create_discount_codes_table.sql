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

ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS discount_codes_pack_id_idx ON public.discount_codes(pack_id);
CREATE INDEX IF NOT EXISTS discount_codes_code_idx ON public.discount_codes(code);
