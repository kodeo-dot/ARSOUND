import { getPackById, checkPackPurchase, getUserPlan } from "../database/queries"
import { getPlanFeatures } from "../config/plans.config"
import { NotFoundError } from "../utils/errors"
import { logger } from "../utils/logger"
import { createServerClient } from "../database/supabase.client"

export async function validatePackDownload(
  userId: string,
  packId: string,
): Promise<{
  canDownload: boolean
  pack: any
  reason?: string
}> {
  const pack = await getPackById(packId)

  if (!pack) {
    throw new NotFoundError("Pack")
  }

  const isFree = !pack.price || pack.price === 0

  if (isFree) {
    const planType = await getUserPlan(userId)
    const features = getPlanFeatures(planType)

    logger.debug("Checking download limit", "DOWNLOAD", {
      userId,
      packId,
      planType,
      maxFreeDownloads: features.maxFreeDownloads,
    })

    // Check download limit using RPC function
    if (features.maxFreeDownloads !== null) {
      const supabase = await createServerClient()

      const { data: limitCheck, error } = await supabase.rpc("can_download_free_pack", {
        p_user_id: userId,
        p_pack_id: packId,
      })

      if (error) {
        logger.error("Error checking download limit", "DOWNLOAD", {
          error,
          userId,
          packId,
          planType,
        })
        return {
          canDownload: false,
          pack,
          reason: "Error al verificar límites de descarga",
        }
      }

      logger.debug("RPC response", "DOWNLOAD", {
        limitCheck,
        canDownload: limitCheck?.can_download,
      })

      if (!limitCheck?.can_download) {
        logger.warn("Download limit exceeded", "DOWNLOAD", {
          userId,
          packId,
          plan: planType,
          current: limitCheck?.current_downloads,
          limit: limitCheck?.limit,
          reason: limitCheck?.reason,
        })

        try {
          const now = new Date()
          const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

          await supabase.rpc("create_notification", {
            p_user_id: userId,
            p_type: "limit_reached",
            p_actor_id: userId,
            p_pack_id: null,
            p_metadata: {
              max_downloads: features.maxFreeDownloads,
              current_downloads: limitCheck?.current_downloads || 0,
              reset_date: nextMonth.toISOString(),
            },
          })

          logger.debug("Limit notification created", "DOWNLOAD", { userId })
        } catch (notifError) {
          logger.error("Error creating limit notification", "DOWNLOAD", { notifError, userId })
        }

        return {
          canDownload: false,
          pack,
          reason: limitCheck?.message || "Alcanzaste el límite de descargas para este mes",
        }
      }

      logger.debug("Free pack download allowed", "DOWNLOAD", {
        userId,
        packId,
        plan: planType,
        current: limitCheck?.current_downloads,
        limit: limitCheck?.limit,
      })
    }

    return { canDownload: true, pack }
  }

  // Paid packs need purchase verification
  const hasPurchased = await checkPackPurchase(userId, packId)

  if (!hasPurchased) {
    logger.warn("Download attempted without purchase", "DOWNLOAD", { userId, packId })
    return {
      canDownload: false,
      pack,
      reason: "Necesitás comprar este pack para descargarlo",
    }
  }

  return { canDownload: true, pack }
}

export async function validatePackPlay(packId: string): Promise<boolean> {
  const pack = await getPackById(packId)
  return !!pack
}
