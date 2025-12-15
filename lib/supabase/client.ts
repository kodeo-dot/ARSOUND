import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

function clearAllSupabaseStorage() {
  if (typeof window === "undefined") return

  try {
    const keysToRemove: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key && (key.includes("supabase") || key.includes("sb-") || key.includes("auth-token"))) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((key) => {
      window.localStorage.removeItem(key)
    })
    console.log("[ARSOUND] Cleared Supabase storage:", keysToRemove.length, "items")
  } catch (e) {
    console.error("[ARSOUND] Error clearing storage:", e)
  }
}

if (typeof window !== "undefined") {
  try {
    // Check all Supabase keys for corruption
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key && key.includes("supabase.auth.token")) {
        const value = window.localStorage.getItem(key)
        if (value) {
          try {
            const parsed = JSON.parse(value)
            // Check if the token structure is valid
            if (parsed && typeof parsed === "object") {
              // Check for access_token
              if (parsed.access_token && typeof parsed.access_token === "string") {
                // Try to decode JWT to check for 'sub' claim
                const parts = parsed.access_token.split(".")
                if (parts.length === 3) {
                  const payload = JSON.parse(atob(parts[1]))
                  if (!payload.sub) {
                    console.error("[ARSOUND] JWT missing 'sub' claim, clearing all tokens")
                    clearAllSupabaseStorage()
                    break
                  }
                }
              }
            }
          } catch (e) {
            console.error("[ARSOUND] Invalid token format, clearing all tokens")
            clearAllSupabaseStorage()
            break
          }
        }
      }
    }
  } catch (e) {
    console.error("[ARSOUND] Error checking tokens:", e)
    clearAllSupabaseStorage()
  }
}

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
      storage: {
        getItem: (key) => {
          if (typeof window === "undefined") return null
          try {
            return window.localStorage.getItem(key)
          } catch (e) {
            console.error("[ARSOUND] Error reading from localStorage:", e)
            return null
          }
        },
        setItem: (key, value) => {
          if (typeof window === "undefined") return
          try {
            window.localStorage.setItem(key, value)
          } catch (e) {
            console.error("[ARSOUND] Error writing to localStorage:", e)
          }
        },
        removeItem: (key) => {
          if (typeof window === "undefined") return
          try {
            window.localStorage.removeItem(key)
          } catch (e) {
            console.error("[ARSOUND] Error removing from localStorage:", e)
          }
        },
      },
    },
    global: {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "x-application-name": "arsound",
      },
    },
    realtime: {
      params: {
        eventsPerSecond: 1,
      },
    },
  })

  return client
}

export async function clearInvalidSession() {
  clearAllSupabaseStorage()

  // Reset the client
  client = undefined

  console.log("[ARSOUND] Session cleared and client reset")
}

export { createClient as createBrowserClient }
