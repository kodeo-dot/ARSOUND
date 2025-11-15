import { createAdminClient } from "@/lib/supabase/server-client"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, data } = body

    console.log("[v0] Mercado Pago webhook received:", type, data?.id)

    if (type !== "payment") {
      return NextResponse.json({ received: true })
    }

    const paymentId = data.id

    const testMode = process.env.MERCADO_PAGO_TEST_MODE === "true"
    const accessToken = testMode
      ? process.env.MERCADO_PAGO_TEST_ACCESS_TOKEN
      : process.env.MERCADO_PAGO_ACCESS_TOKEN

    if (!accessToken) {
      console.error("[v0] Mercado Pago access token not configured")
      return NextResponse.json({ received: true })
    }

    let paymentData
    try {
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        console.error("[v0] Error fetching payment from Mercado Pago:", response.status)
        return NextResponse.json({ received: true })
      }

      paymentData = await response.json()
    } catch (error) {
      console.error("[v0] Error calling Mercado Pago API:", error)
      return NextResponse.json({ received: true })
    }

    if (paymentData.status !== "approved") {
      console.log("[v0] Payment not approved, status:", paymentData.status)
      return NextResponse.json({ received: true })
    }

    const supabase = await createAdminClient()
    const metadata = paymentData.metadata
    const externalReference = paymentData.external_reference

    console.log("[v0] Processing payment:", { externalReference, type: metadata?.type })

    if (metadata?.type === "pack_purchase") {
      const { data: pack } = await supabase
        .from("packs")
        .select("user_id, price")
        .eq("id", metadata.pack_id)
        .single()

      if (!pack) {
        console.error("[v0] Pack not found:", metadata.pack_id)
        return NextResponse.json({ error: "Pack not found" }, { status: 404 })
      }

      const discountAmount = metadata.original_price ? metadata.original_price - metadata.final_price : 0

      // Create purchase record
      console.log("[v0] Creating purchase record with data:", {
        buyer_id: metadata.buyer_id,
        pack_id: metadata.pack_id,
        amount: metadata.final_price,
        status: "completed"
      })

      const { error: purchaseError, data: purchaseData } = await supabase
        .from("purchases")
        .insert({
          buyer_id: metadata.buyer_id,
          pack_id: metadata.pack_id,
          amount: metadata.final_price,
          discount_amount: discountAmount,
          platform_commission: metadata.commission_amount || 0,
          creator_earnings: metadata.seller_earnings || 0,
          status: "completed",
          payment_method: "mercado_pago",
          mercado_pago_payment_id: paymentId,
        })
        .select()

      if (purchaseError) {
        console.error("[v0] Error creating purchase record:", purchaseError.message, purchaseError.details)
        // Continue anyway - don't fail the webhook
      } else {
        console.log("[v0] Pack purchase recorded successfully:", purchaseData)

        // Increment downloads_count for pack
        const { data: currentPack } = await supabase
          .from("packs")
          .select("downloads_count")
          .eq("id", metadata.pack_id)
          .single()

        const newDownloadCount = (currentPack?.downloads_count || 0) + 1

        const { error: updateError } = await supabase
          .from("packs")
          .update({ downloads_count: newDownloadCount })
          .eq("id", metadata.pack_id)

        if (updateError) {
          console.error("[v0] Error updating pack downloads_count:", updateError.message)
        } else {
          console.log("[v0] Pack downloads_count updated to:", newDownloadCount)
        }

        // Record pack download
        const { error: downloadError } = await supabase
          .from("pack_downloads")
          .insert({
            user_id: metadata.buyer_id,
            pack_id: metadata.pack_id,
            downloaded_at: new Date().toISOString(),
          })

        if (downloadError) {
          console.log("[v0] Download record info:", downloadError.message)
        } else {
          console.log("[v0] Download record created successfully")
        }

        // Update seller statistics
        if (pack.price > 0 && metadata.seller_earnings) {
          const { data: sellerProfile } = await supabase
            .from("profiles")
            .select("total_sales")
            .eq("id", pack.user_id)
            .single()

          const newTotalSales = (sellerProfile?.total_sales || 0) + (metadata.seller_earnings || 0)

          const { error: profileError } = await supabase
            .from("profiles")
            .update({ total_sales: newTotalSales })
            .eq("id", pack.user_id)

          if (profileError) {
            console.error("[v0] Error updating seller total_sales:", profileError.message)
          } else {
            console.log("[v0] Seller stats updated - total_sales:", newTotalSales)
          }
        }
      }
    }

    if (metadata?.type === "plan_subscription") {
      const parts = externalReference?.split("_") || []
      const userId = parts[1]
      const planType = parts.slice(2).join("_")

      console.log("[v0] Plan subscription info:", { userId, planType, externalReference })

      if (!userId || !planType) {
        console.error("[v0] Invalid external_reference format:", externalReference)
        return NextResponse.json({ received: true })
      }

      const expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + 1)

      // Update user plan
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ plan: planType })
        .eq("id", userId)

      if (profileError) {
        console.error("[v0] Error updating user plan:", profileError)
      } else {
        console.log("[v0] User plan updated to:", planType)
      }

      // Record plan subscription
      const { error: planError } = await supabase.from("user_plans").upsert(
        {
          user_id: userId,
          plan_type: planType,
          is_active: true,
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        },
        {
          onConflict: "user_id",
        }
      )

      if (planError) {
        console.error("[v0] Error updating user_plans:", planError)
      } else {
        console.log("[v0] Plan subscription record updated successfully")
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[v0] Error processing Mercado Pago webhook:", error)
    return NextResponse.json({ error: "Error processing webhook" }, { status: 500 })
  }
}
