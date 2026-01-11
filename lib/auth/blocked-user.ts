import { getProfile } from "../database/queries"
import { logger } from "../utils/logger"
import type { Profile } from "../types/database.types"
import { createServerClient } from "@/lib/supabase/server"

export interface BlockedUserCheck {
  isBlocked: boolean
  reason?: string
  profile?: Profile
}

export async function checkIfBlocked(userId: string): Promise<BlockedUserCheck> {
  const profile = await getProfile(userId)

  if (!profile) {
    logger.error("Profile not found for blocked check", "AUTH", { userId })
    return { isBlocked: false }
  }

  if (profile.is_blocked) {
    logger.info("Blocked user detected from profiles", "AUTH", { userId, reason: profile.blocked_reason })
    return {
      isBlocked: true,
      reason: profile.blocked_reason || "Account blocked",
      profile,
    }
  }

  // Check if user has an active block in admin_actions
  try {
    const supabase = await createServerClient()
    const { data: blockAction, error } = await supabase
      .from("admin_actions")
      .select("*")
      .eq("target_id", userId)
      .eq("target_type", "user")
      .eq("action_type", "block_user")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "no rows returned", which is fine
      console.error("[v0] Error checking admin_actions:", error)
    }

    if (blockAction) {
      // Check if there's a corresponding unblock action after this block
      const { data: unblockAction } = await supabase
        .from("admin_actions")
        .select("*")
        .eq("target_id", userId)
        .eq("target_type", "user")
        .eq("action_type", "unblock_user")
        .gt("created_at", blockAction.created_at)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      // If there's no unblock after the latest block, user is still blocked
      if (!unblockAction) {
        logger.info("Blocked user detected from admin_actions", "AUTH", {
          userId,
          reason: blockAction.details?.reason || "Blocked by admin",
        })
        return {
          isBlocked: true,
          reason: blockAction.details?.reason || "Account blocked by administrator",
          profile,
        }
      }
    }
  } catch (error) {
    console.error("[v0] Error checking admin blocks:", error)
  }

  return { isBlocked: false, profile }
}

export function isAllowedPathForBlockedUser(pathname: string): boolean {
  // Only allow these paths for blocked users:
  // - /blocked: The blocked user page
  // - /api/appeal: API endpoint to submit appeals
  // - /api/auth: Authentication endpoints (specifically for logout)
  const allowedPaths = ["/blocked", "/api/appeal", "/api/auth"]

  return allowedPaths.some((path) => pathname.startsWith(path))
}
