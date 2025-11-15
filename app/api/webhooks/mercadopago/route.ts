import { createServerClient } from "@/lib/supabase/server-client"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, data } = body

    console.log("[v0] Mercado Pago webhook received:", type, data)

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

    const supabase = await createServerClient()
    const metadata = paymentData.metadata
    const externalReference = paymentData.external_reference

    console.log("[v0] Processing payment:", { externalReference, metadata })

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

      const discountAmount = metadata.original_price - metadata.final_price

      const { error: purchaseError } = await supabase.from("purchases").insert({
        buyer_id: metadata.buyer_id,
        pack_id: metadata.pack_id,
        amount: metadata.final_price,
        discount_amount: discountAmount,
        platform_commission: metadata.commission_amount,
        creator_earnings: metadata.seller_earnings,
        status: "completed",
        payment_method: "mercado_pago",
        mercado_pago_payment_id: paymentId,
      })

      if (purchaseError) {
        console.error("[v0] Error creating purchase record:", purchaseError)
      } else {
        console.log("[v0] Pack purchase recorded successfully")

        if (pack.price > 0) {
          await supabase.rpc("increment", {
            table_name: "packs",
            row_id: metadata.pack_id,
            column_name: "downloads_count",
          }).catch((err) => {
            console.error("[v0] Error incrementing downloads count:", err)
          })

          await supabase.rpc("increment", {
            table_name: "profiles",
            row_id: pack.user_id,
            column_name: "total_sales",
          }).catch((err) => {
            console.error("[v0] Error incrementing total sales:", err)
          })
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

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ plan: planType })
        .eq("id", userId)

      if (profileError) {
        console.error("[v0] Error updating user plan:", profileError)
      } else {
        console.log("[v0] User plan updated to:", planType)
      }

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
