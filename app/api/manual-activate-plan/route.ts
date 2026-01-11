import { createAdminClient } from "@/lib/supabase/server-client"
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
 *   "externalReference": "plan_f8e59ed9-4e02-40d0-87c4-6c022d996dc6_de_0_a_hit"
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { paymentId, userId, externalReference, planType: directPlanType } = body

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    let planType = directPlanType

    if (!planType && externalReference) {
      planType = parsePlanTypeFromReference(externalReference)
      logger.info("Parsed plan type from external reference", "MANUAL_ACTIVATE", {
        externalReference,
        parsedPlanType: planType,
      })
    }

    if (!planType) {
      return NextResponse.json({ error: "Missing or invalid planType/externalReference" }, { status: 400 })
    }

    planType = planType.replace("_monthly", "").replace(/-/g, "_")

    // Validate plan type
    const validPlans = ["free", "de_0_a_hit", "studio_plus"]
    if (!validPlans.includes(planType)) {
      logger.error("Invalid plan type after normalization", "MANUAL_ACTIVATE", {
        originalPlanType: body.planType || externalReference,
        normalizedPlanType: planType,
      })
      return NextResponse.json({ error: "Invalid plan type", received: planType, valid: validPlans }, { status: 400 })
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

function parsePlanTypeFromReference(externalRef: string): string | null {
  try {
    // Format: plan_<userId/uuid>_<planType>
    // Example: plan_f8e59ed9-4e02-40d0-87c4-6c022d996dc6_de_0_a_hit
    if (!externalRef.startsWith("plan_")) {
      return null
    }

    const parts = externalRef.split("_")

    // Check if part contains UUID pattern
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    let planTypeStartIndex = 2

    // If second part starts with a UUID, it might span multiple underscore-separated parts
    for (let i = 2; i <= 5 && i < parts.length; i++) {
      const combined = parts.slice(1, i + 1).join("-")
      if (uuidRegex.test(combined)) {
        planTypeStartIndex = i + 1
        break
      }
    }

    // Reconstruct plan type from remaining parts
    const planType = parts.slice(planTypeStartIndex).join("_")

    return planType || null
  } catch (error) {
    logger.error("Error parsing plan type from external reference", "MANUAL_ACTIVATE", { externalRef, error })
    return null
  }
}
