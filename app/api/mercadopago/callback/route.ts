import { createServerClient } from "@/lib/supabase/server-client"
import { NextResponse } from "next/server"
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state") // user_id
    const error = searchParams.get("error")

    console.log("[v0] OAuth callback received:", { code: !!code, state, error })

    if (error) {
      console.error("[v0] OAuth error:", error)
      return redirect("/profile?mp_error=denied")
    }

    if (!code || !state) {
      console.error("[v0] Missing code or state parameters")
      return redirect("/profile?mp_error=invalid")
    }

    const supabase = await createServerClient()

    // Exchange code for access token
    const appId = process.env.MERCADO_PAGO_APP_ID
    const clientSecret = process.env.MERCADO_PAGO_CLIENT_SECRET
    
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL
    const headers = request.headers
    const forwardedProto = headers.get('x-forwarded-proto') || 'https'
    const forwardedHost = headers.get('x-forwarded-host') || headers.get('host')
    
    if (forwardedHost && !forwardedHost.includes('localhost')) {
      baseUrl = `${forwardedProto}://${forwardedHost}`
    }
    
    const redirectUri = `${baseUrl}/api/mercadopago/callback`

    if (!appId || !clientSecret) {
      console.error("[v0] Mercado Pago credentials not configured")
      return redirect("/profile?mp_error=config")
    }

    const tokenResponse = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "ARSOUND/1.0"
      },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }).toString(),
    })

    console.log("[v0] Token exchange response status:", tokenResponse.status)

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error("[v0] Token exchange error:", errorData)
      return redirect("/profile?mp_error=token")
    }

    const tokenData = await tokenResponse.json()
    const { access_token, user_id } = tokenData

    if (!access_token) {
      console.error("[v0] No access token in response:", tokenData)
      return redirect("/profile?mp_error=token")
    }

    console.log("[v0] Access token obtained, user_id:", user_id)

    // Save to Supabase
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        mp_access_token: access_token,
        mp_user_id: user_id,
        mp_connected: true,
      })
      .eq("id", state)

    if (updateError) {
      console.error("[v0] Error saving MP credentials:", updateError)
      return redirect("/profile?mp_error=save")
    }

    console.log("[v0] MP credentials saved successfully for user:", state)
    return redirect("/profile?mp_success=true")
  } catch (error: any) {
    console.error("[v0] OAuth callback error:", error)
    return redirect("/profile?mp_error=unknown")
  }
}
