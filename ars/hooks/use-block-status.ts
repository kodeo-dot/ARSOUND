"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface BlockStatus {
  isBlocked: boolean
  attemptCount: number
  isNearBlock: boolean
  blockReason: string | null
  loading: boolean
}

export function useBlockStatus() {
  const [status, setStatus] = useState<BlockStatus>({
    isBlocked: false,
    attemptCount: 0,
    isNearBlock: false,
    blockReason: null,
    loading: true,
  })
  const router = useRouter()
  const supabase = createBrowserClient()

  useEffect(() => {
    checkBlockStatus()
  }, [])

  async function checkBlockStatus() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setStatus({
          isBlocked: false,
          attemptCount: 0,
          isNearBlock: false,
          blockReason: null,
          loading: false,
        })
        return
      }

      // Check if user is blocked
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("is_blocked, blocked_reason")
        .eq("id", user.id)
        .single()

      if (profileError) {
        console.error("[v0] Error checking profile:", profileError)
        setStatus((prev) => ({ ...prev, loading: false }))
        return
      }

      if (profile?.is_blocked) {
        setStatus({
          isBlocked: true,
          attemptCount: 0,
          isNearBlock: false,
          blockReason: profile.blocked_reason,
          loading: false,
        })
        // Redirect will be handled by middleware
        return
      }

      // Check reupload attempts
      const { data: attempts, error: attemptsError } = await supabase
        .from("reupload_attempts")
        .select("attempt_count")
        .eq("user_id", user.id)
        .is("blocked_at", null)

      if (attemptsError) {
        console.error("[v0] Error checking attempts:", attemptsError)
        setStatus((prev) => ({ ...prev, loading: false }))
        return
      }

      const totalAttempts = attempts?.reduce((sum, record) => sum + (record.attempt_count || 0), 0) || 0

      setStatus({
        isBlocked: false,
        attemptCount: totalAttempts,
        isNearBlock: totalAttempts >= 1, // Warning threshold: 1 or more attempts
        blockReason: null,
        loading: false,
      })
    } catch (error) {
      console.error("[v0] Error in useBlockStatus:", error)
      setStatus((prev) => ({ ...prev, loading: false }))
    }
  }

  return { ...status, refresh: checkBlockStatus }
}
