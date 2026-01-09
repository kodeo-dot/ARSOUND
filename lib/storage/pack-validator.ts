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
  if (!data.title?.trim()) missingFields.push("título")
  if (!data.description?.trim()) missingFields.push("descripción")
  if (!data.genre) missingFields.push("género")
  if (!data.subgenre) missingFields.push("subgénero")
  if (data.price === undefined || data.price === null) missingFields.push("precio")
  if (!data.file_url) missingFields.push("archivo")

  if (missingFields.length > 0) {
    throw new ValidationError(`Faltan campos requeridos: ${missingFields.join(", ")}`)
  }

  // Validate file URL format
  if (!data.file_url || typeof data.file_url !== "string" || !data.file_url.startsWith("http")) {
    throw new ValidationError("El archivo debe ser una URL válida de Supabase Storage")
  }

  // Check plan limits
  let total = 0
  let thisMonth = 0

  try {
    const counts = await countUserPacks(userId)
    total = counts.total
    thisMonth = counts.thisMonth
    console.log("[v0] Pack counts - Total:", total, "This month:", thisMonth)
  } catch (countError) {
    console.error("[v0] Error counting packs:", countError)
    // Continue without throwing - allow upload if we can't count
  }

  const limitsCheck = validatePlanLimits(planType, total, thisMonth)

  if (!limitsCheck.valid) {
    throw new ValidationError(limitsCheck.error || "Límite de uploads alcanzado")
  }

  // Validate price limits
  const features = getPlanFeatures(planType)
  if (features.maxPrice && data.price > features.maxPrice) {
    throw new ValidationError(`El precio máximo para tu plan es $${features.maxPrice.toLocaleString()} ARS`)
  }

  // Validate discount
  if (data.has_discount && data.discount_percent) {
    if (!features.canUseDiscountCodes) {
      throw new ValidationError("Tu plan no permite códigos de descuento")
    }

    if (data.discount_percent > features.maxDiscountPercent) {
      throw new ValidationError(`Tu plan permite máximo ${features.maxDiscountPercent}% de descuento`)
    }
  }
}
