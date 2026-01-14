import { exchangeCodeForToken, saveMercadoPagoCredentials } from "@/lib/payments/mercadopago/oauth"
import { logger } from "@/lib/utils/logger"
import { redirect } from "next/navigation"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state") // user_id
    const error = searchParams.get("error")

    if (error) {
      logger.error("OAuth error", "MP_CALLBACK", error)
      return redirect("/profile?mp_error=denied")
    }

    if (!code || !state) {
      logger.error("Missing code or state", "MP_CALLBACK")
      return redirect("/profile?mp_error=invalid")
    }

    const headers = request.headers
    const forwardedProto = headers.get("x-forwarded-proto") || "https"
    const forwardedHost = headers.get("x-forwarded-host") || headers.get("host")

    let baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://arsound.com.ar"

    if (forwardedHost && !forwardedHost.includes("localhost")) {
      baseUrl = `${forwardedProto}://${forwardedHost}`
    }

    const redirectUri = `${baseUrl}/api/mercadopago/callback`

    // Exchange code for token
    const { access_token, user_id } = await exchangeCodeForToken(code, redirectUri)

    // Save credentials
    const success = await saveMercadoPagoCredentials(state, access_token, user_id)

    if (!success) {
      return redirect("/profile?mp_error=save")
    }

    logger.info("MP credentials saved successfully", "MP_CALLBACK", { userId: state })
    return redirect("/profile?mp_success=true")
  } catch (error) {
    logger.error("OAuth callback error", "MP_CALLBACK", error)
    return redirect("/profile?mp_error=unknown")
  }
}
