import { createServerClient } from "@/lib/supabase/server-client"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    console.log("[v0] MP Connect: Starting connection flow...")
    
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log("[v0] MP Connect: User not authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] MP Connect: User authenticated:", user.id)

    const appId = process.env.MERCADO_PAGO_APP_ID
    const appSecret = process.env.MERCADO_PAGO_CLIENT_SECRET
    
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL
    
    // Fallback logic for development
    if (!baseUrl || baseUrl === 'https://arsound.com.ar') {
      // Check if we're running on Vercel Preview
      const headers = request.headers
      const forwardedProto = headers.get('x-forwarded-proto') || 'https'
      const forwardedHost = headers.get('x-forwarded-host') || headers.get('host') || 'https://arsound.com.ar'
      
      if (forwardedHost && !forwardedHost.includes('localhost')) {
        baseUrl = `${forwardedProto}://${forwardedHost}`
        console.log("[v0] MP Connect: Using forwarded URL:", baseUrl)
      } else {
        baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://arsound.com.ar'
      }
    }
    
    const redirectUri = `${baseUrl}/api/mercadopago/callback`
    
    console.log("[v0] MP Connect: App ID configured:", !!appId)
    console.log("[v0] MP Connect: App Secret configured:", !!appSecret)
    console.log("[v0] MP Connect: Base URL:", baseUrl)
    console.log("[v0] MP Connect: Redirect URI:", redirectUri)
    
    if (!appId || !appSecret) {
      console.error("[v0] MP Connect: Mercado Pago credentials not configured")
      return NextResponse.json(
        { 
          error: "Mercado Pago no está configurado. Por favor, contactá al administrador.",
          details: "MERCADO_PAGO_APP_ID or CLIENT_SECRET missing"
        },
        { status: 500 }
      )
    }

    const oauthUrl = new URL('https://auth.mercadopago.com.ar/authorization')
    oauthUrl.searchParams.set('client_id', appId)
    oauthUrl.searchParams.set('response_type', 'code')
    oauthUrl.searchParams.set('platform_id', 'mp')
    oauthUrl.searchParams.set('redirect_uri', redirectUri)
    oauthUrl.searchParams.set('state', user.id)
    
    console.log("[v0] MP Connect: OAuth URL generated successfully")

    return NextResponse.json({ oauthUrl: oauthUrl.toString() })
  } catch (error: any) {
    console.error("[v0] MP Connect: Error generating OAuth URL:", error)
    return NextResponse.json(
      { error: "Failed to generate OAuth URL", details: error.message },
      { status: 500 }
    )
  }
}
