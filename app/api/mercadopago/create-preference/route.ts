import { createServerClient } from "@/lib/supabase/server-client"
import { NextResponse } from "next/server"
import { PLAN_FEATURES, type PlanType } from "@/lib/plans"

export async function POST(request: Request) {
  try {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
    const publicKey = process.env.MERCADO_PAGO_PUBLIC_KEY

    if (!accessToken || !publicKey) {
      console.error("[v0] Mercado Pago credentials not configured")
      return NextResponse.json(
        { error: "Error al crear la preferencia de pago. Revisá las credenciales de Mercado Pago." },
        { status: 500 }
      )
    }

    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { packId, planType, discountCode } = body

    if (!packId && !planType) {
      return NextResponse.json({ error: "Se requiere packId o planType" }, { status: 400 })
    }

    const preferenceData: any = {
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/payment/failure`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/payment/pending`,
      },
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
      auto_return: "approved",
      payer: {
        email: user.email,
      },
    }

    if (packId) {
      const { data: pack, error: packError } = await supabase
        .from("packs")
        .select("id, title, price, user_id, discount_percent, has_discount")
        .eq("id", packId)
        .single()

      if (packError || !pack) {
        return NextResponse.json({ error: "Pack no encontrado" }, { status: 404 })
      }

      const { data: sellerProfile, error: sellerError } = await supabase
        .from("profiles")
        .select("plan, mp_user_id, mp_connected")
        .eq("id", pack.user_id)
        .single()

      if (sellerError || !sellerProfile) {
        return NextResponse.json(
          { error: "No se pudo obtener información del vendedor" },
          { status: 404 }
        )
      }

      if (!sellerProfile.mp_connected || !sellerProfile.mp_user_id) {
        return NextResponse.json(
          { error: "El vendedor no tiene Mercado Pago conectado" },
          { status: 403 }
        )
      }

      const sellerPlan = (sellerProfile.plan as PlanType) || "free"
      const commission = PLAN_FEATURES[sellerPlan].commission

      let finalPrice = pack.price
      let appliedDiscountPercent = 0
      
      if (discountCode) {
        const { data: discountData, error: discountError } = await supabase
          .from("discount_codes")
          .select("*")
          .eq("pack_id", packId)
          .eq("code", discountCode.toUpperCase())
          .single()

        if (!discountError && discountData) {
          // Validate expiration
          if (discountData.expires_at && new Date(discountData.expires_at) < new Date()) {
            return NextResponse.json(
              { error: "El código de descuento ha expirado" },
              { status: 400 }
            )
          }

          // Validate max uses
          if (discountData.max_uses && discountData.uses_count >= discountData.max_uses) {
            return NextResponse.json(
              { error: "El código ha alcanzado el límite de usos" },
              { status: 400 }
            )
          }

          // Validate follower requirement
          if (discountData.for_followers) {
            const { data: followData } = await supabase
              .from("followers")
              .select("id")
              .eq("follower_id", user.id)
              .eq("following_id", pack.user_id)
              .single()

            if (!followData) {
              return NextResponse.json(
                { error: "Este código es solo para seguidores" },
                { status: 400 }
              )
            }
          }

          // Validate first purchase requirement
          if (discountData.for_first_purchase) {
            const { data: previousPurchases } = await supabase
              .from("purchases")
              .select("id")
              .eq("buyer_id", user.id)
              .limit(1)

            if (previousPurchases && previousPurchases.length > 0) {
              return NextResponse.json(
                { error: "Este código es solo para primera compra" },
                { status: 400 }
              )
            }
          }

          appliedDiscountPercent = discountData.discount_percent
          finalPrice = Math.floor(pack.price * (1 - appliedDiscountPercent / 100))
          
          await supabase
            .from("discount_codes")
            .update({ uses_count: (discountData.uses_count || 0) + 1 })
            .eq("id", discountData.id)
        }
      }

      const commissionAmount = Math.floor(finalPrice * commission)
      const sellerEarnings = finalPrice - commissionAmount

      preferenceData.items = [
        {
          id: pack.id,
          title: pack.title,
          quantity: 1,
          unit_price: finalPrice,
          currency_id: "ARS",
        },
      ]
      preferenceData.external_reference = `pack_${user.id}_${packId}`
      
      preferenceData.marketplace_fee = commissionAmount

      preferenceData.application_fee = commissionAmount
      preferenceData.collector_id = sellerProfile.mp_user_id

      preferenceData.metadata = {
        type: "pack_purchase",
        pack_id: packId,
        buyer_id: user.id,
        seller_id: pack.user_id,
        seller_plan: sellerPlan,
        commission_percent: commission,
        commission_amount: commissionAmount,
        seller_earnings: sellerEarnings,
        final_price: finalPrice,
        original_price: pack.price,
        discount_percent: appliedDiscountPercent,
        discount_code: discountCode || null,
      }
    }

    if (planType) {
      const planPrices: Record<string, number> = {
        de_0_a_hit: 5000,
        de_0_a_hit_monthly: 5000,
        studio_plus: 15000,
        studio_plus_monthly: 15000,
      }

      const price = planPrices[planType]
      if (!price) {
        return NextResponse.json({ error: "Plan inválido" }, { status: 400 })
      }

      preferenceData.items = [
        {
          id: planType,
          title: `Plan ARSOUND - ${planType.includes("de_0") ? "De 0 a Hit" : "Studio Plus"}`,
          quantity: 1,
          unit_price: price,
          currency_id: "ARS",
        },
      ]
      preferenceData.external_reference = `plan_${user.id}_${planType}`
      preferenceData.metadata = {
        type: "plan_subscription",
        plan_type: planType,
        user_id: user.id,
      }
    }

    try {
      const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(preferenceData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Mercado Pago API error:", response.status, errorData)
        return NextResponse.json(
          { error: "Error al crear la preferencia de pago. Revisá las credenciales de Mercado Pago." },
          { status: response.status }
        )
      }

      const preference = await response.json()
      
      if (!preference.init_point) {
        console.error("[v0] Mercado Pago response missing init_point:", preference)
        return NextResponse.json(
          { error: "Respuesta inválida de Mercado Pago" },
          { status: 500 }
        )
      }

      return NextResponse.json({
        init_point: preference.init_point,
        preference_id: preference.id,
      })
    } catch (apiError) {
      console.error("[v0] Error calling Mercado Pago API:", apiError)
      return NextResponse.json(
        { error: "Error al crear la preferencia de pago. Revisá las credenciales de Mercado Pago." },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("[v0] Error creating Mercado Pago preference:", error)
    return NextResponse.json({ error: "Error al crear preferencia de pago" }, { status: 500 })
  }
}
