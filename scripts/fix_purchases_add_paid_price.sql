-- Add missing columns to purchases table for tracking paid amounts
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS seller_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS paid_price integer; -- Actual amount paid (with discount applied)
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS base_amount integer; -- Original price before discount
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS final_price integer; -- Alias for paid_price (for consistency)

-- Update existing purchases to have paid_price = amount if not set
UPDATE public.purchases
SET paid_price = amount
WHERE paid_price IS NULL;

-- Create index for seller_id for faster queries
CREATE INDEX IF NOT EXISTS idx_purchases_seller_id ON public.purchases(seller_id);

-- Add comment to clarify column usage
COMMENT ON COLUMN public.purchases.paid_price IS 'Actual price paid by buyer (after discounts)';
COMMENT ON COLUMN public.purchases.base_amount IS 'Original pack price before any discounts';
COMMENT ON COLUMN public.purchases.platform_commission IS 'Platform commission (net earnings for platform)';
COMMENT ON COLUMN public.purchases.creator_earnings IS 'Creator earnings after commission';
