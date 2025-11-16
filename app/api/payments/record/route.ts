import { createAdminClient } from "@/lib/supabase/server-client"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { packId, paymentId, buyerId: providedBuyerId } = body

    console.log("[v0] Recording purchase from success page:", { packId, paymentId, providedBuyerId })

    if (!packId || !paymentId) {
      console.error("[v0] Missing packId or paymentId")
      return NextResponse.json({ error: "Missing packId or paymentId" }, { status: 400 })
    }

    // Use admin client to bypass RLS
    const adminSupabase = await createAdminClient()
    
    const { data: pack, error: packError } = await adminSupabase
      .from("packs")
      .select("user_id, price, title, downloads_count")
      .eq("id", packId)
      .single()

    if (packError || !pack) {
      console.error("[v0] Pack not found:", packError?.message)
      return NextResponse.json({ error: "Pack not found" }, { status: 404 })
    }

    console.log("[v0] Found pack:", { packId, price: pack.price, userId: pack.user_id })

    // Check if purchase already exists
    const { data: existingPurchase } = await adminSupabase
      .from("purchases")
      .select("id")
      .eq("mercado_pago_payment_id", paymentId)
      .single()

    if (existingPurchase) {
      console.log("[v0] Purchase already recorded:", existingPurchase.id)
      return NextResponse.json({ 
        success: true, 
        message: "Purchase already recorded",
        purchaseId: existingPurchase.id 
      })
    }

    let buyerId: string | null = providedBuyerId || null

    // Try to get buyer from auth header if not provided
    if (!buyerId) {
      const authHeader = request.headers.get("authorization")
      
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "")
        try {
          console.log("[v0] Attempting to extract user from token...")
          const { data: { user }, error: userError } = await adminSupabase.auth.getUser(token)
          if (user?.id) {
            buyerId = user.id
            console.log("[v0] Extracted buyer from token:", buyerId)
          } else {
            console.warn("[v0] Could not verify token:", userError?.message)
          }
        } catch (e) {
          console.warn("[v0] Error processing authorization:", String(e))
        }
      }
    }

    if (!buyerId) {
      console.error("[v0] Could not identify buyer - attempting to record without buyer_id")
      console.error("[v0] Auth header present:", !!request.headers.get("authorization"))
      return NextResponse.json({ 
        error: "Could not identify buyer - please make sure you're logged in", 
        code: "NO_BUYER_ID" 
      }, { status: 401 })
    }

    console.log("[v0] Creating purchase record:", { buyerId, packId, paymentId, price: pack.price })

    // Record the purchase
    const { error: purchaseError, data: purchaseData } = await adminSupabase
      .from("purchases")
      .insert({
        buyer_id: buyerId,
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
      console.error("[v0] Error creating purchase record:", {
        message: purchaseError.message,
        details: purchaseError.details,
        hint: purchaseError.hint,
        code: purchaseError.code
      })
      return NextResponse.json({ 
        error: "Failed to record purchase", 
        details: purchaseError.message,
        code: purchaseError.code
      }, { status: 400 })
    }

    console.log("[v0] Purchase recorded successfully:", purchaseData?.[0]?.id)

    // Update pack downloads count
    const { error: updateError } = await adminSupabase
      .from("packs")
      .update({ downloads_count: (pack.downloads_count || 0) + 1 })
      .eq("id", packId)

    if (updateError) {
      console.warn("[v0] Warning updating downloads count:", updateError.message)
    }

    // Update seller's total_sales
    const { error: sellerError } = await adminSupabase
      .from("profiles")
      .update({ total_sales: (pack.price || 0) })
      .eq("id", pack.user_id)

    if (sellerError) {
      console.warn("[v0] Warning updating seller stats:", sellerError.message)
    }

    return NextResponse.json({ 
      success: true, 
      message: "Purchase recorded successfully",
      purchaseId: purchaseData?.[0]?.id 
    })
  } catch (error) {
    console.error("[v0] Error in record payment endpoint:", error)
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 })
  }
}
