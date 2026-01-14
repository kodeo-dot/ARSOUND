import { getMercadoPagoConfig } from "./config"
import {
  createPurchase,
  recordDownload,
  incrementPackCounter,
  updateUserPlan,
  createPlanPurchase,
  getPackById,
  getProfile,
} from "../../database/queries"
import { logger } from "../../utils/logger"
import type { PlanType } from "../../types/database.types"
import { createServerClient } from "@/lib/supabase/server-client"
import { PLAN_FEATURES } from "@/lib/plans"
import { sendPlanPurchaseNotification } from "../../email/notifications"
import { calculateCommission } from "../../config/plans.config"
import { createTransferToSeller } from "./transfer"

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

export async function processPayment(payment: PaymentData): Promise<boolean> {
  console.log("[v0] 📋 WEBHOOK: Processing payment", {
    paymentId: payment.id,
    status: payment.status,
    statusDetail: payment.status_detail,
    amount: payment.transaction_amount,
  })

  let metadata = payment.metadata

  // Parse metadata if missing
  if (!metadata || !metadata.type) {
    console.log("[v0] 🔍 WEBHOOK: Metadata missing, parsing external_reference", {
      paymentId: payment.id,
      externalReference: payment.external_reference,
    })

    if (payment.external_reference) {
      const parsed = parseExternalReference(payment.external_reference)
      if (parsed) {
        metadata = parsed
        console.log("[v0] ✅ WEBHOOK: Successfully parsed external_reference", { paymentId: payment.id, metadata })
      }
    }

    if ((!metadata || !metadata.type) && payment.additional_info?.items?.[0]) {
      const itemId = payment.additional_info.items[0].id
      console.log("[v0] 🔍 WEBHOOK: Trying to parse from item ID", { paymentId: payment.id, itemId })

      if (itemId?.includes("_monthly")) {
        const userId = parseUserIdFromReference(payment.external_reference)
        if (userId) {
          metadata = {
            type: "plan_subscription",
            plan_type: itemId,
            user_id: userId,
          }
          console.log("[v0] ✅ WEBHOOK: Parsed from item ID", { paymentId: payment.id, metadata })
        }
      }
    }
  }

  if (!metadata || !metadata.type) {
    console.error("[v0] ❌ WEBHOOK: Unable to determine payment type", {
      paymentId: payment.id,
      hasMetadata: !!payment.metadata,
      externalReference: payment.external_reference,
    })
    return false
  }

  if (payment.status === "approved") {
    console.log("[v0] ✅ WEBHOOK: Payment approved, processing purchase")
    return await processApprovedPayment(payment)
  } else if (["pending", "in_process", "in_mediation"].includes(payment.status)) {
    console.log("[v0] ⏳ WEBHOOK: Payment pending, recording attempt", {
      status: payment.status,
      statusDetail: payment.status_detail,
    })
    return await recordPendingPayment(payment, metadata)
  } else if (["rejected", "cancelled", "refunded", "charged_back"].includes(payment.status)) {
    console.log("[v0] ❌ WEBHOOK: Payment failed, recording attempt", {
      status: payment.status,
      statusDetail: payment.status_detail,
    })
    return await recordFailedPayment(payment, metadata)
  } else {
    console.log("[v0] ⚠️ WEBHOOK: Unknown payment status", {
      paymentId: payment.id,
      status: payment.status,
    })
    return false
  }
}

async function recordPendingPayment(payment: PaymentData, metadata: any): Promise<boolean> {
  const purchaseCode = `ARSND-${payment.id.substring(0, 8).toUpperCase()}`
  const paidPrice = metadata.final_price || payment.transaction_amount
  const baseAmount = metadata.original_price || paidPrice

  console.log("[v0] ⏳ Recording pending payment", {
    paymentId: payment.id,
    type: metadata.type,
    status: payment.status,
    statusDetail: payment.status_detail,
    amount: paidPrice,
  })

  if (metadata.type === "pack_purchase") {
    const purchaseId = await createPurchase({
      buyer_id: metadata.buyer_id,
      seller_id: metadata.seller_id,
      pack_id: metadata.pack_id,
      amount: paidPrice,
      paid_price: paidPrice,
      base_amount: baseAmount,
      discount_amount: baseAmount - paidPrice,
      platform_commission: 0,
      creator_earnings: 0,
      payment_method: "mercado_pago",
      mercado_pago_payment_id: payment.id,
      seller_mp_user_id: metadata.seller_mp_user_id,
      purchase_code: purchaseCode,
      payment_status: payment.status,
    })

    console.log("[v0] ⏳ Pending pack purchase recorded", {
      purchaseId,
      packId: metadata.pack_id,
      status: payment.status,
    })

    return !!purchaseId
  } else if (metadata.type === "plan_subscription") {
    const purchaseId = await createPlanPurchase({
      buyer_id: metadata.user_id,
      plan_type: metadata.plan_type,
      amount: paidPrice,
      paid_price: paidPrice,
      base_amount: baseAmount,
      discount_amount: baseAmount - paidPrice,
      payment_method: "mercado_pago",
      mercado_pago_payment_id: payment.id,
      purchase_code: purchaseCode,
      payment_status: payment.status,
    })

    console.log("[v0] ⏳ Pending plan purchase recorded", {
      purchaseId,
      planType: metadata.plan_type,
      status: payment.status,
    })

    return !!purchaseId
  }

  return false
}

async function recordFailedPayment(payment: PaymentData, metadata: any): Promise<boolean> {
  const purchaseCode = `ARSND-${payment.id.substring(0, 8).toUpperCase()}`
  const paidPrice = metadata.final_price || payment.transaction_amount
  const baseAmount = metadata.original_price || paidPrice

  console.log("[v0] ❌ Recording failed payment", {
    paymentId: payment.id,
    type: metadata.type,
    status: payment.status,
    statusDetail: payment.status_detail,
    amount: paidPrice,
  })

  if (metadata.type === "pack_purchase") {
    const purchaseId = await createPurchase({
      buyer_id: metadata.buyer_id,
      seller_id: metadata.seller_id,
      pack_id: metadata.pack_id,
      amount: paidPrice,
      paid_price: paidPrice,
      base_amount: baseAmount,
      discount_amount: baseAmount - paidPrice,
      platform_commission: 0,
      creator_earnings: 0,
      payment_method: "mercado_pago",
      mercado_pago_payment_id: payment.id,
      seller_mp_user_id: metadata.seller_mp_user_id,
      purchase_code: purchaseCode,
      payment_status: payment.status,
    })

    console.log("[v0] ❌ Failed pack purchase recorded", {
      purchaseId,
      packId: metadata.pack_id,
      status: payment.status,
      reason: payment.status_detail,
    })

    return !!purchaseId
  } else if (metadata.type === "plan_subscription") {
    const purchaseId = await createPlanPurchase({
      buyer_id: metadata.user_id,
      plan_type: metadata.plan_type,
      amount: paidPrice,
      paid_price: paidPrice,
      base_amount: baseAmount,
      discount_amount: baseAmount - paidPrice,
      payment_method: "mercado_pago",
      mercado_pago_payment_id: payment.id,
      purchase_code: purchaseCode,
      payment_status: payment.status,
    })

    console.log("[v0] ❌ Failed plan purchase recorded", {
      purchaseId,
      planType: metadata.plan_type,
      status: payment.status,
      reason: payment.status_detail,
    })

    return !!purchaseId
  }

  return false
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

async function processPackPurchase(payment: PaymentData, metadata: any): Promise<boolean> {
  const purchaseCode = `ARSND-${payment.id.substring(0, 8).toUpperCase()}`

  const paidPrice = metadata.final_price || payment.transaction_amount
  const baseAmount = metadata.original_price || paidPrice
  const discountAmount = baseAmount - paidPrice

  console.log("[v0] 🎯 WEBHOOK: Processing pack purchase", {
    paymentId: payment.id,
    packId: metadata.pack_id,
    sellerId: metadata.seller_id,
    buyerId: metadata.buyer_id,
    usesOAuthSplit: metadata.uses_oauth_split || false,
  })

  let platformCommission = metadata.commission_amount || 0
  let creatorEarnings = metadata.seller_earnings || 0

  console.log("[v0] 💰 WEBHOOK: Payment metadata values", {
    paidPrice,
    baseAmount,
    discountAmount,
    platformCommission: metadata.commission_amount,
    creatorEarnings: metadata.seller_earnings,
    sellerPlan: metadata.seller_plan,
    usesOAuthSplit: metadata.uses_oauth_split,
  })

  if (platformCommission === 0 && creatorEarnings === 0 && paidPrice > 0) {
    console.log("[v0] ⚠️ WEBHOOK: Commission data missing, recalculating...")

    try {
      const pack = await getPackById(metadata.pack_id)
      if (pack) {
        const sellerProfile = await getProfile(pack.user_id)
        const sellerPlan = (sellerProfile?.plan as PlanType) || "free"
        platformCommission = calculateCommission(paidPrice, sellerPlan)
        creatorEarnings = paidPrice - platformCommission

        console.log("[v0] ✅ WEBHOOK: Recalculated commission from seller plan", {
          paymentId: payment.id,
          sellerPlan,
          paidPrice,
          platformCommission,
          creatorEarnings,
          commissionPercent: `${((platformCommission / paidPrice) * 100).toFixed(1)}%`,
        })
      }
    } catch (error) {
      console.error("[v0] ❌ WEBHOOK: Failed to recalculate commission", error)
      platformCommission = 0
      creatorEarnings = paidPrice
    }
  }

  console.log("[v0] 💵 WEBHOOK: FINAL PAYMENT SPLIT", {
    totalPaid: `$${paidPrice.toFixed(2)}`,
    platformCommission: `$${platformCommission.toFixed(2)}`,
    platformPercent: `${((platformCommission / paidPrice) * 100).toFixed(1)}%`,
    creatorEarnings: `$${creatorEarnings.toFixed(2)}`,
    creatorPercent: `${((creatorEarnings / paidPrice) * 100).toFixed(1)}%`,
    verification: `${paidPrice} = ${platformCommission} (Arsound) + ${creatorEarnings} (Vendedor)`,
  })

  const purchaseId = await createPurchase({
    buyer_id: metadata.buyer_id,
    seller_id: metadata.seller_id,
    pack_id: metadata.pack_id,
    amount: paidPrice,
    paid_price: paidPrice,
    base_amount: baseAmount,
    discount_amount: discountAmount,
    platform_commission: platformCommission,
    creator_earnings: creatorEarnings,
    payment_method: "mercado_pago",
    mercado_pago_payment_id: payment.id,
    seller_mp_user_id: metadata.seller_mp_user_id,
    purchase_code: purchaseCode,
    payment_status: "approved",
  })

  if (!purchaseId) {
    console.error("[v0] ❌ WEBHOOK: Failed to create purchase record")
    logger.error("Failed to create purchase", "MP_WEBHOOK", { paymentId: payment.id })
    return false
  }

  console.log("[v0] ✅ WEBHOOK: Purchase record created in database", {
    purchaseId,
    purchaseCode,
  })

  await recordDownload(metadata.buyer_id, metadata.pack_id)
  await incrementPackCounter(metadata.pack_id, "downloads_count")

  if (metadata.uses_oauth_split) {
    console.log("[v0] ✅ WEBHOOK: OAuth split was used - Mercado Pago already divided the payment automatically", {
      sellerReceived: `$${creatorEarnings.toFixed(2)}`,
      arsoundReceived: `$${platformCommission.toFixed(2)}`,
      note: "No manual transfer needed - MP handled the split",
    })
  } else if (metadata.needs_transfer && metadata.seller_mp_user_id && creatorEarnings > 0) {
    console.log("[v0] 💸 WEBHOOK: OAuth split NOT used, attempting manual transfer", {
      sellerMpUserId: metadata.seller_mp_user_id,
      amount: creatorEarnings,
    })

    try {
      const pack = await getPackById(metadata.pack_id)
      const packTitle = pack?.title || "Pack"

      const transferResult = await createTransferToSeller(
        metadata.seller_mp_user_id,
        creatorEarnings,
        purchaseId,
        packTitle,
      )

      if (transferResult) {
        console.log("[v0] ✅ WEBHOOK: Transfer initiated successfully", {
          transferId: transferResult.transfer_id,
          status: transferResult.status,
          amount: `$${creatorEarnings.toFixed(2)}`,
        })
      } else {
        console.log("[v0] ⚠️ WEBHOOK: Transfer failed - seller will need manual payout", {
          purchaseId,
          sellerMpUserId: metadata.seller_mp_user_id,
          amount: creatorEarnings,
        })
      }
    } catch (transferError) {
      console.error("[v0] ❌ WEBHOOK: Error during transfer attempt", transferError)
      logger.error("Transfer failed", "MP_WEBHOOK", {
        purchaseId,
        sellerMpUserId: metadata.seller_mp_user_id,
        amount: creatorEarnings,
        error: transferError,
      })
    }
  } else if (!metadata.seller_mp_user_id) {
    console.log("[v0] ℹ️ WEBHOOK: Seller doesn't have MP connected - no automatic transfer", {
      sellerId: metadata.seller_id,
      amount: creatorEarnings,
    })
  }

  console.log("[v0] 🎉 WEBHOOK: Pack purchase processed successfully", {
    paymentId: payment.id,
    purchaseId,
    packId: metadata.pack_id,
    summary: {
      paid: `$${paidPrice.toFixed(2)}`,
      arsound: `$${platformCommission.toFixed(2)}`,
      seller: `$${creatorEarnings.toFixed(2)}`,
      splitMethod: metadata.uses_oauth_split ? "OAuth (automatic)" : "Manual transfer",
    },
  })

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
    let planType = metadata.plan_type || ""

    planType = planType.replace("_monthly", "")
    planType = planType.replace(/-/g, "_")

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

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const paidPrice = metadata.final_price || payment.transaction_amount
    const basePrice = metadata.base_price || paidPrice
    const discountAmount = basePrice - paidPrice

    logger.info("Starting plan activation", "MP_WEBHOOK", {
      paymentId: payment.id,
      userId: metadata.user_id,
      originalPlanType: metadata.plan_type,
      normalizedPlanType: planType,
      expiresAt: expiresAt.toISOString(),
      isDowngrade,
      paidPrice,
      basePrice,
      discountAmount,
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

    const purchaseCode = `ARSND-${payment.id.substring(0, 8).toUpperCase()}`

    const purchaseId = await createPlanPurchase({
      buyer_id: metadata.user_id,
      plan_type: planType,
      amount: paidPrice,
      paid_price: paidPrice,
      base_amount: basePrice,
      discount_amount: discountAmount,
      payment_method: "mercado_pago",
      mercado_pago_payment_id: payment.id,
      purchase_code: purchaseCode,
      payment_status: "approved",
    })

    if (!purchaseId) {
      logger.error("Failed to create plan purchase record", "MP_WEBHOOK", { paymentId: payment.id })
    } else {
      logger.info("Plan purchase record created", "MP_WEBHOOK", {
        paymentId: payment.id,
        purchaseId,
      })
    }

    try {
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("username, display_name")
        .eq("id", metadata.user_id)
        .single()

      const {
        data: { user },
      } = await supabase.auth.admin.getUserById(metadata.user_id)

      if (user?.email) {
        const planNames: Record<string, string> = {
          de_0_a_hit: "De 0 a Hit",
          studio_plus: "Studio Plus",
        }

        await sendPlanPurchaseNotification({
          userEmail: user.email,
          userName: userProfile?.display_name || userProfile?.username || "Usuario",
          planName: planNames[planType] || planType,
          amount: paidPrice,
          expiresAt: expiresAt.toLocaleDateString("es-AR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        })

        logger.info("Plan purchase email sent", "MP_WEBHOOK", {
          paymentId: payment.id,
          userId: metadata.user_id,
          email: user.email,
        })
      }
    } catch (emailError) {
      logger.error("Failed to send plan purchase email", "MP_WEBHOOK", emailError)
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

    const { data: packs, error: packsError } = await supabase
      .from("packs")
      .select("id, created_at")
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .eq("archived", false)
      .order("created_at", { ascending: false })

    if (packsError || !packs) {
      logger.error("Failed to fetch user packs for downgrade", "MP_WEBHOOK", { userId, error: packsError })
      return
    }

    let packsToKeep = packs.length

    if (newPlan === "free" && newPlanFeatures.maxTotalPacks !== null) {
      packsToKeep = newPlanFeatures.maxTotalPacks
    } else if (newPlan === "de_0_a_hit" && newPlanFeatures.maxPacksPerMonth !== null) {
      packsToKeep = newPlanFeatures.maxPacksPerMonth
    }

    if (packs.length > packsToKeep) {
      const packsToArchive = packs.slice(packsToKeep)
      const packIdsToArchive = packsToArchive.map((p) => p.id)

      logger.info("Archiving excess packs due to downgrade", "MP_WEBHOOK", {
        userId,
        totalPacks: packs.length,
        packsToKeep,
        packsToArchive: packIdsToArchive.length,
      })

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
