import { requireSession } from "@/lib/auth/session"
import { getOAuthUrl } from "@/lib/payments/mercadopago/config"
import { successResponse, errorResponse } from "@/lib/utils/response"
import { logger } from "@/lib/utils/logger"

export async function POST(request: Request) {
  try {
    const user = await requireSession()

    const headers = request.headers
    const forwardedProto = headers.get("x-forwarded-proto") || "https"
    const forwardedHost = headers.get("x-forwarded-host") || headers.get("host")

    let baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://arsound.com.ar"

    if (forwardedHost && !forwardedHost.includes("localhost")) {
      baseUrl = `${forwardedProto}://${forwardedHost}`
    }

    const redirectUri = `${baseUrl}/api/mercadopago/callback`

    logger.info("Generating MP OAuth URL", "MP_CONNECT", { userId: user.id, redirectUri })

    const oauthUrl = getOAuthUrl(user.id, redirectUri)

    return successResponse({ oauthUrl })
  } catch (error) {
    logger.error("Error generating OAuth URL", "MP_CONNECT", error)
    return errorResponse("Failed to generate OAuth URL", 500)
  }
}
