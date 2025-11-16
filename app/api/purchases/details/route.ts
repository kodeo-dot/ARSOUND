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

    const { data: purchases, error } = await supabase
      .from("purchases")
      .select(`
        id,
        purchase_code,
        pack_id,
        amount,
        discount_amount,
        discount_code,
        discount_percent,
        payment_method,
        status,
        created_at,
        packs (
          id,
          title,
          cover_image_url,
          price,
          user_id
        )
      `)
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching purchases:", error)
      return NextResponse.json(
        { error: "Failed to fetch purchases" },
        { status: 500 }
      )
    }

    return NextResponse.json({ purchases })
  } catch (error) {
    console.error("[v0] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
