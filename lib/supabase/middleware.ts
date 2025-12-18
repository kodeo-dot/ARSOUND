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
    }

    if (session) {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

      if (refreshError) {
        console.error("[ARSOUND] Error refreshing session:", refreshError.message)
        // Clear cookies if refresh fails
        supabaseResponse.cookies.delete("sb-access-token")
        supabaseResponse.cookies.delete("sb-refresh-token")
      } else if (refreshData.session) {
        console.log("[ARSOUND] Session refreshed successfully in middleware")
      }
    }
  } catch (error) {
    console.error("[ARSOUND] Error in session refresh:", error)
    // Clear all cookies on unexpected error
    supabaseResponse.cookies.delete("sb-access-token")
    supabaseResponse.cookies.delete("sb-refresh-token")
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Now we can safely use the user data for routing logic
  if (user) {
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
  if (!user && (request.nextUrl.pathname.startsWith("/profile") || request.nextUrl.pathname.startsWith("/upload"))) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (user && (request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/signup"))) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
