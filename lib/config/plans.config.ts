import type { PlanType } from "../types/database.types"

export interface PlanFeatures {
  maxPacksPerMonth: number | null
  maxTotalPacks: number | null
  maxPrice: number | null
  maxFileSize: number
  commission: number
  canUseDiscountCodes: boolean
  canAccessFullStats: boolean
  featuredPriority: number
  canEditAfterDays: number | null
  canPinPack: boolean
  canAddExternalLinks: boolean
  maxFreeDownloads: number | null
  maxDiscountPercent: number
}

export const PLAN_CONFIG: Record<PlanType, PlanFeatures> = {
  free: {
    maxPacksPerMonth: null,
    maxTotalPacks: 3,
    maxPrice: 15000,
    maxFileSize: 80,
    commission: 0.15,
    canUseDiscountCodes: false,
    canAccessFullStats: false,
    featuredPriority: 0,
    canEditAfterDays: 15,
    canPinPack: false,
    canAddExternalLinks: false,
    maxFreeDownloads: 10,
    maxDiscountPercent: 10,
  },
  de_0_a_hit: {
    maxPacksPerMonth: 10,
    maxTotalPacks: null,
    maxPrice: 65000,
    maxFileSize: 250,
    commission: 0.1,
    canUseDiscountCodes: true,
    canAccessFullStats: true,
    featuredPriority: 1,
    canEditAfterDays: null,
    canPinPack: false,
    canAddExternalLinks: false,
    maxFreeDownloads: null,
    maxDiscountPercent: 50,
  },
  studio_plus: {
    maxPacksPerMonth: null,
    maxTotalPacks: null,
    maxPrice: null,
    maxFileSize: 500,
    commission: 0.03,
    canUseDiscountCodes: true,
    canAccessFullStats: true,
    featuredPriority: 2,
    canEditAfterDays: null,
    canPinPack: true,
    canAddExternalLinks: true,
    maxFreeDownloads: null,
    maxDiscountPercent: 100,
  },
}

export const PLAN_PRICES: Record<string, number> = {
  de_0_a_hit: 5000,
  de_0_a_hit_monthly: 5000,
  studio_plus: 15000,
  studio_plus_monthly: 15000,
}

export function getPlanFeatures(planType: PlanType): PlanFeatures {
  return PLAN_CONFIG[planType]
}

export function calculateCommission(amount: number, planType: PlanType): number {
  const features = getPlanFeatures(planType)
  return Math.floor(amount * features.commission)
}

export function validatePlanLimits(
  planType: PlanType,
  totalPacks: number,
  packsThisMonth: number,
): { valid: boolean; error?: string } {
  const features = getPlanFeatures(planType)

  if (features.maxTotalPacks && totalPacks >= features.maxTotalPacks) {
    return {
      valid: false,
      error: `Has alcanzado el límite de ${features.maxTotalPacks} packs totales`,
    }
  }

  if (features.maxPacksPerMonth && packsThisMonth >= features.maxPacksPerMonth) {
    return {
      valid: false,
      error: `Has alcanzado el límite de ${features.maxPacksPerMonth} packs por mes`,
    }
  }

  return { valid: true }
}
