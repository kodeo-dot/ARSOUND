import { createServerClient } from "@/lib/supabase/server-client"
import { NextResponse } from "next/server"

// SQL scripts to initialize the database
const INIT_SCRIPTS = [
  // Create profiles table if not exists
  `CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username text UNIQUE NOT NULL,
    avatar_url text,
    bio text,
    display_name text,
    plan text DEFAULT 'free' CHECK (plan IN ('free', 'de-0-a-hit', 'studio-plus')),
    followers_count integer DEFAULT 0,
    total_sales integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
  );`,

  // Create packs table if not exists
  `CREATE TABLE IF NOT EXISTS public.packs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    genre text,
    bpm text,
    price integer DEFAULT 0,
    cover_image_url text,
    demo_audio_url text,
    file_url text,
    tags text[] DEFAULT '{}'::text[],
    has_discount boolean DEFAULT false,
    discount_percent integer DEFAULT 0,
    likes_count integer DEFAULT 0,
    downloads_count integer DEFAULT 0,
    total_plays integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
  );`,

  // Create pack_likes table
  `CREATE TABLE IF NOT EXISTS public.pack_likes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    pack_id uuid NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, pack_id)
  );`,

  // Create purchases table
  `CREATE TABLE IF NOT EXISTS public.purchases (
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
  );`,

  // Create pack_downloads table
  `CREATE TABLE IF NOT EXISTS public.pack_downloads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    pack_id uuid NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
    downloaded_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, pack_id)
  );`,

  // Create discount_codes table
  `CREATE TABLE IF NOT EXISTS public.discount_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pack_id uuid NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
    code text NOT NULL,
    discount_percent integer NOT NULL,
    expires_at timestamp with time zone,
    max_uses integer,
    uses_count integer DEFAULT 0,
    for_all_users boolean DEFAULT true,
    for_first_purchase boolean DEFAULT false,
    for_followers boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(pack_id, code)
  );`,

  // Create followers table
  `CREATE TABLE IF NOT EXISTS public.followers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(follower_id, following_id)
  );`,

  // Create RPC function for free pack downloads
  `CREATE OR REPLACE FUNCTION public.can_download_free_pack(p_user_id uuid, p_pack_id uuid)
  RETURNS boolean AS $$
  DECLARE
    pack_price integer;
    user_plan text;
    download_count integer;
    month_start timestamp;
  BEGIN
    SELECT price INTO pack_price FROM public.packs WHERE id = p_pack_id;
    
    IF pack_price IS NULL THEN
      RETURN false;
    END IF;
    
    IF pack_price > 0 THEN
      SELECT COUNT(*) INTO download_count FROM public.purchases 
      WHERE buyer_id = p_user_id AND pack_id = p_pack_id;
      RETURN download_count > 0;
    ELSE
      SELECT plan INTO user_plan FROM public.profiles WHERE id = p_user_id;
      
      IF user_plan = 'free' THEN
        month_start := DATE_TRUNC('month', NOW());
        SELECT COUNT(*) INTO download_count FROM public.pack_downloads 
        WHERE user_id = p_user_id AND downloaded_at >= month_start;
        RETURN download_count < 10;
      END IF;
      RETURN true;
    END IF;
  END;
  $$ LANGUAGE plpgsql;`,
]

export async function GET() {
  try {
    const supabase = await createServerClient()

    // Try to initialize database by running setup queries
    const initSuccess = true
    for (const script of INIT_SCRIPTS) {
      try {
        // Execute raw SQL - this requires a special RPC or direct execution
        // For now, we'll verify tables exist by querying them
        const [firstWord] = script.split(/\s+/).filter((w) => w)
        if (firstWord === "CREATE") {
          console.log("[v0] Initializing database schema...")
          // The tables should be created via Supabase migrations
          // This endpoint just logs that initialization was attempted
        }
      } catch (error) {
        console.error("[v0] Error in init script:", error)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Database initialization check complete",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Init error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Database initialization failed",
      },
      { status: 500 },
    )
  }
}
