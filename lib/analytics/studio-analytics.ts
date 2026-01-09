import { createServerClient } from "../database/supabase.client"
import { logger } from "../utils/logger"
import type { AnalyticsResponse } from "../types/api.types"

export async function getStudioAnalytics(userId: string): Promise<AnalyticsResponse> {
  const supabase = await createServerClient()

  try {
    // Get basic stats from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("packs_count, total_sales, followers_count")
      .eq("id", userId)
      .single()

    // Get packs for this user
    const { data: packs } = await supabase
      .from("packs")
      .select("id, total_plays, downloads_count")
      .eq("user_id", userId)

    // Calculate totals
    const totalPlays = packs?.reduce((sum, pack) => sum + (pack.total_plays || 0), 0) || 0
    const totalDownloads = packs?.reduce((sum, pack) => sum + (pack.downloads_count || 0), 0) || 0

    // Get revenue from purchases
    const { data: purchases } = await supabase
      .from("purchases")
      .select("creator_earnings, created_at")
      .eq("seller_id", userId)
      .eq("status", "completed")

    const totalRevenue = purchases?.reduce((sum, p) => sum + (p.creator_earnings || 0), 0) || 0

    // Calculate conversion rate
    const conversionRate = totalPlays > 0 ? (totalDownloads / totalPlays) * 100 : 0

    // Get activity by hour (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: playsByHour } = await supabase
      .from("pack_plays")
      .select("played_at")
      .in("pack_id", packs?.map((p) => p.id) || [])
      .gte("played_at", thirtyDaysAgo.toISOString())

    const { data: salesByHour } = await supabase
      .from("purchases")
      .select("created_at")
      .eq("seller_id", userId)
      .gte("created_at", thirtyDaysAgo.toISOString())

    // Group by hour
    const activityByHour = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      plays: 0,
      sales: 0,
    }))

    playsByHour?.forEach((play) => {
      const hour = new Date(play.played_at).getHours()
      activityByHour[hour].plays++
    })

    salesByHour?.forEach((sale) => {
      const hour = new Date(sale.created_at).getHours()
      activityByHour[hour].sales++
    })

    return {
      total_plays: totalPlays,
      total_sales: profile?.total_sales || 0,
      total_revenue: totalRevenue,
      packs_count: profile?.packs_count || 0,
      conversion_rate: Number.parseFloat(conversionRate.toFixed(2)),
      plays_by_country: {}, // TODO: Implement with geo data
      sales_by_country: {}, // TODO: Implement with geo data
      activity_by_hour: activityByHour,
    }
  } catch (error) {
    logger.error("Error fetching studio analytics", "ANALYTICS", error)
    throw error
  }
}
