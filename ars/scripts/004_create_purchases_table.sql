CREATE TABLE IF NOT EXISTS public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pack_id uuid NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  discount_amount integer DEFAULT 0,
  platform_commission integer DEFAULT 0,
  creator_earnings integer DEFAULT 0,
  status text DEFAULT 'completed',
  payment_method text,
  mercado_pago_payment_id text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS purchases_buyer_id_idx ON public.purchases(buyer_id);
CREATE INDEX IF NOT EXISTS purchases_pack_id_idx ON public.purchases(pack_id);
CREATE INDEX IF NOT EXISTS purchases_created_at_idx ON public.purchases(created_at DESC);
