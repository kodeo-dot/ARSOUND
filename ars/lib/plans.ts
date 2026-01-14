export type PlanType = "free" | "de_0_a_hit" | "studio_plus"

export interface PlanBadge {
  icon: string
  label: string
  color: string
}

export interface PlanFeatures {
  maxPacksPerMonth: number | null // null = unlimited
  maxTotalPacks: number | null // null = unlimited
  maxPrice: number | null // null = no limit
  maxFileSize: number // in MB
  commission: number // percentage (0.15 = 15%, 0.10 = 10%, 0.03 = 3%)
  canUseDiscountCodes: boolean
  canAccessFullStats: boolean
  featuredPriority: number
  canEditAfterDays: number | null // null = always can edit
  canPinPack: boolean
  canAddExternalLinks: boolean
  maxFreeDownloads: number | null // null = unlimited
  maxDiscountPercent: number // max discount percentage allowed
}

export const PLAN_FEATURES: Record<PlanType, PlanFeatures> = {
  free: {
    maxPacksPerMonth: null,
    maxTotalPacks: 3,
    maxPrice: 15000, // ARS
    maxFileSize: 80, // MB
    commission: 0.15, // Updated from 0.10 to 0.15 (15%)
    canUseDiscountCodes: false,
    canAccessFullStats: false,
    featuredPriority: 0,
    canEditAfterDays: 15,
    canPinPack: false,
    canAddExternalLinks: false,
    maxFreeDownloads: 10, // Free users can download 10 free packs per month
    maxDiscountPercent: 10,
  },
  de_0_a_hit: {
    maxPacksPerMonth: 10,
    maxTotalPacks: null,
    maxPrice: 65000, // ARS
    maxFileSize: 250, // MB
    commission: 0.1, // Updated from 0.05 to 0.10 (10%)
    canUseDiscountCodes: true,
    canAccessFullStats: true,
    featuredPriority: 1,
    canEditAfterDays: null,
    canPinPack: false,
    canAddExternalLinks: false,
    maxFreeDownloads: null, // Unlimited downloads for paid plans
    maxDiscountPercent: 50,
  },
  studio_plus: {
    maxPacksPerMonth: null,
    maxTotalPacks: null,
    maxPrice: null, // no limit
    maxFileSize: 500, // MB
    commission: 0.03, // Updated from 0 to 0.03 (3%)
    canUseDiscountCodes: true,
    canAccessFullStats: true,
    featuredPriority: 2,
    canEditAfterDays: null,
    canPinPack: true,
    canAddExternalLinks: true,
    maxFreeDownloads: null, // Unlimited downloads for paid plans
    maxDiscountPercent: 100,
  },
}

export const PLAN_BADGES: Record<PlanType, PlanBadge | null> = {
  free: null,
  de_0_a_hit: {
    icon: "⚡",
    label: "De 0 a Hit",
    color: "text-orange-500",
  },
  studio_plus: {
    icon: "👑",
    label: "Studio Plus",
    color: "text-purple-500",
  },
}

export function getPlanBadge(planType: PlanType): PlanBadge | null {
  return PLAN_BADGES[planType]
}

export function hasPlanBadge(planType: PlanType): boolean {
  return PLAN_BADGES[planType] !== null
}

export function getMaxDiscountPercent(planType: PlanType): number {
  return PLAN_FEATURES[planType].maxDiscountPercent
}

export function getMaxFileSizeInBytes(planType: PlanType): number {
  return PLAN_FEATURES[planType].maxFileSize * 1024 * 1024 // Convert MB to bytes
}

export function getMaxFileSizeMB(planType: PlanType): number {
  return PLAN_FEATURES[planType].maxFileSize
}

export function canUploadPack(
  currentPlan: PlanType,
  totalPacks: number,
  packsThisMonth: number,
): { canUpload: boolean; reason?: string } {
  const features = PLAN_FEATURES[currentPlan]

  if (features.maxTotalPacks !== null && totalPacks >= features.maxTotalPacks) {
    return {
      canUpload: false,
      reason: `Has alcanzado el límite de ${features.maxTotalPacks} packs totales del plan ${currentPlan.toUpperCase()}`,
    }
  }

  if (features.maxPacksPerMonth !== null && packsThisMonth >= features.maxPacksPerMonth) {
    return {
      canUpload: false,
      reason: `Has alcanzado el límite de ${features.maxPacksPerMonth} packs por mes del plan ${currentPlan.toUpperCase()}`,
    }
  }

  return { canUpload: true }
}

export function canEditPack(currentPlan: PlanType, packCreatedAt: Date): { canEdit: boolean; reason?: string } {
  const features = PLAN_FEATURES[currentPlan]

  if (features.canEditAfterDays === null) {
    return { canEdit: true }
  }

  const daysSinceCreation = Math.floor((Date.now() - packCreatedAt.getTime()) / (1000 * 60 * 60 * 24))

  if (daysSinceCreation > features.canEditAfterDays) {
    return {
      canEdit: false,
      reason: `El plan ${currentPlan.toUpperCase()} solo permite editar packs durante los primeros ${features.canEditAfterDays} días`,
    }
  }

  return { canEdit: true }
}

export function getPlanCommission(planType: PlanType): number {
  return PLAN_FEATURES[planType].commission
}

export function getPlanMaxPrice(planType: PlanType): number | null {
  return PLAN_FEATURES[planType].maxPrice
}

export function getMaxFreeDownloads(planType: PlanType): number | null {
  return PLAN_FEATURES[planType].maxFreeDownloads
}
