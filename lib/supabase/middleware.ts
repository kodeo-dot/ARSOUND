import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

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
