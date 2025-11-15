import { createAdminClient } from "@/lib/supabase/server-client"
import { createServerClient } from "@/lib/supabase/server-client"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { packId, paymentId } = body

    console.log("[v0] Recording purchase from success page:", { packId, paymentId })

    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { data: pack } = await supabase
      .from("packs")
      .select("user_id, price, title")
      .eq("id", packId)
      .single()

    if (!pack) {
      return NextResponse.json({ error: "Pack not found" }, { status: 404 })
    }

    const { data: existingPurchase } = await supabase
      .from("purchases")
      .select("id")
      .eq("mercado_pago_payment_id", paymentId)
      .eq("buyer_id", user.id)
      .single()

    if (existingPurchase) {
      console.log("[v0] Purchase already recorded:", existingPurchase.id)
      return NextResponse.json({ 
        success: true, 
        message: "Purchase already recorded",
        purchaseId: existingPurchase.id 
      })
    }

    const adminSupabase = await createAdminClient()
    
    const { error: purchaseError, data: purchaseData } = await adminSupabase
      .from("purchases")
      .insert({
        buyer_id: user.id,
        pack_id: packId,
        amount: pack.price,
        discount_amount: 0,
        platform_commission: 0,
        creator_earnings: pack.price,
        status: "completed",
        payment_method: "mercado_pago",
        mercado_pago_payment_id: paymentId,
      })
      .select()

    if (purchaseError) {
      console.error("[v0] Error creating purchase record:", purchaseError.message, purchaseError.details)
      return NextResponse.json({ 
        error: "Failed to record purchase", 
        details: purchaseError.message 
      }, { status: 400 })
    }

    console.log("[v0] Purchase recorded successfully:", purchaseData?.[0]?.id)

    return NextResponse.json({ 
      success: true, 
      message: "Purchase recorded successfully",
      purchaseId: purchaseData?.[0]?.id 
    })
  } catch (error) {
    console.error("[v0] Error in record payment endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
