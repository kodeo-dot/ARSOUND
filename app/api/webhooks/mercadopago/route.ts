import { createAdminClient } from "@/lib/supabase/server-client"
import { NextResponse } from "next/server"
import { sendBrevoEmail } from "@/lib/brevo/client"
import {
  generatePackPurchaseEmailBuyer,
  generatePackSaleEmailSeller,
  generatePlanPurchaseEmail,
} from "@/lib/brevo/email-templates"
import { PLAN_FEATURES, type PlanType } from "@/lib/plans"

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
        collector_id: paymentData.collector_id,
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

      const { data: sellerProfile } = await supabase
        .from("profiles")
        .select("mp_user_id")
        .eq("id", pack.user_id)
        .single()

      const discountAmount = metadata.original_price ? metadata.original_price - metadata.final_price : 0

      console.log("[v0] Creating purchase record with:", {
        buyer_id: metadata.buyer_id,
        pack_id: metadata.pack_id,
        seller_id: pack.user_id,
        seller_mp_user_id: metadata.seller_mp_user_id || sellerProfile?.mp_user_id,
        amount: metadata.final_price,
        mercado_pago_payment_id: paymentId,
      })

      const { error: purchaseError, data: purchaseData } = await supabase
        .from("purchases")
        .insert({
          buyer_id: metadata.buyer_id,
          pack_id: metadata.pack_id,
          seller_id: pack.user_id,
          amount: metadata.final_price,
          discount_amount: discountAmount,
          discount_code: metadata.discount_code,
          discount_percent: metadata.discount_percent,
          platform_commission: metadata.commission_amount || 0,
          creator_earnings: metadata.seller_earnings || 0,
          status: "completed",
          payment_method: "mercado_pago",
          mercado_pago_payment_id: paymentId,
          purchase_code: `ARSND-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        })
        .select()

      if (purchaseError) {
        console.error("[v0] Error creating purchase record:", purchaseError.message, purchaseError.details)
      } else {
        console.log("[v0] Purchase created successfully:", purchaseData?.[0]?.id)

        try {
          const { data: buyer } = await supabase
            .from("profiles")
            .select("email, username")
            .eq("id", metadata.buyer_id)
            .single()

          const { data: seller } = await supabase
            .from("profiles")
            .select("email, username")
            .eq("id", pack.user_id)
            .single()

          if (buyer?.email && seller?.email) {
            // Send email to buyer
            const buyerEmailHtml = generatePackPurchaseEmailBuyer({
              buyerName: buyer.username || "Usuario",
              packTitle: metadata.pack_title || "Pack",
              sellerName: seller.username || "Creador",
              amount: metadata.final_price,
              discount: metadata.original_price ? metadata.original_price - metadata.final_price : undefined,
              purchaseCode: purchaseData?.[0]?.purchase_code || "N/A",
              downloadUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pack/${metadata.pack_id}/download`,
            })

            await sendBrevoEmail({
              to: [buyer.email],
              subject: `Tu compra de ${metadata.pack_title || "Pack"} está lista para descargar`,
              htmlContent: buyerEmailHtml,
              sender: {
                email: process.env.BREVO_SENDER_EMAIL || "noreply@arsound.com",
                name: "ArSound",
              },
            })

            // Send email to seller
            const sellerEmailHtml = generatePackSaleEmailSeller({
              sellerName: seller.username || "Creador",
              buyerName: buyer.username || "Cliente",
              packTitle: metadata.pack_title || "Pack",
              amount: metadata.final_price,
              commission: metadata.commission_amount || 0,
              earnings: metadata.seller_earnings || 0,
              purchaseCode: purchaseData?.[0]?.purchase_code || "N/A",
            })

            await sendBrevoEmail({
              to: [seller.email],
              subject: `¡Nueva venta! ${buyer.username || "Un cliente"} compró tu pack`,
              htmlContent: sellerEmailHtml,
              sender: {
                email: process.env.BREVO_SENDER_EMAIL || "noreply@arsound.com",
                name: "ArSound",
              },
            })

            console.log("[v0] Notification emails sent successfully")
          }
        } catch (emailError) {
          console.error("[v0] Error sending notification emails:", emailError)
        }

        const { error: eventError } = await supabase
          .from("user_track_events")
          .upsert({
            user_id: metadata.buyer_id,
            track_id: metadata.pack_id,
            played: false,
            downloaded: true,
            purchased: true,
            liked: false,
          }, { onConflict: 'user_id,track_id' })

        if (!eventError) {
          console.log("[v0] User track event recorded")
        }

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
          const { data: sellerSalesProfile } = await supabase
            .from("profiles")
            .select("total_sales")
            .eq("id", pack.user_id)
            .single()

          const newTotalSales = (sellerSalesProfile?.total_sales || 0) + (metadata.seller_earnings || 0)

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

      try {
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("email, username, plan")
          .eq("id", metadata.user_id)
          .single()

        if (userProfile?.email && metadata.plan) {
          const planFeatures = PLAN_FEATURES[metadata.plan as PlanType]?.features || []
          const planName = metadata.plan.charAt(0).toUpperCase() + metadata.plan.slice(1)

          const emailHtml = generatePlanPurchaseEmail({
            userName: userProfile.username || "Usuario",
            planName: planName,
            amount: metadata.final_price,
            features: planFeatures,
            purchaseDate: new Date().toLocaleDateString("es-AR"),
          })

          await sendBrevoEmail({
            to: [userProfile.email],
            subject: `Bienvenido al plan ${planName} - ArSound`,
            htmlContent: emailHtml,
            sender: {
              email: process.env.BREVO_SENDER_EMAIL || "noreply@arsound.com",
              name: "ArSound",
            },
          })

          console.log("[v0] Plan purchase email sent successfully")
        }
      } catch (emailError) {
        console.error("[v0] Error sending plan purchase email:", emailError)
      }
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
