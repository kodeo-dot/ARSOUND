import { createServerClient } from "@/lib/supabase/server-client"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if user has STUDIO_PLUS plan
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single()

    if (profile?.plan !== "studio_plus") {
      return NextResponse.json(
        { error: "Unauthorized - Studio Plus required" },
        { status: 403 }
      )
    }

    // Get user's packs
    const { data: packs } = await supabase
      .from("packs")
      .select("id")
      .eq("user_id", user.id)

    const packIds = packs?.map(p => p.id) || []

    if (packIds.length === 0) {
      return NextResponse.json({
        plays_by_country: [],
        sales_by_country: [],
        activity_by_hour: [],
        discount_codes_used: [],
        conversion_rate: 0,
        top_packs: [],
      })
    }

    // Get plays by country (from pack_plays table with metadata)
    const { data: plays } = await supabase
      .from("pack_plays")
      .select("*")
      .in("pack_id", packIds)

    // Get sales by country
    const { data: sales } = await supabase
      .from("purchases")
      .select("*")
      .in("pack_id", packIds)

    // Get activity by hour
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: recentPlays } = await supabase
      .from("pack_plays")
      .select("played_at")
      .in("pack_id", packIds)
      .gte("played_at", thirtyDaysAgo.toISOString())

    // Calculate conversion rate
    const totalPlays = plays?.length || 0
    const totalSales = sales?.length || 0
    const conversionRate = totalPlays > 0 ? (totalSales / totalPlays) * 100 : 0

    return NextResponse.json({
      total_plays: totalPlays,
      total_sales: totalSales,
      conversion_rate: conversionRate.toFixed(2),
      packs_count: packIds.length,
    })
  } catch (error) {
    console.error("[v0] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
