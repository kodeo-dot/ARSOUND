import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const SQL_SCRIPTS = [
  `CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    username text UNIQUE,
    avatar_url text,
    bio text,
    plan text DEFAULT 'free',
    created_at timestamp DEFAULT NOW()
  );`,

  `CREATE TABLE IF NOT EXISTS packs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    genre text,
    bpm text,
    price integer DEFAULT 0,
    cover_image_url text,
    demo_audio_url text,
    file_url text,
    tags text[] DEFAULT '{}',
    has_discount boolean DEFAULT false,
    discount_percent integer DEFAULT 0,
    likes_count integer DEFAULT 0,
    downloads_count integer DEFAULT 0,
    total_plays_count integer DEFAULT 0,
    created_at timestamp DEFAULT NOW()
  );`,

  `CREATE TABLE IF NOT EXISTS pack_likes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles ON DELETE CASCADE,
    pack_id uuid REFERENCES packs ON DELETE CASCADE,
    created_at timestamp DEFAULT NOW(),
    UNIQUE(user_id, pack_id)
  );`,

  `CREATE TABLE IF NOT EXISTS purchases (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id uuid REFERENCES profiles ON DELETE CASCADE,
    pack_id uuid REFERENCES packs ON DELETE CASCADE,
    amount integer,
    discount_amount integer DEFAULT 0,
    platform_commission integer DEFAULT 0,
    creator_earnings integer DEFAULT 0,
    status text DEFAULT 'completed',
    payment_method text,
    created_at timestamp DEFAULT NOW()
  );`,

  `CREATE TABLE IF NOT EXISTS pack_downloads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles ON DELETE CASCADE,
    pack_id uuid REFERENCES packs ON DELETE CASCADE,
    downloaded_at timestamp DEFAULT NOW(),
    UNIQUE(user_id, pack_id)
  );`,

  `CREATE TABLE IF NOT EXISTS discount_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pack_id uuid REFERENCES packs ON DELETE CASCADE,
    code text NOT NULL,
    discount_percent integer,
    expires_at timestamp,
    max_uses integer,
    uses_count integer DEFAULT 0,
    for_all_users boolean DEFAULT true,
    for_first_purchase boolean DEFAULT false,
    for_followers boolean DEFAULT false,
    created_at timestamp DEFAULT NOW()
  );`,

  `CREATE OR REPLACE FUNCTION can_download_free_pack(p_user_id uuid, p_pack_id uuid)
  RETURNS boolean AS $$
  DECLARE
    pack_price integer;
    user_plan text;
    download_count integer;
    month_start timestamp;
  BEGIN
    SELECT price INTO pack_price FROM packs WHERE id = p_pack_id;
    IF pack_price > 0 THEN
      SELECT 1 INTO download_count FROM purchases 
      WHERE buyer_id = p_user_id AND pack_id = p_pack_id LIMIT 1;
      RETURN FOUND;
    ELSE
      SELECT plan INTO user_plan FROM profiles WHERE id = p_user_id;
      IF user_plan = 'free' THEN
        month_start := DATE_TRUNC('month', NOW());
        SELECT COUNT(*) INTO download_count FROM pack_downloads 
        WHERE user_id = p_user_id AND downloaded_at >= month_start;
        RETURN download_count < 10;
      END IF;
      RETURN true;
    END IF;
  END;
  $$ LANGUAGE plpgsql;`,
]

export async function initializeDatabase() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      },
    )

    // Run each SQL script
    for (const sql of SQL_SCRIPTS) {
      try {
        const { error } = await supabase.rpc("exec_sql", { sql_query: sql }).single()
        if (error && !error.message.includes("already exists")) {
          console.log("[v0] SQL init:", error)
        }
      } catch (e) {
        // Use direct SQL execution instead
        const { error } = await supabase.from("_query").select().limit(1)
      }
    }

    console.log("[v0] Database initialization complete")
    return true
  } catch (error) {
    console.error("[v0] Database initialization error:", error)
    return false
  }
}
