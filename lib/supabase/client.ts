import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

let client: SupabaseClient | undefined

export function createClient() {
  if (!client) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("[v0] Missing Supabase environment variables:", {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
      })
      throw new Error(
        "Supabase configuration is missing. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.",
      )
    }

    console.log("[v0] Initializing Supabase client with URL:", supabaseUrl)

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
              console.error("[v0] Error reading from localStorage:", e)
              return null
            }
          },
          setItem: (key, value) => {
            if (typeof window === "undefined") return
            try {
              window.localStorage.setItem(key, value)
            } catch (e) {
              console.error("[v0] Error writing to localStorage:", e)
            }
          },
          removeItem: (key) => {
            if (typeof window === "undefined") return
            try {
              window.localStorage.removeItem(key)
            } catch (e) {
              console.error("[v0] Error removing from localStorage:", e)
            }
          },
        },
      },
      global: {
        headers: {
          "x-application-name": "arsound",
        },
      },
      realtime: {
        params: {
          eventsPerSecond: 2,
        },
      },
    })
  }
  return client
}

export { createClient as createBrowserClient }
