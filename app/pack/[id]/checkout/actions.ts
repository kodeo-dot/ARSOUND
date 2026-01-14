import { createClient } from "@/lib/supabase/server"
import { PLAN_FEATURES, type PlanType } from "@/lib/plans"
import type { DiscountCode, PriceBreakdown } from "@/types/discount"
import { createMercadoPagoPreference } from "@/lib/payment" // Declare the variable here

const MIN_PRICE = 500

export async function getDiscountInfo(packId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: pack } = await supabase
    .from("packs")
    .select("id, title, price, has_discount, discount_percent, studio_id")
    .eq("id", packId)
    .single()

  if (!pack) {
    return null
  }

  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single()

  const userPlan: PlanType = (profile?.plan as PlanType) || "free"
  const planFeatures = PLAN_FEATURES[userPlan]

  let basePrice = pack.price
  if (pack.has_discount && pack.discount_percent > 0) {
    basePrice = Math.floor(pack.price * (1 - pack.discount_percent / 100))
  }

  const feePercentage = planFeatures.platformFeePercentage
  const platformFee = basePrice * (feePercentage / 100)
  const finalPrice = basePrice + platformFee

  const priceBreakdown: PriceBreakdown = {
    basePrice,
    discountAmount: 0,
    platformFee,
    feePercentage,
    finalPrice,
  }

  return {
    priceBreakdown,
    packInfo: {
      title: pack.title,
      price: pack.price,
      has_discount: pack.has_discount,
      discount_percent: pack.discount_percent,
    },
    userPlan,
    maxPrice: planFeatures.maxPackPrice,
  }
}

export async function verifyDiscountCode(packId: string, code: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "No autenticado" }
  }

  const { data: pack } = await supabase
    .from("packs")
    .select("id, price, has_discount, discount_percent, studio_id")
    .eq("id", packId)
    .single()

  if (!pack) {
    return { success: false, error: "Pack no encontrado" }
  }

  const { data: discountCode } = await supabase
    .from("discount_codes")
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("studio_id", pack.studio_id)
    .eq("is_active", true)
    .single()

  if (!discountCode) {
    return { success: false, error: "Código inválido o expirado" }
  }

  if (discountCode.usage_limit && discountCode.usage_count >= discountCode.usage_limit) {
    return { success: false, error: "Código agotado" }
  }

  if (discountCode.expires_at && new Date(discountCode.expires_at) < new Date()) {
    return { success: false, error: "Código expirado" }
  }

  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single()

  const userPlan: PlanType = (profile?.plan as PlanType) || "free"
  const planFeatures = PLAN_FEATURES[userPlan]

  let basePrice = pack.price
  if (pack.has_discount && pack.discount_percent > 0) {
    basePrice = Math.floor(pack.price * (1 - pack.discount_percent / 100))
  }

  let discountAmount = 0
  if (discountCode.discount_type === "percentage") {
    discountAmount = basePrice * (discountCode.discount_value / 100)
  } else {
    discountAmount = discountCode.discount_value
  }

  const priceAfterDiscount = Math.max(0, basePrice - discountAmount)
  const platformFee = priceAfterDiscount * (planFeatures.platformFeePercentage / 100)
  const finalPrice = priceAfterDiscount + platformFee

  const priceBreakdown: PriceBreakdown = {
    basePrice,
    discountAmount,
    platformFee,
    feePercentage: planFeatures.platformFeePercentage,
    finalPrice,
  }

  return {
    success: true,
    code: discountCode as DiscountCode,
    priceBreakdown,
  }
}

export async function getPaymentLink(packId: string, discountCode: string | null, customPrice: number | null = null) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "No autenticado" }
  }

  const { data: pack } = await supabase
    .from("packs")
    .select("*, studio:studios(*), profiles!user_id(mp_user_id)")
    .eq("id", packId)
    .single()

  if (!pack) {
    return { success: false, error: "Pack no encontrado" }
  }

  const { data: buyerProfile } = await supabase.from("profiles").select("mp_user_id").eq("id", user.id).single()

  if (pack.profiles?.mp_user_id && buyerProfile?.mp_user_id && pack.profiles.mp_user_id === buyerProfile.mp_user_id) {
    console.log("[v0] Self-purchase attempt detected:", {
      buyerId: user.id,
      sellerId: pack.user_id,
      mpUserId: buyerProfile.mp_user_id,
    })
    return {
      success: false,
      error:
        "No podés comprar tu propio pack. Detectamos que estás usando la misma cuenta de MercadoPago que el vendedor.",
    }
  }

  if (pack.user_id === user.id) {
    return {
      success: false,
      error: "No podés comprar tu propio pack.",
    }
  }

  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single()

  const userPlan: PlanType = (profile?.plan as PlanType) || "free"
  const planFeatures = PLAN_FEATURES[userPlan]

  let basePrice = pack.price
  if (pack.has_discount && pack.discount_percent > 0) {
    basePrice = Math.floor(pack.price * (1 - pack.discount_percent / 100))
  }

  let discountAmount = 0
  let appliedDiscountCode: DiscountCode | null = null

  if (discountCode) {
    const { data: code } = await supabase
      .from("discount_codes")
      .select("*")
      .eq("code", discountCode.toUpperCase())
      .eq("studio_id", pack.studio_id)
      .eq("is_active", true)
      .single()

    if (code) {
      appliedDiscountCode = code as DiscountCode
      if (code.discount_type === "percentage") {
        discountAmount = basePrice * (code.discount_value / 100)
      } else {
        discountAmount = code.discount_value
      }
    }
  }

  const priceAfterDiscount = Math.max(0, basePrice - discountAmount)

  let finalBasePrice = priceAfterDiscount
  if (
    customPrice &&
    customPrice >= Math.max(priceAfterDiscount, MIN_PRICE) &&
    customPrice <= planFeatures.maxPackPrice
  ) {
    finalBasePrice = customPrice
  } else if (customPrice && customPrice < MIN_PRICE) {
    return {
      success: false,
      error: `El precio mínimo es $${MIN_PRICE}`,
    }
  }

  const platformFee = finalBasePrice * (planFeatures.platformFeePercentage / 100)
  const finalPrice = finalBasePrice + platformFee

  const { data: purchase, error: purchaseError } = await supabase
    .from("purchases")
    .insert({
      buyer_id: user.id,
      pack_id: pack.id,
      studio_id: pack.studio_id,
      amount: finalPrice,
      base_amount: finalBasePrice,
      platform_fee: platformFee,
      discount_code_id: appliedDiscountCode?.id || null,
      discount_amount: discountAmount,
      status: "pending",
    })
    .select()
    .single()

  if (purchaseError || !purchase) {
    console.error("[v0] Error creating purchase:", purchaseError)
    return { success: false, error: "Error al crear la compra" }
  }

  try {
    const preference = await createMercadoPagoPreference({
      title: pack.title,
      quantity: 1,
      unit_price: finalPrice,
      purchaseId: purchase.id,
      buyerEmail: user.email || "",
    })

    if (!preference?.init_point) {
      throw new Error("No se pudo obtener el link de pago")
    }

    await supabase.from("purchases").update({ payment_id: preference.id }).eq("id", purchase.id)

    if (appliedDiscountCode) {
      await supabase
        .from("discount_codes")
        .update({ usage_count: (appliedDiscountCode.usage_count || 0) + 1 })
        .eq("id", appliedDiscountCode.id)
    }

    return {
      success: true,
      paymentUrl: preference.init_point,
      purchaseId: purchase.id,
    }
  } catch (error) {
    console.error("[v0] Error creating payment:", error)
    await supabase.from("purchases").delete().eq("id", purchase.id)
    return { success: false, error: "Error al crear el pago" }
  }
}
