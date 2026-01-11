import { createAdminClient } from "@/lib/supabase/supabase.client"
import { NextResponse } from "next/server"
import { logger } from "@/lib/utils/logger"

/**
 * Manual endpoint to activate a plan for a user
 * USE THIS IF THE WEBHOOK FAILS
 *
 * POST /api/manual-activate-plan
 * {
 *   "paymentId": "141582995244",
 *   "userId": "user-uuid",
 *   "planType": "de_0_a_hit"
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { paymentId, userId, planType } = body

    if (!userId || !planType) {
      return NextResponse.json({ error: "Missing userId or planType" }, { status: 400 })
    }

    // Validate plan type
    const validPlans = ["free", "de_0_a_hit", "studio_plus"]
    if (!validPlans.includes(planType)) {
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Deactivate existing plans
    await supabase.from("user_plans").update({ is_active: false }).eq("user_id", userId)

    // Calculate expiration (30 days for paid plans)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Insert new plan
    const { error } = await supabase.from("user_plans").insert({
      user_id: userId,
      plan_type: planType,
      is_active: true,
      started_at: new Date().toISOString(),
      expires_at: planType === "free" ? null : expiresAt.toISOString(),
    })

    if (error) {
      logger.error("Failed to activate plan manually", "MANUAL_ACTIVATE", { userId, planType, error })
      return NextResponse.json({ error: "Failed to activate plan", details: error }, { status: 500 })
    }

    logger.info("Plan activated manually", "MANUAL_ACTIVATE", {
      paymentId,
      userId,
      planType,
      expiresAt: expiresAt.toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: "Plan activated successfully",
      planType,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error) {
    logger.error("Error in manual plan activation", "MANUAL_ACTIVATE", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
