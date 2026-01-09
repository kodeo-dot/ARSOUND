export interface MercadoPagoConfig {
  accessToken: string
  publicKey: string
  appId: string
  clientSecret: string
  testMode: boolean
}

export function getMercadoPagoConfig(): MercadoPagoConfig {
  const testMode = process.env.MERCADO_PAGO_TEST_MODE === "true"

  const accessToken = testMode ? process.env.MERCADO_PAGO_TEST_ACCESS_TOKEN : process.env.MERCADO_PAGO_ACCESS_TOKEN

  const publicKey = testMode ? process.env.MERCADO_PAGO_TEST_PUBLIC_KEY : process.env.MERCADO_PAGO_PUBLIC_KEY

  const appId = process.env.MERCADO_PAGO_APP_ID
  const clientSecret = process.env.MERCADO_PAGO_CLIENT_SECRET

  console.log("[v0] MP Config - Test mode:", testMode)
  console.log("[v0] MP Config - Has access token:", !!accessToken)
  console.log("[v0] MP Config - Has public key:", !!publicKey)
  console.log("[v0] MP Config - Has app ID:", !!appId)
  console.log("[v0] MP Config - Has client secret:", !!clientSecret)

  if (!accessToken || !publicKey) {
    throw new Error("Mercado Pago credentials not configured")
  }

  if (!appId || !clientSecret) {
    throw new Error("Mercado Pago OAuth credentials (APP_ID or CLIENT_SECRET) not configured")
  }

  return {
    accessToken: accessToken!,
    publicKey: publicKey!,
    appId: appId!,
    clientSecret: clientSecret!,
    testMode,
  }
}

export function getOAuthUrl(userId: string, redirectUri: string): string {
  const config = getMercadoPagoConfig()

  const url = new URL("https://auth.mercadopago.com.ar/authorization")
  url.searchParams.set("client_id", config.appId)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("platform_id", "mp")
  url.searchParams.set("redirect_uri", redirectUri)
  url.searchParams.set("state", userId)

  console.log("[v0] OAuth URL generated:", url.toString())

  return url.toString()
}
