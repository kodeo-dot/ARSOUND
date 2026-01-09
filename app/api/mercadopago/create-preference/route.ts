import { requireSession } from "@/lib/auth/session"
import { createPackPreference, createPlanPreference } from "@/lib/payments/mercadopago/preference"
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/utils/response"
import { handleApiError } from "@/lib/utils/errors"
import type { CreatePreferenceRequest } from "@/lib/types/api.types"

export async function POST(request: Request) {
  try {
    const user = await requireSession()
    const body: CreatePreferenceRequest = await request.json()

    if (!body.packId && !body.planType) {
      return validationErrorResponse("Se requiere packId o planType", ["packId", "planType"])
    }

    let result: { init_point: string; preference_id: string }

    if (body.packId) {
      result = await createPackPreference(body.packId, user.id, user.email!, body.discountCode)
    } else if (body.planType) {
      result = await createPlanPreference(body.planType, user.id, user.email!)
    } else {
      return errorResponse("Invalid request", 400)
    }

    return successResponse(result)
  } catch (error) {
    const errorDetails = handleApiError(error)
    return errorResponse(errorDetails.message, errorDetails.statusCode, errorDetails.details)
  }
}
