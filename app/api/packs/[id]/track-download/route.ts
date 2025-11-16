import { createServerClient } from "@/lib/supabase/server-client"
import { createAdminClient } from "@/lib/supabase/server-client"
import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: packId } = await context.params

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

    console.log("[v0] Recording download for pack:", packId, "user:", user.id)

    const { data: existingDownload } = await adminSupabase
      .from("user_track_events")
      .select("id")
      .eq("user_id", user.id)
      .eq("track_id", packId)
      .eq("downloaded", true)
      .single()

    if (existingDownload) {
      console.log("[v0] User already downloaded this pack")
      return NextResponse.json({ success: true, alreadyCounted: true })
    }

    const { data: existingEvent } = await adminSupabase
      .from("user_track_events")
      .select("*")
      .eq("user_id", user.id)
      .eq("track_id", packId)
      .single()

    if (existingEvent) {
      await adminSupabase
        .from("user_track_events")
        .update({ downloaded: true })
        .eq("id", existingEvent.id)
    } else {
      await adminSupabase
        .from("user_track_events")
        .insert({
          user_id: user.id,
          track_id: packId,
          played: false,
          downloaded: true,
          purchased: false,
          liked: false,
        })
    }

    // Increment downloads count
    const { data: pack } = await adminSupabase
      .from("packs")
      .select("downloads_count")
      .eq("id", packId)
      .single()

    await adminSupabase
      .from("packs")
      .update({ downloads_count: (pack?.downloads_count || 0) + 1 })
      .eq("id", packId)

    return NextResponse.json({ success: true, counted: true })
  } catch (error) {
    console.error("[v0] Error recording download:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
