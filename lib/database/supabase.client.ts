import { createServerClient as createSupabaseClient } from "@supabase/ssr"
import { cookies } from "next/headers"

interface SupabaseConfig {
  url: string
  anonKey: string
  serviceRoleKey?: string
}

function getConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !anonKey) {
    throw new Error("Missing Supabase configuration. Check environment variables.")
  }

  return { url, anonKey, serviceRoleKey }
}

export async function createServerClient() {
  const config = getConfig()
  const cookieStore = await cookies()

  return createSupabaseClient(config.url, config.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Ignore errors in Server Components
        }
      },
    },
  })
}

export async function createAdminClient() {
  const config = getConfig()

  if (!config.serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY")
  }

  return createSupabaseClient(config.url, config.serviceRoleKey, {
    cookies: {
      getAll: () => [],
      setAll: () => {},
    },
  })
}

export async function getCurrentUser() {
  const supabase = await createServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

export async function requireAuth() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  return user
}
