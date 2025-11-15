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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://arsound.vercel.app'
    const redirectUri = `${baseUrl}/api/mercadopago/callback`
    
    console.log("[v0] MP Connect: App ID configured:", !!appId)
    console.log("[v0] MP Connect: Base URL:", baseUrl)
    console.log("[v0] MP Connect: Redirect URI:", redirectUri)
    
    if (!appId) {
      console.error("[v0] MP Connect: MERCADO_PAGO_APP_ID not configured")
      return NextResponse.json(
        { 
          error: "Mercado Pago no está configurado. Por favor, contactá al administrador.",
          details: "MERCADO_PAGO_APP_ID missing"
        },
        { status: 500 }
      )
    }

    const oauthUrl = `https://auth.mercadopago.com.ar/authorization?client_id=${appId}&response_type=code&platform_id=mp&redirect_uri=${encodeURIComponent(redirectUri)}&state=${user.id}`
    
    console.log("[v0] MP Connect: OAuth URL generated successfully")

    return NextResponse.json({ oauthUrl })
  } catch (error: any) {
    console.error("[v0] MP Connect: Error generating OAuth URL:", error)
    return NextResponse.json(
      { error: "Failed to generate OAuth URL", details: error.message },
      { status: 500 }
    )
  }
}
