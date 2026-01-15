-- Add paid_price column to purchases table if it doesn't exist
-- This tracks the actual amount paid by the customer (after discounts)
-- Different from amount which might be the base price in old records

DO $$ 
BEGIN
  -- Add paid_price if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'purchases' AND column_name = 'paid_price'
  ) THEN
    ALTER TABLE public.purchases ADD COLUMN paid_price integer;
    
    -- Backfill paid_price with amount for existing records
    UPDATE public.purchases 
    SET paid_price = amount 
    WHERE paid_price IS NULL;
    
    RAISE NOTICE 'Added paid_price column to purchases table';
  END IF;
  
  -- Add base_amount if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'purchases' AND column_name = 'base_amount'
  ) THEN
    ALTER TABLE public.purchases ADD COLUMN base_amount integer;
    
    -- Backfill base_amount with amount for existing records
    UPDATE public.purchases 
    SET base_amount = amount 
    WHERE base_amount IS NULL;
    
    RAISE NOTICE 'Added base_amount column to purchases table';
  END IF;

  -- Add seller_id if it doesn't exist (for pack purchases)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'purchases' AND column_name = 'seller_id'
  ) THEN
    ALTER TABLE public.purchases ADD COLUMN seller_id uuid REFERENCES public.profiles(id);
    
    RAISE NOTICE 'Added seller_id column to purchases table';
  END IF;

  -- Add seller_mp_user_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'purchases' AND column_name = 'seller_mp_user_id'
  ) THEN
    ALTER TABLE public.purchases ADD COLUMN seller_mp_user_id text;
    
    RAISE NOTICE 'Added seller_mp_user_id column to purchases table';
  END IF;

  -- Add commission_percent if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'purchases' AND column_name = 'commission_percent'
  ) THEN
    ALTER TABLE public.purchases ADD COLUMN commission_percent decimal(5,4);
    
    RAISE NOTICE 'Added commission_percent column to purchases table';
  END IF;

  -- Add payment_status if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'purchases' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE public.purchases ADD COLUMN payment_status text DEFAULT 'completed';
    
    -- Update existing records to use status value
    UPDATE public.purchases 
    SET payment_status = status 
    WHERE payment_status IS NULL;
    
    RAISE NOTICE 'Added payment_status column to purchases table';
  END IF;

  -- Add purchase_code if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'purchases' AND column_name = 'purchase_code'
  ) THEN
    ALTER TABLE public.purchases ADD COLUMN purchase_code text UNIQUE;
    
    RAISE NOTICE 'Added purchase_code column to purchases table';
  END IF;

  -- Add plan_type column for plan purchases if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'purchases' AND column_name = 'plan_type'
  ) THEN
    ALTER TABLE public.purchases ADD COLUMN plan_type text;
    
    RAISE NOTICE 'Added plan_type column to purchases table';
  END IF;

END $$;

-- Create index on paid_price for better query performance
CREATE INDEX IF NOT EXISTS idx_purchases_paid_price ON public.purchases(paid_price);

-- Create index on payment_status
CREATE INDEX IF NOT EXISTS idx_purchases_payment_status ON public.purchases(payment_status);
