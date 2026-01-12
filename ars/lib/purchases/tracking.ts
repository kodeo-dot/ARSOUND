import { createAdminClient } from "../database/supabase.client"
import { incrementPackCounter } from "../database/queries"
import { logger } from "../utils/logger"

export async function trackPackPlay(packId: string, userId: string, ipAddress: string | null = null): Promise<boolean> {
  const adminSupabase = await createAdminClient()

  try {
    // Check if user already played this pack
    const { data: existingPlay } = await adminSupabase
      .from("user_track_events")
      .select("id")
      .eq("user_id", userId)
      .eq("track_id", packId)
      .eq("played", true)
      .single()

    if (existingPlay) {
      logger.debug("User already played this pack", "TRACKING", { userId, packId })
      return false // Already counted
    }

    // Check if event exists
    const { data: existingEvent } = await adminSupabase
      .from("user_track_events")
      .select("*")
      .eq("user_id", userId)
      .eq("track_id", packId)
      .single()

    if (existingEvent) {
      // Update existing event
      await adminSupabase.from("user_track_events").update({ played: true }).eq("id", existingEvent.id)
    } else {
      // Create new event
      await adminSupabase.from("user_track_events").insert({
        user_id: userId,
        track_id: packId,
        played: true,
        downloaded: false,
        purchased: false,
        liked: false,
      })
    }

    // Increment play count
    await incrementPackCounter(packId, "total_plays")

    // Record in pack_plays table
    await adminSupabase.from("pack_plays").insert({
      user_id: userId,
      pack_id: packId,
      played_at: new Date().toISOString(),
      ip_address: ipAddress || "unknown",
    })

    logger.info("Pack play tracked", "TRACKING", { userId, packId })
    return true
  } catch (error) {
    logger.error("Error tracking pack play", "TRACKING", error)
    return false
  }
}

export async function trackPackDownload(packId: string, userId: string): Promise<boolean> {
  const adminSupabase = await createAdminClient()

  try {
    // Update or create user_track_events
    const { data: existingEvent } = await adminSupabase
      .from("user_track_events")
      .select("*")
      .eq("user_id", userId)
      .eq("track_id", packId)
      .single()

    if (existingEvent) {
      await adminSupabase.from("user_track_events").update({ downloaded: true }).eq("id", existingEvent.id)
    } else {
      await adminSupabase.from("user_track_events").insert({
        user_id: userId,
        track_id: packId,
        played: false,
        downloaded: true,
        purchased: false,
        liked: false,
      })
    }

    logger.info("Pack download tracked", "TRACKING", { userId, packId })
    return true
  } catch (error) {
    logger.error("Error tracking download", "TRACKING", error)
    return false
  }
}
