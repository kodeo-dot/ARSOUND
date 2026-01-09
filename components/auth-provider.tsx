"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { createClient, clearInvalidSession } from "@/lib/supabase/client"
import type { User, Session } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    await clearInvalidSession()
    setUser(null)
    setSession(null)
  }

  useEffect(() => {
    const supabase = createClient()

    const initializeAuth = async () => {
      try {
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("[ARSOUND] Error getting session:", error.message)
          await clearInvalidSession()
          setUser(null)
          setSession(null)
        } else if (initialSession) {
          setSession(initialSession)
          setUser(initialSession.user)
        } else {
          setUser(null)
          setSession(null)
        }
      } catch (error) {
        console.error("[ARSOUND] Unexpected error:", error)
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
        setUser(null)
        setSession(null)
        await clearInvalidSession()
      } else if (currentSession) {
        setSession(currentSession)
        setUser(currentSession.user)
      } else {
        setUser(null)
        setSession(null)
      }

      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return <AuthContext.Provider value={{ user, session, loading, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
