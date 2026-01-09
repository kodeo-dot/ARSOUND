import { requireSession } from "@/lib/auth/session"
import { getOAuthUrl } from "@/lib/payments/mercadopago/config"
import { successResponse, errorResponse } from "@/lib/utils/response"
import { logger } from "@/lib/utils/logger"

export async function POST(request: Request) {
  try {
    console.log("[v0] MP Connect - Starting connection process")

    const user = await requireSession()
    console.log("[v0] MP Connect - User authenticated:", user.id)

    const headers = request.headers
    const forwardedProto = headers.get("x-forwarded-proto") || "https"
    const forwardedHost = headers.get("x-forwarded-host") || headers.get("host")

    let baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://arsound.com.ar"

    if (forwardedHost && !forwardedHost.includes("localhost")) {
      baseUrl = `${forwardedProto}://${forwardedHost}`
    }

    const redirectUri = `${baseUrl}/api/mercadopago/callback`

    console.log("[v0] MP Connect - Redirect URI:", redirectUri)

    logger.info("Generating MP OAuth URL", "MP_CONNECT", { userId: user.id, redirectUri })

    let oauthUrl: string
    try {
      oauthUrl = getOAuthUrl(user.id, redirectUri)
      console.log("[v0] MP Connect - OAuth URL generated successfully:", oauthUrl)
    } catch (configError: any) {
      console.error("[v0] MP Connect - Config error:", configError.message)
      return errorResponse(configError.message || "Missing Mercado Pago OAuth configuration", 500)
    }

    if (!oauthUrl) {
      console.error("[v0] MP Connect - OAuth URL is empty")
      return errorResponse("Failed to generate OAuth URL", 500)
    }

    return successResponse({ oauthUrl })
  } catch (error: any) {
    console.error("[v0] MP Connect - Error:", error)
    logger.error("Error generating OAuth URL", "MP_CONNECT", error)
    return errorResponse(error.message || "Failed to generate OAuth URL", 500)
  }
}
