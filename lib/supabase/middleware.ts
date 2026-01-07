import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  supabaseResponse.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private")
  supabaseResponse.headers.set("Pragma", "no-cache")
  supabaseResponse.headers.set("Expires", "0")

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, {
            ...options,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
          }),
        )
      },
    },
    global: {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "x-application-name": "arsound",
      },
    },
  })

  let hasValidSession = false

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("[ARSOUND] Session error in middleware:", sessionError.message)
      supabaseResponse.cookies.delete("sb-access-token")
      supabaseResponse.cookies.delete("sb-refresh-token")

      // Clear all Supabase cookies
      request.cookies.getAll().forEach((cookie) => {
        if (cookie.name.includes("sb-") || cookie.name.includes("supabase")) {
          supabaseResponse.cookies.delete(cookie.name)
        }
      })
      hasValidSession = false
    }

    if (session) {
      const isExpired = session.expires_at && session.expires_at * 1000 <= Date.now()

      if (isExpired) {
        console.log("[ARSOUND] Session expired, attempting refresh")
      }

      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

      if (refreshError) {
        console.error("[ARSOUND] Error refreshing session:", refreshError.message)
        // Clear cookies if refresh fails
        supabaseResponse.cookies.delete("sb-access-token")
        supabaseResponse.cookies.delete("sb-refresh-token")
        hasValidSession = false
      } else if (refreshData.session) {
        console.log("[ARSOUND] Session refreshed successfully in middleware")
        hasValidSession = true
      }
    }
  } catch (error) {
    console.error("[ARSOUND] Error in session refresh:", error)
    // Clear all cookies on unexpected error
    supabaseResponse.cookies.delete("sb-access-token")
    supabaseResponse.cookies.delete("sb-refresh-token")
    hasValidSession = false
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const hasValidUser = user && user.id && user.aud === "authenticated"

  // Now we can safely use the user data for routing logic
  if (hasValidUser) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_blocked, blocked_reason, blocked_at")
      .eq("id", user.id)
      .single()

    // If user is blocked, only allow access to /blocked, /api/appeal, and logout
    if (profile?.is_blocked) {
      const isBlockedPage = request.nextUrl.pathname === "/blocked"
      const isAppealAPI = request.nextUrl.pathname === "/api/appeal"
      const isLogoutAPI = request.nextUrl.pathname.startsWith("/api/auth")

      if (!isBlockedPage && !isAppealAPI && !isLogoutAPI) {
        const url = request.nextUrl.clone()
        url.pathname = "/blocked"
        return NextResponse.redirect(url)
      }
    }
  }

  // Protect routes that require authentication
  if (
    !hasValidUser &&
    (request.nextUrl.pathname.startsWith("/profile") || request.nextUrl.pathname.startsWith("/upload"))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  if (
    hasValidUser &&
    hasValidSession &&
    (request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/signup"))
  ) {
    console.log("[ARSOUND] Valid authenticated user accessing auth page, redirecting to home")
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  if (
    hasValidUser &&
    !hasValidSession &&
    (request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/signup"))
  ) {
    console.log("[ARSOUND] User with invalid session accessing auth page, allowing access")
    // Clear cookies and allow access to login
    supabaseResponse.cookies.delete("sb-access-token")
    supabaseResponse.cookies.delete("sb-refresh-token")
    request.cookies.getAll().forEach((cookie) => {
      if (cookie.name.includes("sb-") || cookie.name.includes("supabase")) {
        supabaseResponse.cookies.delete(cookie.name)
      }
    })
  }

  return supabaseResponse
}
