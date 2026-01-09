import { requireSession } from "@/lib/auth/session"
import { validatePackPlay } from "@/lib/purchases/validator"
import { trackPackPlay } from "@/lib/purchases/tracking"
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/utils/response"

export async function POST(request: Request) {
  try {
    const user = await requireSession()
    const body = await request.json()
    const { packId } = body

    if (!packId) {
      return validationErrorResponse("packId is required", ["packId"])
    }

    // Validate pack exists
    const isValid = await validatePackPlay(packId)

    if (!isValid) {
      return errorResponse("Pack not found", 404)
    }

    // Track play
    const ipAddress = request.headers.get("x-forwarded-for")
    const counted = await trackPackPlay(packId, user.id, ipAddress)

    return successResponse({
      success: true,
      counted,
      alreadyCounted: !counted,
    })
  } catch (error) {
    return errorResponse("Error recording play", 500)
  }
}
