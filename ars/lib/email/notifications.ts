import { sendEmail } from "./brevo.client"
import {
  getPackPurchaseEmailBuyer,
  getPackPurchaseEmailSeller,
  getPlanPurchaseEmail,
  getLimitReachedEmail,
} from "./templates"
import { logger } from "../utils/logger"
import { getProfile } from "../database/queries"
import type { PlanType } from "../types/database.types"

export async function sendPackPurchaseNotifications(data: {
  buyerEmail: string
  buyerName: string
  sellerEmail: string
  sellerName: string
  packTitle: string
  amount: number
  earnings: number
  commission: number
  purchaseCode: string
  downloadUrl: string
}): Promise<void> {
  try {
    // Send to buyer
    await sendEmail({
      to: [data.buyerEmail],
      subject: `Compraste ${data.packTitle} en ARSOUND`,
      htmlContent: getPackPurchaseEmailBuyer({
        buyerName: data.buyerName,
        packTitle: data.packTitle,
        amount: data.amount,
        purchaseCode: data.purchaseCode,
        downloadUrl: data.downloadUrl,
      }),
    })

    // Send to seller
    await sendEmail({
      to: [data.sellerEmail],
      subject: `Vendiste ${data.packTitle} en ARSOUND`,
      htmlContent: getPackPurchaseEmailSeller({
        sellerName: data.sellerName,
        buyerName: data.buyerName,
        packTitle: data.packTitle,
        earnings: data.earnings,
        commission: data.commission,
      }),
    })

    logger.info("Purchase notifications sent", "EMAIL", { packTitle: data.packTitle })
  } catch (error) {
    logger.error("Error sending purchase notifications", "EMAIL", error)
  }
}

export async function sendPlanPurchaseNotification(data: {
  userEmail: string
  userName: string
  planName: string
  amount: number
  expiresAt: string
}): Promise<void> {
  try {
    await sendEmail({
      to: [data.userEmail],
      subject: `Bienvenido al plan ${data.planName} - ARSOUND`,
      htmlContent: getPlanPurchaseEmail(data),
    })

    logger.info("Plan purchase notification sent", "EMAIL", { planName: data.planName })
  } catch (error) {
    logger.error("Error sending plan notification", "EMAIL", error)
  }
}

export async function sendLimitReachedEmail(
  userId: string,
  limitType: "download" | "upload",
  limitMessage: string,
  planType: PlanType,
): Promise<void> {
  try {
    const profile = await getProfile(userId)

    if (!profile?.email) {
      logger.warn("No email found for limit notification", "EMAIL", { userId })
      return
    }

    const planNames: Record<PlanType, string> = {
      free: "Free",
      de_0_a_hit: "De 0 a Hit",
      studio_plus: "Studio Plus",
    }

    await sendEmail({
      to: [profile.email],
      subject: `Límite alcanzado - ARSOUND`,
      htmlContent: getLimitReachedEmail({
        userName: profile.display_name || profile.username,
        limitType,
        limitMessage,
        planName: planNames[planType],
        upgradeUrl: "https://arsound.com.ar/plans",
      }),
    })

    logger.info("Limit notification email sent", "EMAIL", { userId, limitType, plan: planType })
  } catch (error) {
    logger.error("Error sending limit notification email", "EMAIL", error)
  }
}
