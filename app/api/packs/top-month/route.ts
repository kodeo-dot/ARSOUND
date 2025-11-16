import { createServerClient } from "@/lib/supabase/server-client"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    // Get packs with purchases in the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: packs, error } = await supabase
      .from("packs")
      .select(`
        id,
        title,
        price,
        cover_image_url,
        genre,
        user_id,
        downloads_count,
        total_plays,
        created_at,
        profiles:user_id (
          username,
          avatar_url
        ),
        purchases (
          count
        )
      `)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("downloads_count", { ascending: false })
      .limit(6)

    if (error) {
      console.error("[v0] Error fetching top packs:", error)
      return NextResponse.json({ error: "Failed to fetch packs" }, { status: 500 })
    }

    // Sort by sales count, then by plays
    const sortedPacks = (packs || []).sort((a: any, b: any) => {
      const salesA = a.purchases?.[0]?.count || a.downloads_count || 0
      const salesB = b.purchases?.[0]?.count || b.downloads_count || 0
      if (salesA !== salesB) return salesB - salesA
      return (b.total_plays || 0) - (a.total_plays || 0)
    })

    return NextResponse.json({ packs: sortedPacks })
  } catch (error) {
    console.error("[v0] Error in top-month endpoint:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
