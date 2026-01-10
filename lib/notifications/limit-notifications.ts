import { createServerClient } from "../database/supabase.client"
import { getUserPlan } from "../database/queries"
import { getPlanFeatures } from "../config/plans.config"
import { sendLimitReachedEmail } from "../email/notifications"
import { logger } from "../utils/logger"

export async function createLimitNotification(userId: string, limitType: "download" | "upload"): Promise<void> {
  try {
    const supabase = await createServerClient()
    const planType = await getUserPlan(userId)
    const features = getPlanFeatures(planType)

    let shouldNotify = false
    let limitMessage = ""

    if (limitType === "download" && features.maxFreeDownloads !== null) {
      // Check current downloads this month
      const { data: limitData } = await supabase.rpc("get_download_limit", {
        p_user_id: userId,
      })

      if (limitData && limitData.remaining === 0) {
        shouldNotify = true
        limitMessage = `Alcanzaste el límite de ${limitData.limit} descargas mensuales`
      }
    } else if (limitType === "upload") {
      // Check current uploads
      const { data: limitData } = await supabase.rpc("get_remaining_uploads", {
        p_user_id: userId,
      })

      if (limitData && limitData.remaining === 0) {
        shouldNotify = true
        if (planType === "free") {
          limitMessage = `Alcanzaste el límite de ${limitData.limit} packs totales`
        } else {
          limitMessage = `Alcanzaste el límite de ${limitData.limit} packs este mes`
        }
      }
    }

    if (shouldNotify) {
      // Create web notification
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "limit_reached",
        title: `Límite alcanzado`,
        message: limitMessage,
        metadata: {
          limit_type: limitType,
          plan: planType,
        },
      })

      // Send email notification
      await sendLimitReachedEmail(userId, limitType, limitMessage, planType)

      logger.info("Limit notification created", "NOTIFICATION", {
        userId,
        limitType,
        plan: planType,
      })
    }
  } catch (error) {
    logger.error("Error creating limit notification", "NOTIFICATION", error)
  }
}
