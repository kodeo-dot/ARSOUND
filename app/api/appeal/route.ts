import { createServerClient } from "@/lib/supabase/server-client"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { message } = body

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Check if user is actually blocked
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_blocked, blocked_reason, username")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("[v0] Error fetching profile:", profileError)
      return NextResponse.json({ error: "Could not verify profile" }, { status: 500 })
    }

    if (!profile?.is_blocked) {
      return NextResponse.json({ error: "User is not blocked" }, { status: 400 })
    }

    const { data: appeal, error: appealError } = await supabase
      .from("appeals")
      .insert({
        user_id: user.id,
        message: message.trim(),
        status: "pending",
      })
      .select()
      .single()

    if (appealError) {
      console.error("[v0] Error creating appeal:", appealError)
      return NextResponse.json({ error: "Could not create appeal" }, { status: 500 })
    }

    // Log for admin notification
    console.log("[APPEAL RECEIVED]", {
      appeal_id: appeal.id,
      user_id: user.id,
      username: profile.username,
      blocked_reason: profile.blocked_reason,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: "Appeal submitted successfully",
      appeal_id: appeal.id,
    })
  } catch (error: any) {
    console.error("[v0] Appeal submission error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
