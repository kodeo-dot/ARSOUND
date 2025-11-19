-- Add seller_mp_user_id column to purchases table
-- This column stores the Mercado Pago user ID of the seller to route payments correctly

ALTER TABLE purchases
ADD COLUMN IF NOT EXISTS seller_mp_user_id TEXT;

-- Add index for performance when querying by seller_mp_user_id
CREATE INDEX IF NOT EXISTS idx_purchases_seller_mp_user_id 
ON purchases(seller_mp_user_id);

-- Add comment to document the column
COMMENT ON COLUMN purchases.seller_mp_user_id IS 'Mercado Pago user ID of the seller - used for routing payments to the correct seller account';
