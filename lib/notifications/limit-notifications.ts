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

    console.log("[v0] createLimitNotification called", { userId, limitType, planType })

    let shouldNotify = false
    let limitMessage = ""

    if (limitType === "download" && features.maxFreeDownloads !== null) {
      // Check current downloads this month
      const { data: limitData } = await supabase.rpc("get_download_limit", {
        p_user_id: userId,
      })

      console.log("[v0] Download limit check", { limitData })

      if (limitData && limitData.remaining === 0) {
        shouldNotify = true
        limitMessage = `Alcanzaste el límite de ${limitData.limit} descargas mensuales`
      }
    } else if (limitType === "upload") {
      // Check current uploads
      const { data: limitData } = await supabase.rpc("get_remaining_uploads", {
        p_user_id: userId,
      })

      console.log("[v0] Upload limit check", { limitData })

      if (limitData && limitData.remaining === 0) {
        shouldNotify = true
        if (planType === "free") {
          limitMessage = `Alcanzaste el límite de ${limitData.limit} packs totales`
        } else {
          limitMessage = `Alcanzaste el límite de ${limitData.limit} packs este mes`
        }
      }
    }

    console.log("[v0] Should notify?", { shouldNotify, limitMessage })

    if (shouldNotify) {
      // Create web notification
      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: userId,
        type: "limit_reached",
        title: `Límite alcanzado`,
        message: limitMessage,
        metadata: {
          limit_type: limitType,
          plan: planType,
        },
      })

      if (notifError) {
        console.error("[v0] Error creating notification", notifError)
        logger.error("Error creating notification in DB", "NOTIFICATION", notifError)
      } else {
        console.log("[v0] Notification created successfully")
      }

      // Send email notification
      console.log("[v0] Sending limit email...")
      await sendLimitReachedEmail(userId, limitType, limitMessage, planType)
      console.log("[v0] Email sent")

      logger.info("Limit notification created", "NOTIFICATION", {
        userId,
        limitType,
        plan: planType,
      })
    }
  } catch (error) {
    console.error("[v0] Error in createLimitNotification", error)
    logger.error("Error creating limit notification", "NOTIFICATION", error)
  }
}
