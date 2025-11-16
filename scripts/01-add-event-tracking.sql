-- Create user_track_events table to prevent duplicate counting
CREATE TABLE IF NOT EXISTS public.user_track_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  track_id uuid NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
  played boolean DEFAULT false,
  downloaded boolean DEFAULT false,
  purchased boolean DEFAULT false,
  liked boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, track_id)
);

-- Add new columns to purchases table for enhanced details
ALTER TABLE public.purchases
ADD COLUMN IF NOT EXISTS purchase_code text,
ADD COLUMN IF NOT EXISTS discount_code text,
ADD COLUMN IF NOT EXISTS discount_percent integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'completed';

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_track_events_user_id ON public.user_track_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_track_events_track_id ON public.user_track_events(track_id);
CREATE INDEX IF NOT EXISTS idx_purchases_buyer_id ON public.purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON public.purchases(created_at);

-- Add RLS policies for user_track_events
ALTER TABLE public.user_track_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own track events"
  ON public.user_track_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own track events"
  ON public.user_track_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Generate purchase codes for existing purchases without them
UPDATE public.purchases
SET purchase_code = UPPER(SUBSTR(MD5(RANDOM()::text || id::text), 1, 8))
WHERE purchase_code IS NULL;
