import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

let client: SupabaseClient | undefined

export function createClient() {
  if (client) {
    return client
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    )
  }

  client = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  })

  return client
}

export async function clearInvalidSession() {
  if (typeof window === "undefined") return

  try {
    // Clear all Supabase-related localStorage items
    const keysToRemove: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key && (key.includes("supabase") || key.includes("sb-"))) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((key) => {
      window.localStorage.removeItem(key)
    })

    // Reset client to force reinitialization
    client = undefined

    console.log("[ARSOUND] Session cleared successfully")
  } catch (e) {
    console.error("[ARSOUND] Error clearing session:", e)
  }
}

export { createClient as createBrowserClient }
