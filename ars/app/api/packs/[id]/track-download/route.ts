import { requireSession } from "@/lib/auth/session"
import { trackPackDownload } from "@/lib/purchases/tracking"
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/utils/response"

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSession()
    const { id: packId } = await context.params

    if (!packId) {
      return validationErrorResponse("packId is required", ["packId"])
    }

    const success = await trackPackDownload(packId, user.id)

    if (!success) {
      return errorResponse("Failed to track download", 500)
    }

    return successResponse({
      success: true,
      message: "Download tracked",
    })
  } catch (error) {
    return errorResponse("Internal server error", 500)
  }
}
