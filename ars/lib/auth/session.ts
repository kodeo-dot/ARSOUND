import { createServerClient } from "../database/supabase.client"
import type { User } from "@supabase/supabase-js"
import { logger } from "../utils/logger"

export interface SessionResult {
  user: User | null
  hasValidSession: boolean
  error?: string
}

export async function getSession(): Promise<SessionResult> {
  try {
    const supabase = await createServerClient()

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      logger.error("Session fetch error", "AUTH", sessionError.message)
      return { user: null, hasValidSession: false, error: sessionError.message }
    }

    if (!session) {
      return { user: null, hasValidSession: false }
    }

    // Check if session is expired
    const isExpired = session.expires_at && session.expires_at * 1000 <= Date.now()

    if (isExpired) {
      logger.debug("Session expired, attempting refresh", "AUTH")

      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

      if (refreshError || !refreshData.session) {
        logger.error("Session refresh failed", "AUTH", refreshError?.message)
        return { user: null, hasValidSession: false, error: "Session expired" }
      }

      logger.debug("Session refreshed successfully", "AUTH")
      return { user: refreshData.user, hasValidSession: true }
    }

    // Verify user data
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      logger.error("User verification failed", "AUTH", userError?.message)
      return { user: null, hasValidSession: false }
    }

    return { user, hasValidSession: true }
  } catch (error) {
    logger.error("Unexpected error in getSession", "AUTH", error)
    return { user: null, hasValidSession: false, error: "Unexpected error" }
  }
}

export async function requireSession(): Promise<User> {
  const { user, hasValidSession } = await getSession()

  if (!hasValidSession || !user) {
    throw new Error("Unauthorized - Valid session required")
  }

  return user
}

export async function clearSession(): Promise<void> {
  try {
    const supabase = await createServerClient()
    await supabase.auth.signOut()
    logger.info("Session cleared", "AUTH")
  } catch (error) {
    logger.error("Error clearing session", "AUTH", error)
  }
}
