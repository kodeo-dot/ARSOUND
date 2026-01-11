import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

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
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options ?? {}))
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase.from("profiles").select("is_blocked").eq("id", user.id).single()

    if (profile?.is_blocked) {
      const pathname = request.nextUrl.pathname

      // Define strictly allowed paths for blocked users
      const allowedPaths = ["/blocked", "/api/appeal", "/api/auth"]

      const isAllowedPath = allowedPaths.some((path) => pathname.startsWith(path))

      // Block all other paths - redirect to /blocked
      if (!isAllowedPath) {
        const url = request.nextUrl.clone()
        url.pathname = "/blocked"
        return NextResponse.redirect(url)
      }
    }
  }

  const protectedPaths = ["/profile", "/upload", "/studio", "/settings", "/purchases", "/saved", "/statistics"]
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  if (!user && isProtectedPath) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("redirect", request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  const authPaths = ["/login", "/signup"]
  const isAuthPath = authPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  if (user && isAuthPath) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
