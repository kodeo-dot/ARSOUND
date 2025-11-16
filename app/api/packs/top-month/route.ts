import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const adminSupabase = await createAdminClient()

    // Calculate date one month ago
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

    // Get all purchases from the last month
    const { data: monthlyPurchases, error: purchasesError } = await adminSupabase
      .from("purchases")
      .select("pack_id")
      .gte("created_at", oneMonthAgo.toISOString())
      .eq("status", "completed")

    if (purchasesError) {
      console.error("[v0] Error fetching monthly purchases:", purchasesError)
      return NextResponse.json({ packs: [] })
    }

    // Count sales per pack
    const salesByPack: Record<string, number> = {}
    monthlyPurchases?.forEach((purchase: any) => {
      salesByPack[purchase.pack_id] = (salesByPack[purchase.pack_id] || 0) + 1
    })

    // Get pack IDs sorted by sales
    const topPackIds = Object.entries(salesByPack)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([packId]) => packId)

    if (topPackIds.length === 0) {
      // If no sales this month, return most played packs
      const { data: fallbackPacks } = await adminSupabase
        .from("packs")
        .select(`
          id,
          title,
          price,
          cover_image_url,
          total_plays,
          downloads_count,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .order("total_plays", { ascending: false })
        .limit(6)

      return NextResponse.json({
        packs: fallbackPacks?.map((pack: any) => ({
          ...pack,
          monthly_sales: 0,
        })) || [],
      })
    }

    // Fetch pack details
    const { data: topPacks, error: packsError } = await adminSupabase
      .from("packs")
      .select(`
        id,
        title,
        price,
        cover_image_url,
        total_plays,
        downloads_count,
        profiles:user_id (
          username,
          avatar_url
        )
      `)
      .in("id", topPackIds)

    if (packsError) {
      console.error("[v0] Error fetching top packs:", packsError)
      return NextResponse.json({ packs: [] })
    }

    // Add monthly sales count and sort
    const packsWithSales = topPacks?.map((pack: any) => ({
      ...pack,
      monthly_sales: salesByPack[pack.id] || 0,
    })).sort((a: any, b: any) => {
      // Sort by sales, then by plays as tiebreaker
      if (b.monthly_sales !== a.monthly_sales) {
        return b.monthly_sales - a.monthly_sales
      }
      return (b.total_plays || 0) - (a.total_plays || 0)
    })

    return NextResponse.json({ packs: packsWithSales || [] })
  } catch (error) {
    console.error("[v0] Error in top-month API:", error)
    return NextResponse.json(
      { error: "Internal server error", packs: [] },
      { status: 500 }
    )
  }
}
