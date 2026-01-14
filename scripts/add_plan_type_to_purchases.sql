-- Add plan_type column to purchases table to support plan purchases
ALTER TABLE purchases
ADD COLUMN IF NOT EXISTS plan_type TEXT;

-- Allow pack_id and seller_id to be nullable since plans don't have these
ALTER TABLE purchases
ALTER COLUMN pack_id DROP NOT NULL,
ALTER COLUMN seller_id DROP NOT NULL;

-- Add check constraint to ensure either pack_id OR plan_type is set, but not both
ALTER TABLE purchases
ADD CONSTRAINT purchases_type_check 
CHECK (
  (pack_id IS NOT NULL AND plan_type IS NULL) OR 
  (pack_id IS NULL AND plan_type IS NOT NULL)
);
