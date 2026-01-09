import { getMercadoPagoConfig } from "./config"
import { getPackById, getProfile, getDiscountCode, incrementDiscountCodeUsage } from "../../database/queries"
import { calculateCommission, PLAN_PRICES } from "../../config/plans.config"
import { logger } from "../../utils/logger"
import { PaymentError, NotFoundError, ForbiddenError } from "../../utils/errors"
import type { PlanType } from "../../types/database.types"

interface PreferenceMetadata {
  type: "pack_purchase" | "plan_subscription"
  [key: string]: any
}

interface PreferenceData {
  items: Array<{
    id: string
    title: string
    quantity: number
    unit_price: number
    currency_id: string
  }>
  back_urls: {
    success: string
    failure: string
    pending: string
  }
  notification_url: string
  auto_return: string
  payer: {
    email: string
  }
  external_reference: string
  metadata: PreferenceMetadata
  collector_id?: string
  marketplace_fee?: number
  application_fee?: number
}

export async function createPackPreference(
  packId: string,
  buyerId: string,
  buyerEmail: string,
  discountCode?: string,
): Promise<{ init_point: string; preference_id: string }> {
  const pack = await getPackById(packId)

  if (!pack) {
    throw new NotFoundError("Pack")
  }

  const sellerProfile = await getProfile(pack.user_id)

  if (!sellerProfile) {
    throw new NotFoundError("Seller profile")
  }

  if (!sellerProfile.mp_connected || !sellerProfile.mp_user_id) {
    throw new ForbiddenError("El vendedor no tiene Mercado Pago conectado")
  }

  const sellerPlan = (sellerProfile.plan as PlanType) || "free"
  let finalPrice = pack.price
  let appliedDiscountPercent = 0

  // Apply discount code if provided
  if (discountCode) {
    const discount = await getDiscountCode(packId, discountCode)

    if (discount) {
      // Validate expiration
      if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
        throw new PaymentError("El código de descuento ha expirado")
      }

      // Validate max uses
      if (discount.max_uses && discount.uses_count >= discount.max_uses) {
        throw new PaymentError("El código ha alcanzado el límite de usos")
      }

      appliedDiscountPercent = discount.discount_percent
      finalPrice = Math.floor(pack.price * (1 - appliedDiscountPercent / 100))

      // Increment usage
      await incrementDiscountCodeUsage(discount.id)
    }
  }

  const commissionAmount = calculateCommission(finalPrice, sellerPlan)
  const sellerEarnings = finalPrice - commissionAmount

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://arsound.com.ar"

  const preferenceData: PreferenceData = {
    items: [
      {
        id: pack.id,
        title: pack.title,
        quantity: 1,
        unit_price: finalPrice,
        currency_id: "ARS",
      },
    ],
    back_urls: {
      success: `${baseUrl}/payment/success`,
      failure: `${baseUrl}/payment/failure`,
      pending: `${baseUrl}/payment/pending`,
    },
    notification_url: `${baseUrl}/api/webhooks/mercadopago`,
    auto_return: "approved",
    payer: {
      email: buyerEmail,
    },
    external_reference: `pack_${buyerId}_${packId}`,
    collector_id: sellerProfile.mp_user_id,
    marketplace_fee: commissionAmount,
    application_fee: commissionAmount,
    metadata: {
      type: "pack_purchase",
      pack_id: packId,
      buyer_id: buyerId,
      seller_id: pack.user_id,
      seller_mp_user_id: sellerProfile.mp_user_id,
      seller_plan: sellerPlan,
      commission_percent: calculateCommission(100, sellerPlan) / 100,
      commission_amount: commissionAmount,
      seller_earnings: sellerEarnings,
      final_price: finalPrice,
      original_price: pack.price,
      discount_percent: appliedDiscountPercent,
      discount_code: discountCode || null,
    },
  }

  return await createPreference(preferenceData)
}

export async function createPlanPreference(
  planType: string,
  userId: string,
  userEmail: string,
): Promise<{ init_point: string; preference_id: string }> {
  const price = PLAN_PRICES[planType]

  if (!price) {
    throw new PaymentError("Invalid plan type")
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://arsound.com.ar"

  const preferenceData: PreferenceData = {
    items: [
      {
        id: planType,
        title: `Plan ARSOUND - ${planType.includes("de_0") ? "De 0 a Hit" : "Studio Plus"}`,
        quantity: 1,
        unit_price: price,
        currency_id: "ARS",
      },
    ],
    back_urls: {
      success: `${baseUrl}/payment/success`,
      failure: `${baseUrl}/payment/failure`,
      pending: `${baseUrl}/payment/pending`,
    },
    notification_url: `${baseUrl}/api/webhooks/mercadopago`,
    auto_return: "approved",
    payer: {
      email: userEmail,
    },
    external_reference: `plan_${userId}_${planType}`,
    metadata: {
      type: "plan_subscription",
      plan_type: planType,
      user_id: userId,
    },
  }

  return await createPreference(preferenceData)
}

async function createPreference(data: PreferenceData): Promise<{ init_point: string; preference_id: string }> {
  const config = getMercadoPagoConfig()

  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.accessToken}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    logger.error("Failed to create preference", "MP_PREFERENCE", error)
    throw new PaymentError("Failed to create payment preference")
  }

  const preference = await response.json()

  if (!preference.init_point) {
    logger.error("Invalid preference response", "MP_PREFERENCE", preference)
    throw new PaymentError("Invalid preference response")
  }

  logger.info("Preference created", "MP_PREFERENCE", { preferenceId: preference.id })

  return {
    init_point: preference.init_point,
    preference_id: preference.id,
  }
}
