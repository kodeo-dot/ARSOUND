import { createAdminClient } from "@/lib/supabase/server-client"
import { NextResponse } from "next/server"
import { recordUserActionServer } from "@/lib/user-actions"

// Comisión por plan
function getCommissionByPlan(plan: string) {
  switch (plan) {
    case "free": return 0.15
    case "de_0_a_hit": return 0.10
    case "studio_plus": return 0.3
    default: return 0.15
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { packId, paymentId, buyerId: providedBuyerId } = body

    console.log("[v0] Recording purchase:", { packId, paymentId })

    if (!packId || !paymentId) {
      return NextResponse.json(
        { error: "Missing packId or paymentId" },
        { status: 400 }
      )
    }

    const adminSupabase = await createAdminClient()

    // Get pack info
    const { data: pack, error: packError } = await adminSupabase
      .from("packs")
      .select("user_id, price, title, downloads_count")
      .eq("id", packId)
      .single()

    if (packError || !pack) {
      return NextResponse.json({ error: "Pack not found" }, { status: 404 })
    }

    // Get seller profile (para el plan)
    const { data: sellerProfile } = await adminSupabase
      .from("profiles")
      .select("plan")
      .eq("id", pack.user_id)
      .single()

    const commissionPercent = getCommissionByPlan(sellerProfile?.plan || "free")
    const commissionAmount = pack.price * commissionPercent
    const sellerEarnings = pack.price - commissionAmount

    console.log("[v0] Commission data:", {
      commissionPercent,
      commissionAmount,
      sellerEarnings
    })

    // Buyer
    let buyerId = providedBuyerId || null

    if (!buyerId) {
      const authHeader = request.headers.get("authorization")
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "")
        const { data: { user } } = await adminSupabase.auth.getUser(token)
        if (user?.id) buyerId = user.id
      }
    }

    if (!buyerId) {
      return NextResponse.json(
        { error: "Could not identify buyer", code: "NO_BUYER_ID" },
        { status: 401 }
      )
    }

    // Prevent duplicates
    const { data: existingPurchase } = await adminSupabase
      .from("purchases")
      .select("id")
      .eq("mercado_pago_payment_id", paymentId)
      .single()

    if (existingPurchase) {
      return NextResponse.json({
        success: true,
        message: "Purchase already recorded",
        purchaseId: existingPurchase.id
      })
    }

    await recordUserActionServer(buyerId, packId, 'purchase')

    // Create purchase with commission
    const { error: purchaseError, data: purchaseData } =
      await adminSupabase
        .from("purchases")
        .insert({
          buyer_id: buyerId,
          seller_id: pack.user_id,
          pack_id: packId,
          amount_paid: pack.price,
          commission_percent: commissionPercent,
          commission_amount: commissionAmount,
          seller_earnings: sellerEarnings,
          platform_earnings: commissionAmount,
          status: "completed",
          payment_method: "mercado_pago",
          mercado_pago_payment_id: paymentId
        })
        .select()

    if (purchaseError) {
      return NextResponse.json(
        { error: "Failed to record purchase", details: purchaseError.message },
        { status: 400 }
      )
    }

    // Note: We use user_actions to prevent duplicate counts
    const downloadRecorded = await recordUserActionServer(buyerId, packId, 'download')
    if (downloadRecorded) {
      await adminSupabase
        .from("packs")
        .update({ downloads_count: (pack.downloads_count || 0) + 1 })
        .eq("id", packId)
    }

    // Update seller total sales (earnings, no comisión)
    const { data: sellerPurchases } = await adminSupabase
      .from("purchases")
      .select("seller_earnings")
      .eq("seller_id", pack.user_id)

    const newTotalSales = sellerPurchases?.reduce(
      (sum: number, p: any) => sum + (p.seller_earnings ?? 0),
      0
    ) || 0

    await adminSupabase
      .from("profiles")
      .update({ total_sales: newTotalSales })
      .eq("id", pack.user_id)

    return NextResponse.json({
      success: true,
      purchaseId: purchaseData?.[0]?.id
    })

  } catch (e) {
    console.error("[v0] Fatal error:", e)
    return NextResponse.json(
      { error: "Internal server error", details: String(e) },
      { status: 500 }
    )
  }
}
