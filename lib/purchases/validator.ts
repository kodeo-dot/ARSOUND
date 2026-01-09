import { getPackById, checkPackPurchase, getUserPlan } from "../database/queries"
import { getPlanFeatures } from "../config/plans.config"
import { NotFoundError } from "../utils/errors"
import { logger } from "../utils/logger"

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

  // Free packs need download limit check
  if (isFree) {
    const planType = await getUserPlan(userId)
    const features = getPlanFeatures(planType)

    if (features.maxFreeDownloads !== null) {
      // TODO: Check download count for this month
      // For now, we allow the download
      logger.debug("Free pack download", "DOWNLOAD", { userId, packId, plan: planType })
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
