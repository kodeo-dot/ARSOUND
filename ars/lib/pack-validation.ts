import { createBrowserClient } from "@/lib/supabase/client"
import { PLAN_FEATURES, type PlanType } from "./plans"

export async function getUserPackStats(userId: string) {
  const supabase = createBrowserClient()

  try {
    const { data: totalPacks, error: totalError } = await supabase.rpc("count_total_packs", {
      p_user_id: userId,
    })

    const { data: packsThisMonth, error: monthError } = await supabase.rpc("count_packs_this_month", {
      p_user_id: userId,
    })

    if (totalError || monthError) {
      console.error("[v0] Error fetching pack stats:", totalError || monthError)
      return { totalPacks: 0, packsThisMonth: 0 }
    }

    return { 
      totalPacks: totalPacks || 0, 
      packsThisMonth: packsThisMonth || 0 
    }
  } catch (error) {
    console.error("Error fetching pack stats:", error)
    return { totalPacks: 0, packsThisMonth: 0 }
  }
}

export async function validatePackUpload(
  userId: string,
  userPlan: PlanType,
  packPrice: number,
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = []

  // Get pack stats
  const { totalPacks, packsThisMonth } = await getUserPackStats(userId)

  // Get plan features
  const features = PLAN_FEATURES[userPlan]

  if (userPlan === "free" && features.maxTotalPacks !== null && totalPacks >= features.maxTotalPacks) {
    errors.push(
      `Alcanzaste el límite de ${features.maxTotalPacks} packs totales del plan FREE. Mejorá tu plan para subir más.`,
    )
  }

  if (userPlan === "de_0_a_hit" && features.maxPacksPerMonth !== null && packsThisMonth >= features.maxPacksPerMonth) {
    errors.push(
      `Alcanzaste el límite de ${features.maxPacksPerMonth} packs por mes del plan De 0 a Hit. Esperá al próximo mes o mejorá tu plan.`,
    )
  }

  // Check price limit
  if (features.maxPrice !== null && packPrice > features.maxPrice) {
    errors.push(
      `El precio máximo permitido en tu plan es $${features.maxPrice.toLocaleString()} ARS. Reducí el precio o mejorá tu plan.`,
    )
  }

  return { valid: errors.length === 0, errors }
}

export async function canUserUploadPack(userId: string, userPlan: PlanType): Promise<{ canUpload: boolean; reason?: string }> {
  const { totalPacks, packsThisMonth } = await getUserPackStats(userId)
  const features = PLAN_FEATURES[userPlan]

  // FREE: Check total packs limit
  if (userPlan === "free" && features.maxTotalPacks !== null && totalPacks >= features.maxTotalPacks) {
    return {
      canUpload: false,
      reason: `Alcanzaste tu límite de ${features.maxTotalPacks} packs totales. Mejorá tu plan para subir más.`,
    }
  }

  // DE_0_A_HIT: Check monthly limit
  if (userPlan === "de_0_a_hit" && features.maxPacksPerMonth !== null && packsThisMonth >= features.maxPacksPerMonth) {
    return {
      canUpload: false,
      reason: `Alcanzaste tu límite de ${features.maxPacksPerMonth} packs este mes. Esperá al próximo mes o mejorá tu plan.`,
    }
  }

  return { canUpload: true }
}
