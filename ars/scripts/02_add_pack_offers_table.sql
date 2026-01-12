-- Create pack_offers table to track time-based promotional offers
CREATE TABLE IF NOT EXISTS public.pack_offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pack_id UUID NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
  discount_percent INTEGER NOT NULL CHECK (discount_percent >= 5 AND discount_percent <= 100),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT valid_date_range CHECK (end_date > start_date),
  CONSTRAINT no_overlapping_offers UNIQUE(pack_id, start_date, end_date)
);

-- Enable RLS
ALTER TABLE public.pack_offers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active offers"
  ON public.pack_offers FOR SELECT
  USING (true);

CREATE POLICY "Pack owners can manage offers"
  ON public.pack_offers FOR ALL
  USING (
    pack_id IN (
      SELECT id FROM public.packs WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    pack_id IN (
      SELECT id FROM public.packs WHERE user_id = auth.uid()
    )
  );

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_pack_offers_pack_id ON public.pack_offers(pack_id);
CREATE INDEX IF NOT EXISTS idx_pack_offers_dates ON public.pack_offers(start_date, end_date);

-- Helper function to get active offer for a pack
CREATE OR REPLACE FUNCTION get_active_offer(p_pack_id UUID)
RETURNS TABLE (
  id UUID,
  discount_percent INTEGER,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    po.id,
    po.discount_percent,
    po.start_date,
    po.end_date
  FROM public.pack_offers po
  WHERE po.pack_id = p_pack_id
    AND po.start_date <= NOW()
    AND po.end_date >= NOW()
  ORDER BY po.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;
