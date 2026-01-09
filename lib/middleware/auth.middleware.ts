import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { logger } from "../utils/logger"

function clearAuthCookies(response: NextResponse, request: NextRequest) {
  response.cookies.delete("sb-access-token")
  response.cookies.delete("sb-refresh-token")

  request.cookies.getAll().forEach((cookie) => {
    if (cookie.name.includes("sb-") || cookie.name.includes("supabase")) {
      response.cookies.delete(cookie.name)
    }
  })
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // Set cache control headers
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
        supabaseResponse = NextResponse.next({ request })
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
  })

  let hasValidSession = false

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      logger.error("Session error in middleware", "MIDDLEWARE", sessionError.message)
      clearAuthCookies(supabaseResponse, request)
      hasValidSession = false
    } else if (session) {
      const isExpired = session.expires_at && session.expires_at * 1000 <= Date.now()

      if (isExpired) {
        logger.debug("Session expired, refreshing", "MIDDLEWARE")
      }

      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

      if (refreshError) {
        logger.error("Refresh failed in middleware", "MIDDLEWARE", refreshError.message)
        clearAuthCookies(supabaseResponse, request)
        hasValidSession = false
      } else if (refreshData.session) {
        logger.debug("Session refreshed in middleware", "MIDDLEWARE")
        hasValidSession = true
      }
    }
  } catch (error) {
    logger.error("Error refreshing session", "MIDDLEWARE", error)
    clearAuthCookies(supabaseResponse, request)
    hasValidSession = false
  }

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const hasValidUser = user && user.id && user.aud === "authenticated"

  // Check if user is blocked
  if (hasValidUser) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_blocked, blocked_reason, blocked_at")
      .eq("id", user.id)
      .single()

    if (profile?.is_blocked) {
      const isBlockedPage = request.nextUrl.pathname === "/blocked"
      const isAppealAPI = request.nextUrl.pathname === "/api/appeal"
      const isAuthAPI = request.nextUrl.pathname.startsWith("/api/auth")

      if (!isBlockedPage && !isAppealAPI && !isAuthAPI) {
        logger.info("Redirecting blocked user", "MIDDLEWARE", { userId: user.id })
        const url = request.nextUrl.clone()
        url.pathname = "/blocked"
        return NextResponse.redirect(url)
      }
    }
  }

  // Protect authenticated routes
  const protectedPaths = ["/profile", "/upload", "/studio"]
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  if (!hasValidUser && isProtectedPath) {
    logger.debug("Redirecting unauthenticated user to login", "MIDDLEWARE")
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  const authPaths = ["/login", "/signup"]
  const isAuthPath = authPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  if (hasValidUser && hasValidSession && isAuthPath) {
    logger.debug("Redirecting authenticated user away from auth page", "MIDDLEWARE")
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  // Allow access to auth pages if user has invalid session
  if (hasValidUser && !hasValidSession && isAuthPath) {
    logger.debug("Allowing access to auth page for invalid session", "MIDDLEWARE")
    clearAuthCookies(supabaseResponse, request)
  }

  return supabaseResponse
}
