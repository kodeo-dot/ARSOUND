"use server"

import { createServerClient } from "@/lib/supabase/server"
import type { PlanType } from "./plans"

/**
 * Server action to update a user's subscription plan
 *
 * @param userId - The user's UUID
 * @param planType - The plan type: 'free', 'de_0_a_hit', or 'studio_plus'
 * @param expiresAt - Optional expiration date for the plan (null = no expiration)
 *
 * Usage example:
 * await updateUserPlan(userId, 'de_0_a_hit', new Date('2025-12-31'))
 *
 * NOTE: For future payment integration with Stripe/MercadoPago:
 * 1. Call this function after successful payment webhook
 * 2. Set expiresAt to the subscription end date
 * 3. For free plan, set expiresAt to null
 */
export async function updateUserPlan(
  userId: string,
  planType: PlanType,
  expiresAt?: Date | null,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerClient()

    // Deactivate all existing plans for this user
    const { error: deactivateError } = await supabase
      .from("user_plans")
      .update({ is_active: false })
      .eq("user_id", userId)

    if (deactivateError) {
      console.error("[v0] Error deactivating plans:", deactivateError)
      return { success: false, error: deactivateError.message }
    }

    // Insert new plan
    const { error: insertError } = await supabase.from("user_plans").insert({
      user_id: userId,
      plan_type: planType,
      is_active: true,
      started_at: new Date().toISOString(),
      expires_at: expiresAt ? expiresAt.toISOString() : null,
    })

    if (insertError) {
      console.error("[v0] Error inserting new plan:", insertError)
      return { success: false, error: insertError.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error updating user plan:", error)
    return { success: false, error: error.message || "Unknown error" }
  }
}

/**
 * Server action to get a user's current active plan
 *
 * @param userId - The user's UUID
 * @returns The user's current plan type
 */
export async function getUserPlan(userId: string): Promise<{ plan: PlanType; error?: string }> {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase.rpc("get_user_plan", { p_user_id: userId })

    if (error) {
      console.error("[v0] Error fetching user plan:", error)
      return { plan: "free", error: error.message }
    }

    return { plan: (data?.plan_type as PlanType) || "free" }
  } catch (error: any) {
    console.error("[v0] Error getting user plan:", error)
    return { plan: "free", error: error.message || "Unknown error" }
  }
}

/**
 * Server action to manually test plan changes (for development/testing)
 *
 * Usage in browser console or test script:
 * \`\`\`
 * import { testChangePlan } from '@/lib/plans-actions'
 * await testChangePlan('de_0_a_hit') // Changes current user's plan
 * \`\`\`
 */
export async function testChangePlan(planType: PlanType): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "No authenticated user" }
    }

    return await updateUserPlan(user.id, planType, null)
  } catch (error: any) {
    return { success: false, error: error.message || "Unknown error" }
  }
}
