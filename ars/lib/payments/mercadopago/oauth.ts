import { getMercadoPagoConfig } from "./config"
import { updateProfile } from "../../database/queries"
import { logger } from "../../utils/logger"
import { PaymentError } from "../../utils/errors"

export async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
): Promise<{
  access_token: string
  user_id: string
}> {
  const config = getMercadoPagoConfig()

  const response = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "ARSOUND/1.0",
    },
    body: new URLSearchParams({
      client_id: config.appId,
      client_secret: config.clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }).toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    logger.error("Token exchange failed", "MP_OAUTH", error)
    throw new PaymentError("Failed to exchange code for token")
  }

  const data = await response.json()

  if (!data.access_token || !data.user_id) {
    logger.error("Invalid token response", "MP_OAUTH", data)
    throw new PaymentError("Invalid token response from Mercado Pago")
  }

  return data
}

export async function saveMercadoPagoCredentials(
  userId: string,
  accessToken: string,
  mpUserId: string,
): Promise<boolean> {
  const success = await updateProfile(userId, {
    mp_access_token: accessToken,
    mp_user_id: mpUserId,
    mp_connected: true,
  })

  if (success) {
    logger.info("Mercado Pago credentials saved", "MP_OAUTH", { userId })
  } else {
    logger.error("Failed to save MP credentials", "MP_OAUTH", { userId })
  }

  return success
}
