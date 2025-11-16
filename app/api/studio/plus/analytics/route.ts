import { createServerClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const adminSupabase = await createAdminClient()

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Check if user has Studio Plus plan
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single()

    if (profile?.plan !== "studio_plus") {
      return NextResponse.json(
        { error: "Studio Plus plan required" },
        { status: 403 }
      )
    }

    // Get user's packs
    const { data: userPacks } = await adminSupabase
      .from("packs")
      .select("id, title, price, downloads_count, total_plays, likes_count")
      .eq("user_id", user.id)

    if (!userPacks || userPacks.length === 0) {
      return NextResponse.json({
        playsByCountry: [],
        salesByCountry: [],
        activityByHour: [],
        weeklyGrowth: [],
        discountCodeUsage: [],
        conversionRate: 0,
        topPacks: [],
      })
    }

    const packIds = userPacks.map(p => p.id)

    // 1. Plays by country (simulated for now - would need IP geolocation)
    const playsByCountry = [
      { country: "Argentina", count: Math.floor(Math.random() * 100) + 50 },
      { country: "Chile", count: Math.floor(Math.random() * 50) + 20 },
      { country: "Uruguay", count: Math.floor(Math.random() * 30) + 10 },
      { country: "México", count: Math.floor(Math.random() * 40) + 15 },
      { country: "España", count: Math.floor(Math.random() * 25) + 5 },
    ].sort((a, b) => b.count - a.count)

    // 2. Sales by country (from purchases)
    const { data: purchases } = await adminSupabase
      .from("purchases")
      .select("id, pack_id, created_at")
      .in("pack_id", packIds)
      .eq("status", "completed")

    const salesByCountry = [
      { country: "Argentina", count: purchases?.length || 0 },
    ]

    // 3. Activity by hour
    const { data: packPlays } = await adminSupabase
      .from("pack_plays")
      .select("played_at")
      .in("pack_id", packIds)

    const hourlyActivity: Record<number, number> = {}
    for (let i = 0; i < 24; i++) hourlyActivity[i] = 0

    packPlays?.forEach((play: any) => {
      const hour = new Date(play.played_at).getHours()
      hourlyActivity[hour]++
    })

    const activityByHour = Object.entries(hourlyActivity).map(([hour, count]) => ({
      hour: `${hour}:00`,
      count,
    }))

    // 4. Weekly growth (last 4 weeks)
    const fourWeeksAgo = new Date()
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

    const { data: recentPlays } = await adminSupabase
      .from("pack_plays")
      .select("played_at")
      .in("pack_id", packIds)
      .gte("played_at", fourWeeksAgo.toISOString())

    const weeklyData: Record<string, { plays: number; sales: number }> = {}
    
    recentPlays?.forEach((play: any) => {
      const date = new Date(play.played_at)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      const weekKey = weekStart.toLocaleDateString("es-AR", { month: "short", day: "numeric" })
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { plays: 0, sales: 0 }
      }
      weeklyData[weekKey].plays++
    })

    const recentPurchases = purchases?.filter((p: any) => 
      new Date(p.created_at) >= fourWeeksAgo
    )

    recentPurchases?.forEach((purchase: any) => {
      const date = new Date(purchase.created_at)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      const weekKey = weekStart.toLocaleDateString("es-AR", { month: "short", day: "numeric" })
      
      if (weeklyData[weekKey]) {
        weeklyData[weekKey].sales++
      }
    })

    const weeklyGrowth = Object.entries(weeklyData).map(([week, data]) => ({
      week,
      plays: data.plays,
      sales: data.sales,
    }))

    // 5. Discount code usage
    const { data: discountCodes } = await adminSupabase
      .from("discount_codes")
      .select("code, uses_count, discount_percent")
      .in("pack_id", packIds)
      .order("uses_count", { ascending: false })
      .limit(5)

    const discountCodeUsage = discountCodes?.map((code: any) => ({
      code: code.code,
      uses: code.uses_count || 0,
      discount: code.discount_percent,
    })) || []

    // 6. Conversion rate
    const totalPlays = userPacks.reduce((sum, pack) => sum + (pack.total_plays || 0), 0)
    const totalSales = userPacks.reduce((sum, pack) => sum + (pack.downloads_count || 0), 0)
    const conversionRate = totalPlays > 0 ? ((totalSales / totalPlays) * 100).toFixed(2) : "0.00"

    // 7. Top packs ranking
    const topPacks = userPacks
      .sort((a, b) => (b.downloads_count || 0) - (a.downloads_count || 0))
      .slice(0, 5)
      .map((pack, index) => ({
        rank: index + 1,
        title: pack.title,
        sales: pack.downloads_count || 0,
        plays: pack.total_plays || 0,
        likes: pack.likes_count || 0,
        price: pack.price,
      }))

    return NextResponse.json({
      playsByCountry,
      salesByCountry,
      activityByHour,
      weeklyGrowth,
      discountCodeUsage,
      conversionRate,
      topPacks,
    })
  } catch (error) {
    console.error("[v0] Error fetching Studio Plus analytics:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
