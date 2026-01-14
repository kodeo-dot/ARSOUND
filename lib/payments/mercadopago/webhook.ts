import { getMercadoPagoConfig } from "./config"
import { createPurchase, recordDownload, incrementPackCounter, updateUserPlan } from "../../database/queries"
import { logger } from "../../utils/logger"
import type { PlanType } from "../../types/database.types"
import { createServerClient } from "@/lib/supabase/server-client"
import { PLAN_FEATURES } from "@/lib/plans"

interface PaymentData {
  id: string
  status: string
  status_detail: string
  transaction_amount: number
  external_reference?: string
  metadata?: {
    type: "pack_purchase" | "plan_subscription"
    [key: string]: any
  }
  additional_info?: {
    items?: Array<{
      id: string
      [key: string]: any
    }>
  }
}

interface PreferenceMetadata {
  type: "pack_purchase" | "plan_subscription"
  [key: string]: any
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

  let metadata = payment.metadata

  // MercadoPago API often doesn't return metadata in payment details
  // So we parse it from external_reference as a fallback
  if (!metadata || !metadata.type) {
    logger.info("Metadata missing, parsing external_reference", "MP_WEBHOOK", {
      paymentId: payment.id,
      externalReference: payment.external_reference,
    })

    if (payment.external_reference) {
      const parsed = parseExternalReference(payment.external_reference)
      if (parsed) {
        metadata = parsed
        logger.info("Successfully parsed external_reference", "MP_WEBHOOK", { paymentId: payment.id, metadata })
      }
    }

    // Also try to get info from additional_info.items
    if ((!metadata || !metadata.type) && payment.additional_info?.items?.[0]) {
      const itemId = payment.additional_info.items[0].id
      logger.info("Trying to parse from item ID", "MP_WEBHOOK", { paymentId: payment.id, itemId })

      if (itemId?.includes("_monthly")) {
        const userId = parseUserIdFromReference(payment.external_reference)
        if (userId) {
          metadata = {
            type: "plan_subscription",
            plan_type: itemId,
            user_id: userId,
          }
          logger.info("Parsed from item ID", "MP_WEBHOOK", { paymentId: payment.id, metadata })
        }
      }
    }
  }

  if (!metadata || !metadata.type) {
    logger.error("Unable to determine payment type", "MP_WEBHOOK", {
      paymentId: payment.id,
      hasMetadata: !!payment.metadata,
      externalReference: payment.external_reference,
    })
    return false
  }

  if (metadata.type === "pack_purchase") {
    return await processPackPurchase(payment, metadata)
  } else if (metadata.type === "plan_subscription") {
    return await processPlanSubscription(payment, metadata)
  }

  logger.warn("Unknown payment type", "MP_WEBHOOK", { paymentId: payment.id, type: metadata.type })
  return false
}

function parseExternalReference(externalRef: string): PreferenceMetadata | null {
  try {
    // Format: plan_<userId>_<planType> or plan_<uuid>_<planType>
    // Example: plan_f8e59ed9-4e02-40d0-87c4-6c022d996dc6_de_0_a_hit
    if (externalRef.startsWith("plan_")) {
      const parts = externalRef.split("_")

      // Handle: plan_<uuid>_<planType with underscores>
      // Find the UUID (parts[1] to parts[5] usually)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

      let userId = parts[1]
      let planTypeStart = 2

      // Check if it's a UUID spanning multiple parts (split by _)
      for (let i = 2; i <= 5 && i < parts.length; i++) {
        const combined = parts.slice(1, i + 1).join("-")
        if (uuidRegex.test(combined)) {
          userId = combined
          planTypeStart = i + 1
          break
        }
      }

      // If not found as UUID, try single part as UUID
      if (!uuidRegex.test(userId) && parts.length > planTypeStart) {
        // Maybe format is: plan_userId_planType
        userId = parts[1]
        planTypeStart = 2
      }

      // Reconstruct plan type from remaining parts
      const planType = parts.slice(planTypeStart).join("_")

      if (userId && planType) {
        return {
          type: "plan_subscription",
          plan_type: planType.replace("_monthly", ""), // Remove _monthly suffix if present
          user_id: userId,
        }
      }
    }

    // Format: pack_<buyerId>_<packId>
    if (externalRef.startsWith("pack_")) {
      const parts = externalRef.split("_")
      if (parts.length >= 3) {
        return {
          type: "pack_purchase",
          buyer_id: parts[1],
          pack_id: parts.slice(2).join("_"),
        }
      }
    }
  } catch (error) {
    logger.error("Error parsing external_reference", "MP_WEBHOOK", { externalRef, error })
  }

  return null
}

function parseUserIdFromReference(externalRef?: string): string | null {
  if (!externalRef) return null

  try {
    // Extract UUID from external_reference
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
    const match = externalRef.match(uuidRegex)
    return match ? match[0] : null
  } catch {
    return null
  }
}

async function processPackPurchase(payment: PaymentData, metadata: any): Promise<boolean> {
  const purchaseCode = `ARSND-${payment.id.substring(0, 8).toUpperCase()}`

  const paidPrice = metadata.final_price || payment.transaction_amount
  const baseAmount = metadata.original_price || paidPrice
  const discountAmount = baseAmount - paidPrice

  const platformCommission = metadata.commission_amount || 0
  const creatorEarnings = paidPrice - platformCommission

  // Create purchase record
  const purchaseId = await createPurchase({
    buyer_id: metadata.buyer_id,
    seller_id: metadata.seller_id,
    pack_id: metadata.pack_id,
    amount: paidPrice, // Keep amount as paid price for backwards compatibility
    paid_price: paidPrice, // Actual price paid with discount
    base_amount: baseAmount, // Original price before discount
    discount_amount: discountAmount,
    platform_commission: platformCommission, // NET earnings for platform
    creator_earnings: creatorEarnings,
    payment_method: "mercado_pago",
    mercado_pago_payment_id: payment.id,
    seller_mp_user_id: metadata.seller_mp_user_id,
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
    paidPrice,
    baseAmount,
    discountAmount,
    platformCommission,
    creatorEarnings,
  })

  return true
}

async function processPlanSubscription(payment: PaymentData, metadata: any): Promise<boolean> {
  try {
    // Normalize plan type: remove _monthly suffix and handle variations
    let planType = metadata.plan_type || ""

    // Remove _monthly suffix
    planType = planType.replace("_monthly", "")

    // Normalize hyphens to underscores
    planType = planType.replace(/-/g, "_")

    // Validate plan type
    const validPlans = ["free", "de_0_a_hit", "studio_plus"]
    if (!validPlans.includes(planType)) {
      logger.error("Invalid plan type", "MP_WEBHOOK", {
        paymentId: payment.id,
        originalPlanType: metadata.plan_type,
        normalizedPlanType: planType,
      })
      return false
    }

    const supabase = await createServerClient()
    const { data: profile } = await supabase.from("profiles").select("plan").eq("id", metadata.user_id).single()

    const currentPlan = (profile?.plan as PlanType) || "free"
    const newPlan = planType as PlanType

    const planHierarchy: Record<PlanType, number> = { free: 0, de_0_a_hit: 1, studio_plus: 2 }
    const isDowngrade = planHierarchy[newPlan] < planHierarchy[currentPlan]

    if (isDowngrade) {
      logger.info("Downgrade detected, handling excess packs", "MP_WEBHOOK", {
        userId: metadata.user_id,
        currentPlan,
        newPlan,
      })

      await handleDowngrade(metadata.user_id, currentPlan, newPlan)
    }

    // Calculate expiration (30 days for monthly plans)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    logger.info("Starting plan activation", "MP_WEBHOOK", {
      paymentId: payment.id,
      userId: metadata.user_id,
      originalPlanType: metadata.plan_type,
      normalizedPlanType: planType,
      expiresAt: expiresAt.toISOString(),
      isDowngrade,
    })

    const success = await updateUserPlan(metadata.user_id, planType as PlanType, expiresAt)

    if (!success) {
      logger.error("Failed to update user plan", "MP_WEBHOOK", {
        paymentId: payment.id,
        userId: metadata.user_id,
        planType,
      })
      return false
    }

    logger.info("Plan subscription processed successfully", "MP_WEBHOOK", {
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

async function handleDowngrade(userId: string, currentPlan: PlanType, newPlan: PlanType): Promise<void> {
  try {
    const supabase = await createServerClient()
    const newPlanFeatures = PLAN_FEATURES[newPlan]

    // Get all active packs for the user
    const { data: packs, error: packsError } = await supabase
      .from("packs")
      .select("id, created_at")
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .eq("archived", false)
      .order("created_at", { ascending: false }) // Newest first

    if (packsError || !packs) {
      logger.error("Failed to fetch user packs for downgrade", "MP_WEBHOOK", { userId, error: packsError })
      return
    }

    let packsToKeep = packs.length

    // Determine how many packs the user can keep on the new plan
    if (newPlan === "free" && newPlanFeatures.maxTotalPacks !== null) {
      packsToKeep = newPlanFeatures.maxTotalPacks // Free: 3 packs total
    } else if (newPlan === "de_0_a_hit" && newPlanFeatures.maxPacksPerMonth !== null) {
      // For de_0_a_hit downgrade from studio_plus: keep the newest 10 packs
      packsToKeep = newPlanFeatures.maxPacksPerMonth
    }

    // If user has more packs than allowed, archive the oldest ones
    if (packs.length > packsToKeep) {
      const packsToArchive = packs.slice(packsToKeep) // Keep newest, archive oldest
      const packIdsToArchive = packsToArchive.map((p) => p.id)

      logger.info("Archiving excess packs due to downgrade", "MP_WEBHOOK", {
        userId,
        totalPacks: packs.length,
        packsToKeep,
        packsToArchive: packIdsToArchive.length,
      })

      // Archive (soft delete) the excess packs
      const { error: archiveError } = await supabase.from("packs").update({ archived: true }).in("id", packIdsToArchive)

      if (archiveError) {
        logger.error("Failed to archive excess packs", "MP_WEBHOOK", { userId, error: archiveError })
      } else {
        logger.info("Successfully archived excess packs", "MP_WEBHOOK", {
          userId,
          archivedCount: packIdsToArchive.length,
        })
      }
    }

    // Note: Downloads remain unchanged until end of month (as per requirements)
    logger.info("Downgrade handled successfully", "MP_WEBHOOK", {
      userId,
      currentPlan,
      newPlan,
      totalPacks: packs.length,
      packsKept: Math.min(packs.length, packsToKeep),
    })
  } catch (error) {
    logger.error("Error handling downgrade", "MP_WEBHOOK", { userId, error })
  }
}
