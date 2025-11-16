import { createServerClient } from "@/lib/supabase/server-client"
import { createAdminClient } from "@/lib/supabase/server-client"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { packId } = body

    if (!packId) {
      return NextResponse.json({ error: "Missing packId" }, { status: 400 })
    }

    const supabase = await createServerClient()
    const adminSupabase = await createAdminClient()

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    console.log("[v0] Recording play for pack:", packId, "user:", user.id)

    const { data: existingPlay } = await adminSupabase
      .from("user_track_events")
      .select("id")
      .eq("user_id", user.id)
      .eq("track_id", packId)
      .eq("played", true)
      .single()

    if (existingPlay) {
      console.log("[v0] User already played this pack")
      return NextResponse.json({ success: true, alreadyCounted: true })
    }

    const { data: existingEvent } = await adminSupabase
      .from("user_track_events")
      .select("*")
      .eq("user_id", user.id)
      .eq("track_id", packId)
      .single()

    if (existingEvent) {
      // Update existing event to mark as played
      await adminSupabase
        .from("user_track_events")
        .update({ played: true })
        .eq("id", existingEvent.id)
    } else {
      // Create new event
      await adminSupabase
        .from("user_track_events")
        .insert({
          user_id: user.id,
          track_id: packId,
          played: true,
          downloaded: false,
          purchased: false,
          liked: false,
        })
    }

    // Increment play count on pack (only once per user)
    const { data: pack } = await adminSupabase
      .from("packs")
      .select("total_plays")
      .eq("id", packId)
      .single()

    await adminSupabase
      .from("packs")
      .update({ total_plays: (pack?.total_plays || 0) + 1 })
      .eq("id", packId)

    await adminSupabase
      .from("pack_plays")
      .insert({
        user_id: user.id,
        pack_id: packId,
        played_at: new Date().toISOString(),
        ip_address: request.headers.get("x-forwarded-for") || "unknown",
      })
      .throwOnError()

    return NextResponse.json({ success: true, counted: true })
  } catch (error) {
    console.error("[v0] Error recording play:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
