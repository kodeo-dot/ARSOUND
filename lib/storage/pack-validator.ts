import type { PlanType } from "../types/database.types"
import { getPlanFeatures, validatePlanLimits } from "../config/plans.config"
import { countUserPacks } from "../database/queries"
import { ValidationError } from "../utils/errors"

export interface PackValidation {
  title: string
  description: string
  genre: string
  subgenre: string
  price: number
  file_url: string
  bpm?: number
  tags?: string[]
  cover_image_url?: string
  demo_audio_url?: string
  has_discount?: boolean
  discount_percent?: number
}

export async function validatePackUpload(userId: string, planType: PlanType, data: PackValidation) {
  // Required fields
  const missingFields: string[] = []
  if (!data.title?.trim()) missingFields.push("title")
  if (!data.description?.trim()) missingFields.push("description")
  if (!data.genre) missingFields.push("genre")
  if (!data.subgenre) missingFields.push("subgenre")
  if (data.price === undefined) missingFields.push("price")
  if (!data.file_url) missingFields.push("file_url")

  if (missingFields.length > 0) {
    throw new ValidationError(`Missing required fields: ${missingFields.join(", ")}`, { missingFields })
  }

  // Validate file URL format
  if (!data.file_url.startsWith("https://")) {
    throw new ValidationError("file_url must be a valid HTTPS URL from Supabase Storage")
  }

  // Check plan limits
  const { total, thisMonth } = await countUserPacks(userId)
  const limitsCheck = validatePlanLimits(planType, total, thisMonth)

  if (!limitsCheck.valid) {
    throw new ValidationError(limitsCheck.error || "Upload limit reached")
  }

  // Validate price limits
  const features = getPlanFeatures(planType)
  if (features.maxPrice && data.price > features.maxPrice) {
    throw new ValidationError(`El precio máximo para tu plan es $${features.maxPrice.toLocaleString()} ARS`, {
      maxPrice: features.maxPrice,
      currentPrice: data.price,
    })
  }

  // Validate discount
  if (data.has_discount && data.discount_percent) {
    if (!features.canUseDiscountCodes) {
      throw new ValidationError("Tu plan no permite códigos de descuento")
    }

    if (data.discount_percent > features.maxDiscountPercent) {
      throw new ValidationError(`Tu plan permite máximo ${features.maxDiscountPercent}% de descuento`, {
        maxDiscount: features.maxDiscountPercent,
        currentDiscount: data.discount_percent,
      })
    }
  }
}
