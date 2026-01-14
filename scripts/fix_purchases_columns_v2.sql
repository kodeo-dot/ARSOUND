-- Ensure all required columns exist in purchases table
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS seller_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS paid_price integer;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS base_amount integer;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS plan_type text;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS seller_mp_user_id text;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS purchase_code text;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS commission_percent numeric(5,2) DEFAULT 0;

-- Migrate existing data: set paid_price and base_amount from amount if not set
UPDATE public.purchases
SET 
  paid_price = COALESCE(paid_price, amount),
  base_amount = COALESCE(base_amount, amount + discount_amount, amount)
WHERE paid_price IS NULL OR base_amount IS NULL;

-- For pack purchases: calculate creator_earnings and platform_commission if missing
-- Join with packs table to get seller info
UPDATE public.purchases p
SET 
  seller_id = COALESCE(p.seller_id, pk.user_id),
  creator_earnings = CASE 
    WHEN p.creator_earnings = 0 OR p.creator_earnings IS NULL THEN
      CASE 
        WHEN pr.plan = 'studio_plus' THEN CAST(p.paid_price * 0.95 AS INTEGER)
        WHEN pr.plan = 'de_0_a_hit' THEN CAST(p.paid_price * 0.90 AS INTEGER)
        ELSE CAST(p.paid_price * 0.70 AS INTEGER)
      END
    ELSE p.creator_earnings
  END,
  platform_commission = CASE
    WHEN p.platform_commission = 0 OR p.platform_commission IS NULL THEN
      CASE 
        WHEN pr.plan = 'studio_plus' THEN CAST(p.paid_price * 0.05 AS INTEGER)
        WHEN pr.plan = 'de_0_a_hit' THEN CAST(p.paid_price * 0.10 AS INTEGER)
        ELSE CAST(p.paid_price * 0.30 AS INTEGER)
      END
    ELSE p.platform_commission
  END,
  commission_percent = CASE
    WHEN pr.plan = 'studio_plus' THEN 5
    WHEN pr.plan = 'de_0_a_hit' THEN 10
    ELSE 30
  END
FROM public.packs pk
LEFT JOIN public.profiles pr ON pk.user_id = pr.id
WHERE p.pack_id = pk.id
  AND p.pack_id IS NOT NULL
  AND (p.creator_earnings = 0 OR p.creator_earnings IS NULL OR p.platform_commission = 0 OR p.platform_commission IS NULL);

-- For plan purchases: set platform_commission = paid_price (100% goes to platform)
UPDATE public.purchases
SET 
  platform_commission = paid_price,
  creator_earnings = 0,
  seller_id = NULL
WHERE plan_type IS NOT NULL 
  AND pack_id IS NULL
  AND (platform_commission != paid_price OR creator_earnings != 0);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_purchases_seller_id ON public.purchases(seller_id);
CREATE INDEX IF NOT EXISTS idx_purchases_plan_type ON public.purchases(plan_type);
CREATE INDEX IF NOT EXISTS idx_purchases_pack_id_status ON public.purchases(pack_id, status);

-- Add helpful comments
COMMENT ON COLUMN public.purchases.paid_price IS 'Actual price paid by buyer (after discounts applied)';
COMMENT ON COLUMN public.purchases.base_amount IS 'Original price before any discounts';
COMMENT ON COLUMN public.purchases.platform_commission IS 'Platform commission - net earnings for platform';
COMMENT ON COLUMN public.purchases.creator_earnings IS 'Creator earnings after commission (0 for plan purchases)';
COMMENT ON COLUMN public.purchases.seller_id IS 'Pack creator/seller ID (NULL for plan purchases)';
COMMENT ON COLUMN public.purchases.plan_type IS 'Plan type if this is a plan purchase (NULL for pack purchases)';
