import { createAdminClient } from "@/lib/supabase/server-client"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, data } = body

    console.log("[v0] Webhook received - Type:", type, "Data ID:", data?.id)
    console.log("[v0] Full webhook body:", JSON.stringify(body, null, 2))

    if (type !== "payment") {
      console.log("[v0] Webhook type is not 'payment', ignoring")
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

    console.log("[v0] Fetching payment details from Mercado Pago...")
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
      console.log("[v0] Payment data from Mercado Pago:", {
        status: paymentData.status,
        external_reference: paymentData.external_reference,
        metadata: paymentData.metadata,
      })
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

    console.log("[v0] Processing payment with external_reference:", externalReference)
    console.log("[v0] Metadata type:", metadata?.type)

    if (metadata?.type === "pack_purchase") {
      console.log("[v0] Processing pack purchase...")
      
      const { data: pack } = await supabase
        .from("packs")
        .select("user_id, price")
        .eq("id", metadata.pack_id)
        .single()

      if (!pack) {
        console.error("[v0] Pack not found:", metadata.pack_id)
        return NextResponse.json({ received: true })
      }

      const discountAmount = metadata.original_price ? metadata.original_price - metadata.final_price : 0

      console.log("[v0] Creating purchase record with:", {
        buyer_id: metadata.buyer_id,
        pack_id: metadata.pack_id,
        amount: metadata.final_price,
        mercado_pago_payment_id: paymentId,
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
      } else {
        console.log("[v0] Purchase created successfully:", purchaseData?.[0]?.id)

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

        const { error: downloadError } = await supabase
          .from("pack_downloads")
          .insert({
            user_id: metadata.buyer_id,
            pack_id: metadata.pack_id,
            downloaded_at: new Date().toISOString(),
          })

        if (downloadError) {
          console.log("[v0] Download record error:", downloadError.message)
        } else {
          console.log("[v0] Download record created successfully")
        }

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
      console.log("[v0] Processing plan subscription...")
      // ... existing plan logic ...
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[v0] Error processing Mercado Pago webhook:", error)
    return NextResponse.json({ received: true })
  }
}

export async function GET() {
  const webhookUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`
    : "Not configured"

  return NextResponse.json({
    status: "webhook_endpoint_active",
    webhook_url: webhookUrl,
    mercado_pago_connected: !!process.env.MERCADO_PAGO_ACCESS_TOKEN,
    test_mode: process.env.MERCADO_PAGO_TEST_MODE === "true",
  })
}
