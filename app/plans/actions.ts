"use server"

import { createServerClient } from "@/lib/supabase/server"
import { PLAN_FEATURES, type PlanType } from "@/lib/plans"
import { headers } from "next/headers"

/**
 * Helper to get the origin URL dynamically from request headers
 * Falls back to environment variable if headers unavailable
 */
async function getOrigin(): Promise<string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  
  console.log("[v0] NEXT_PUBLIC_APP_URL value:", appUrl)
  
  if (appUrl && appUrl.trim().length > 0 && appUrl.startsWith("http")) {
    console.log("[v0] Using NEXT_PUBLIC_APP_URL:", appUrl)
    return appUrl
  }

  try {
    const headersList = await headers()
    const host = headersList.get("host")
    const proto = headersList.get("x-forwarded-proto") || "http"
    
    let finalProto = proto
    if (host?.includes("localhost") || host?.includes("127.0.0.1")) {
      finalProto = "http"
      console.log("[v0] Detected localhost, forcing HTTP protocol")
    }
    
    if (host) {
      const origin = `${finalProto}://${host}`
      console.log("[v0] Constructed origin from headers:", origin)
      return origin
    }
  } catch (e) {
    console.log("[v0] Could not read headers, falling back to default")
  }

  const fallback = "http://localhost:3000"
  console.log("[v0] Using fallback origin:", fallback)
  return fallback
}

/**
 * Server action to create Mercado Pago preference for plan selection
 * Now fully on server - no fetch call needed
 */
async function createMercadoPagoPreference(planType: string) {
  const testMode = process.env.MERCADO_PAGO_TEST_MODE === "true"
  const accessToken = testMode 
    ? process.env.MERCADO_PAGO_TEST_ACCESS_TOKEN 
    : process.env.MERCADO_PAGO_ACCESS_TOKEN
  const publicKey = testMode
    ? process.env.MERCADO_PAGO_TEST_PUBLIC_KEY
    : process.env.MERCADO_PAGO_PUBLIC_KEY

  if (!accessToken || !publicKey) {
    console.error("[v0] Mercado Pago credentials not configured. TestMode:", testMode)
    return { success: false, message: "Error al configurar el pago. Contacta con soporte." }
  }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: "Por favor inicia sesión para continuar" }
  }

  try {
    const planPrices: Record<string, number> = {
      de_0_a_hit: 5000,
      de_0_a_hit_monthly: 5000,
      studio_plus: 15000,
      studio_plus_monthly: 15000,
    }

    const price = planPrices[planType]
    if (!price) {
      return { success: false, message: "Plan inválido" }
    }

    const origin = await getOrigin()
    console.log("[v0] Final origin being used:", origin)

    const preferenceData = {
      back_urls: {
        success: `${origin}/payment/success`,
        failure: `${origin}/payment/failure`,
        pending: `${origin}/payment/pending`,
      },
      notification_url: `${origin}/api/webhooks/mercadopago`,
      auto_return: "approved" as const,
      payer: {
        email: user.email,
      },
      items: [
        {
          id: planType,
          title: `Plan ARSOUND - ${planType.includes("de_0") ? "De 0 a Hit" : "Studio Plus"}`,
          quantity: 1,
          unit_price: price,
          currency_id: "ARS",
        },
      ],
      external_reference: `plan_${user.id}_${planType}`,
      metadata: {
        type: "plan_subscription",
        plan_type: planType,
        user_id: user.id,
        test_mode: testMode,
      },
    }

    console.log("[v0] Preference data being sent:", JSON.stringify(preferenceData, null, 2))

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
      console.error("[v0] Mercado Pago API error:", errorData)
      return { success: false, message: "Error al crear la preferencia de pago. Revisá las credenciales." }
    }

    const preference = await response.json()

    if (!preference.init_point) {
      console.error("[v0] Mercado Pago response missing init_point:", preference)
      return { success: false, message: "Error al procesar el pago. Intenta de nuevo." }
    }

    return { success: true, init_point: preference.init_point, preferenceId: preference.id }
  } catch (error) {
    console.error("[v0] Error in createMercadoPagoPreference:", error)
    return { success: false, message: "Error al crear la preferencia de pago" }
  }
}

/**
 * Server action to handle plan selection
 * Creates a Mercado Pago preference and returns checkout URL
 */
export async function selectPlan(planId: string) {
  if (!planId || planId === "free") {
    return { success: false, message: "Plan inválido" }
  }

  return createMercadoPagoPreference(planId)
}

/**
 * Server action to purchase a pack
 * Creates a Mercado Pago preference for pack purchase
 */
export async function purchasePack(packId: string, discountCode?: string) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: "Por favor inicia sesión para continuar" }
  }

  const testMode = process.env.MERCADO_PAGO_TEST_MODE === "true"
  const accessToken = testMode
    ? process.env.MERCADO_PAGO_TEST_ACCESS_TOKEN
    : process.env.MERCADO_PAGO_ACCESS_TOKEN
  const publicKey = testMode
    ? process.env.MERCADO_PAGO_TEST_PUBLIC_KEY
    : process.env.MERCADO_PAGO_PUBLIC_KEY

  if (!accessToken || !publicKey) {
    console.error("[v0] Mercado Pago credentials not configured. TestMode:", testMode)
    return { success: false, message: "Error al configurar el pago. Contacta con soporte." }
  }

  try {
    const { data: pack, error: packError } = await supabase
      .from("packs")
      .select("id, title, price, user_id, discount_percent, has_discount")
      .eq("id", packId)
      .single()

    if (packError || !pack) {
      return { success: false, message: "Pack no encontrado" }
    }

    const { data: sellerProfile, error: sellerError } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", pack.user_id)
      .single()

    if (sellerError || !sellerProfile) {
      return { success: false, message: "No se pudo obtener información del vendedor" }
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
        if (discountData.expires_at && new Date(discountData.expires_at) < new Date()) {
          return { success: false, message: "El código de descuento ha expirado" }
        }

        if (discountData.max_uses && discountData.uses_count >= discountData.max_uses) {
          return { success: false, message: "El código ha alcanzado el límite de usos" }
        }

        appliedDiscountPercent = discountData.discount_percent
        finalPrice = Math.floor(pack.price * (1 - appliedDiscountPercent / 100))
      }
    }

    const commissionAmount = Math.floor(finalPrice * commission)
    const sellerEarnings = finalPrice - commissionAmount

    const origin = await getOrigin()
    console.log("[v0] Final origin being used:", origin)

    const preferenceData = {
      back_urls: {
        success: `${origin}/payment/success`,
        failure: `${origin}/payment/failure`,
        pending: `${origin}/payment/pending`,
      },
      notification_url: `${origin}/api/webhooks/mercadopago`,
      auto_return: "approved" as const,
      payer: {
        email: user.email,
      },
      items: [
        {
          id: pack.id,
          title: pack.title,
          quantity: 1,
          unit_price: finalPrice,
          currency_id: "ARS",
        },
      ],
      external_reference: `pack_${user.id}_${packId}`,
      marketplace_fee: commissionAmount,
      transfer_data: {
        amount: sellerEarnings,
        receiver_account_id: null,
      },
      metadata: {
        type: "pack_purchase",
        pack_id: packId,
        buyer_id: user.id,
        seller_id: pack.user_id,
        seller_plan: sellerPlan,
        commission_percent: commission,
        commission_amount: commissionAmount,
        seller_earnings: sellerEarnings,
        final_price: finalPrice,
        discount_percent: appliedDiscountPercent,
        discount_code: discountCode || null,
        test_mode: testMode,
      },
    }

    console.log("[v0] Preference data being sent:", JSON.stringify(preferenceData, null, 2))

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
      console.error("[v0] Mercado Pago API error:", errorData)
      return { success: false, message: "Error al crear la preferencia de pago. Intenta de nuevo." }
    }

    const preference = await response.json()

    if (!preference.init_point) {
      console.error("[v0] No init_point in response:", preference)
      return { success: false, message: "Error al procesar el pago. Intenta de nuevo." }
    }

    return { success: true, init_point: preference.init_point, preferenceId: preference.id }
  } catch (error) {
    console.error("[v0] Error in purchasePack:", error)
    return { success: false, message: "Error al crear la preferencia de pago" }
  }
}
