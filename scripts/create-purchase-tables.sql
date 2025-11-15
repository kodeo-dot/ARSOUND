-- Ensure purchases table has all required columns
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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_purchases_buyer_id ON public.purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_pack_id ON public.purchases(pack_id);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON public.purchases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_mp_payment_id ON public.purchases(mercado_pago_payment_id);

-- Enable RLS on purchases table
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- RLS policies for purchases
CREATE POLICY "Buyers can view their own purchases"
ON public.purchases
FOR SELECT
USING (buyer_id = auth.uid() OR
  pack_id IN (
    SELECT id FROM public.packs WHERE user_id = auth.uid()
  ));

CREATE POLICY "System can insert purchases"
ON public.purchases
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Buyers can update their own purchases"
ON public.purchases
FOR UPDATE
USING (buyer_id = auth.uid())
WITH CHECK (buyer_id = auth.uid());

-- Ensure pack_downloads table has proper RLS
ALTER TABLE public.pack_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view their own downloads"
ON public.pack_downloads
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "System can insert downloads"
ON public.pack_downloads
FOR INSERT
WITH CHECK (true);

-- Create trigger to update pack download count on new download
CREATE OR REPLACE FUNCTION public.update_pack_stats_on_download()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.packs
  SET downloads_count = downloads_count + 1
  WHERE id = NEW.pack_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF NOT EXISTS trigger_update_downloads ON public.pack_downloads;
CREATE TRIGGER trigger_update_downloads
AFTER INSERT ON public.pack_downloads
FOR EACH ROW
EXECUTE FUNCTION public.update_pack_stats_on_download();

-- Create function to get user's purchase history
CREATE OR REPLACE FUNCTION public.get_user_purchases(p_user_id uuid, p_limit integer DEFAULT 50)
RETURNS TABLE (
  id uuid,
  pack_id uuid,
  pack_title text,
  amount integer,
  discount_amount integer,
  platform_commission integer,
  creator_earnings integer,
  status text,
  payment_method text,
  created_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.pack_id,
    pk.title,
    p.amount,
    p.discount_amount,
    p.platform_commission,
    p.creator_earnings,
    p.status,
    p.payment_method,
    p.created_at
  FROM public.purchases p
  JOIN public.packs pk ON p.pack_id = pk.id
  WHERE p.buyer_id = p_user_id
  ORDER BY p.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to get seller's earnings
CREATE OR REPLACE FUNCTION public.get_seller_earnings(
  p_seller_id uuid,
  p_start_date timestamp DEFAULT NULL,
  p_end_date timestamp DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  total_earnings integer;
  total_sales integer;
  commission_earned integer;
BEGIN
  SELECT
    COALESCE(SUM(pu.creator_earnings), 0)::integer,
    COUNT(pu.id)::integer,
    COALESCE(SUM(pu.platform_commission), 0)::integer
  INTO total_earnings, total_sales, commission_earned
  FROM public.purchases pu
  JOIN public.packs pk ON pu.pack_id = pk.id
  WHERE pk.user_id = p_seller_id
    AND pu.status = 'completed'
    AND (p_start_date IS NULL OR pu.created_at >= p_start_date)
    AND (p_end_date IS NULL OR pu.created_at <= p_end_date);

  result := jsonb_build_object(
    'total_earnings', total_earnings,
    'total_sales', total_sales,
    'commission_earned', commission_earned,
    'period_start', COALESCE(p_start_date, 'all_time'),
    'period_end', COALESCE(p_end_date, 'present')
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
