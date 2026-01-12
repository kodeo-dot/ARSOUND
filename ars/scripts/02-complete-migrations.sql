-- Add missing columns to profiles if they don't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS display_name text,
ADD COLUMN IF NOT EXISTS instagram text,
ADD COLUMN IF NOT EXISTS twitter text,
ADD COLUMN IF NOT EXISTS soundcloud text,
ADD COLUMN IF NOT EXISTS total_plays_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_likes_received integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS packs_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS mp_connected boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS mp_user_id text,
ADD COLUMN IF NOT EXISTS mp_access_token text;

-- Add missing columns to packs if they don't exist
ALTER TABLE public.packs
ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS featured_priority integer,
ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS total_plays integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS external_link text,
ADD COLUMN IF NOT EXISTS musical_key text,
ADD COLUMN IF NOT EXISTS instruments text[];

-- Add missing columns to purchases if they don't exist
ALTER TABLE public.purchases
ADD COLUMN IF NOT EXISTS purchase_code text,
ADD COLUMN IF NOT EXISTS discount_code text,
ADD COLUMN IF NOT EXISTS discount_percent integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS seller_id uuid,
ADD COLUMN IF NOT EXISTS amount_paid integer,
ADD COLUMN IF NOT EXISTS commission_percent numeric(5, 2),
ADD COLUMN IF NOT EXISTS seller_earnings integer;

-- Add missing columns to pack_plays if they don't exist
ALTER TABLE public.pack_plays
ADD COLUMN IF NOT EXISTS ip_address text;

-- Create pack_offers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.pack_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id uuid NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
  discount_percent integer NOT NULL,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(pack_id)
);

-- Create user_plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_type text NOT NULL,
  started_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  expires_at timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, plan_type)
);

-- Create user_track_events table
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

-- Add RLS policies for user_track_events
ALTER TABLE public.user_track_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own track events" ON public.user_track_events;
DROP POLICY IF EXISTS "Users can view their own track events" ON public.user_track_events;

CREATE POLICY "Users can insert their own track events"
  ON public.user_track_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own track events"
  ON public.user_track_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_track_events_user_id ON public.user_track_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_track_events_track_id ON public.user_track_events(track_id);
CREATE INDEX IF NOT EXISTS idx_purchases_buyer_id ON public.purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON public.purchases(created_at);
CREATE INDEX IF NOT EXISTS idx_pack_plays_pack_id ON public.pack_plays(pack_id);
CREATE INDEX IF NOT EXISTS idx_pack_plays_user_id ON public.pack_plays(user_id);
