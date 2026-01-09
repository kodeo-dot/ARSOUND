import { getMercadoPagoConfig } from "./config"
import { createPurchase, recordDownload, incrementPackCounter, updateUserPlan } from "../../database/queries"
import { logger } from "../../utils/logger"
import type { PlanType } from "../../types/database.types"

interface PaymentData {
  id: string
  status: string
  status_detail: string
  transaction_amount: number
  metadata: {
    type: "pack_purchase" | "plan_subscription"
    [key: string]: any
  }
}

export async function getPaymentDetails(paymentId: string): Promise<PaymentData | null> {
  const config = getMercadoPagoConfig()

  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
      },
    })

    if (!response.ok) {
      logger.error("Failed to fetch payment", "MP_WEBHOOK", { paymentId, status: response.status })
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    logger.error("Error fetching payment", "MP_WEBHOOK", error)
    return null
  }
}

export async function processApprovedPayment(payment: PaymentData): Promise<boolean> {
  if (payment.status !== "approved") {
    logger.warn("Payment not approved", "MP_WEBHOOK", { paymentId: payment.id, status: payment.status })
    return false
  }

  const metadata = payment.metadata

  if (metadata.type === "pack_purchase") {
    return await processPackPurchase(payment)
  } else if (metadata.type === "plan_subscription") {
    return await processPlanSubscription(payment)
  }

  logger.warn("Unknown payment type", "MP_WEBHOOK", { paymentId: payment.id, type: metadata.type })
  return false
}

async function processPackPurchase(payment: PaymentData): Promise<boolean> {
  const metadata = payment.metadata

  try {
    const purchaseCode = `ARSND-${payment.id.substring(0, 8).toUpperCase()}`

    // Create purchase record
    const purchaseId = await createPurchase({
      buyer_id: metadata.buyer_id,
      seller_id: metadata.seller_id,
      pack_id: metadata.pack_id,
      amount: metadata.final_price,
      discount_amount: metadata.original_price - metadata.final_price,
      platform_commission: metadata.commission_amount,
      creator_earnings: metadata.seller_earnings,
      payment_method: "mercado_pago",
      mercado_pago_payment_id: payment.id,
      purchase_code: purchaseCode,
    })

    if (!purchaseId) {
      logger.error("Failed to create purchase", "MP_WEBHOOK", { paymentId: payment.id })
      return false
    }

    // Record download
    await recordDownload(metadata.buyer_id, metadata.pack_id)

    // Increment counters
    await incrementPackCounter(metadata.pack_id, "downloads_count")

    logger.info("Pack purchase processed", "MP_WEBHOOK", {
      paymentId: payment.id,
      purchaseId,
      packId: metadata.pack_id,
      amount: metadata.final_price,
    })

    return true
  } catch (error) {
    logger.error("Error processing pack purchase", "MP_WEBHOOK", error)
    return false
  }
}

async function processPlanSubscription(payment: PaymentData): Promise<boolean> {
  const metadata = payment.metadata

  try {
    const planType = metadata.plan_type.replace("_monthly", "") as PlanType

    // Calculate expiration (30 days for monthly plans)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const success = await updateUserPlan(metadata.user_id, planType, expiresAt)

    if (!success) {
      logger.error("Failed to update user plan", "MP_WEBHOOK", { paymentId: payment.id })
      return false
    }

    logger.info("Plan subscription processed", "MP_WEBHOOK", {
      paymentId: payment.id,
      userId: metadata.user_id,
      planType,
    })

    return true
  } catch (error) {
    logger.error("Error processing plan subscription", "MP_WEBHOOK", error)
    return false
  }
}
