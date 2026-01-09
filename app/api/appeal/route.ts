import { requireSession } from "@/lib/auth/session"
import { getProfile } from "@/lib/database/queries"
import { createServerClient } from "@/lib/database/supabase.client"
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/utils/response"
import { logger } from "@/lib/utils/logger"

export async function POST(request: Request) {
  try {
    const user = await requireSession()

    const body = await request.json()
    const { message } = body

    if (!message?.trim()) {
      return validationErrorResponse("Message is required", ["message"])
    }

    const profile = await getProfile(user.id)

    if (!profile) {
      return errorResponse("Profile not found", 404)
    }

    if (!profile.is_blocked) {
      return errorResponse("User is not blocked", 400)
    }

    const supabase = await createServerClient()

    const { data: appeal, error } = await supabase
      .from("appeals")
      .insert({
        user_id: user.id,
        message: message.trim(),
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      logger.error("Error creating appeal", "API", error)
      return errorResponse("Could not create appeal", 500)
    }

    logger.info("Appeal submitted", "API", {
      appealId: appeal.id,
      userId: user.id,
      username: profile.username,
    })

    return successResponse({
      appeal_id: appeal.id,
      message: "Appeal submitted successfully",
    })
  } catch (error) {
    logger.error("Appeal submission error", "API", error)
    return errorResponse("Internal server error", 500)
  }
}
