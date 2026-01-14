import { requireSession } from "@/lib/auth/session"
import { getUserPlan } from "@/lib/database/queries"
import { getStudioAnalytics } from "@/lib/analytics/studio-analytics"
import { successResponse, errorResponse } from "@/lib/utils/response"
import { logger } from "@/lib/utils/logger"

export async function GET() {
  try {
    const user = await requireSession()

    // Check if user has Studio Plus plan
    const planType = await getUserPlan(user.id)

    if (planType !== "studio_plus") {
      return errorResponse("Studio Plus plan required", 403)
    }

    // Get analytics
    const analytics = await getStudioAnalytics(user.id)

    return successResponse(analytics)
  } catch (error) {
    logger.error("Error fetching studio analytics", "API", error)
    return errorResponse("Internal server error", 500)
  }
}
