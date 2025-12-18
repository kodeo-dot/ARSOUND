"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User, Session } from "@supabase/supabase-js"
import { clearInvalidSession } from "@/lib/supabase/client"

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const initializeAuth = async () => {
      try {
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("[ARSOUND] Error getting initial session:", error.message)

          if (
            error.message?.includes("invalid claim") ||
            error.message?.includes("bad_jwt") ||
            error.message?.includes("missing sub claim") ||
            error.message?.includes("Invalid token")
          ) {
            await clearInvalidSession()
            setUser(null)
            setSession(null)
          }
        } else {
          setSession(initialSession)
          setUser(initialSession?.user ?? null)
        }
      } catch (error: any) {
        console.error("[ARSOUND] Unexpected error initializing auth:", error)
        await clearInvalidSession()
        setUser(null)
        setSession(null)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("[ARSOUND] Auth state changed:", event)

      if (event === "SIGNED_OUT") {
        // User logged out - clear everything
        setUser(null)
        setSession(null)
        await clearInvalidSession()
      } else if (event === "TOKEN_REFRESHED") {
        // Token was refreshed - update session
        console.log("[ARSOUND] Token refreshed successfully")
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
      } else if (event === "SIGNED_IN") {
        // User logged in - set session
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
      } else if (event === "USER_UPDATED") {
        // User data updated
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
      }

      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return <AuthContext.Provider value={{ user, session, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
