// Script to initialize sample data and verify setup
// Run after migrations are complete

import { createServerClient } from "@/lib/supabase/server-client"

export async function initializeData() {
  try {
    const supabase = await createServerClient()
    
    console.log("[v0] Verifying tables exist...")
    
    // Verify critical tables exist
    const tables = [
      "profiles",
      "packs",
      "purchases",
      "user_track_events",
      "pack_plays",
      "pack_likes",
      "pack_downloads",
      "discount_codes",
    ]

    for (const table of tables) {
      const { error } = await supabase.from(table).select("count()", { count: "exact" })
      if (error) {
        console.warn(`[v0] Table ${table} may not exist:`, error.message)
      } else {
        console.log(`[v0] ✓ Table ${table} exists`)
      }
    }

    console.log("[v0] Database verification complete")
    return true
  } catch (error) {
    console.error("[v0] Error initializing data:", error)
    return false
  }
}
