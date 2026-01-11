import { getProfile } from "../database/queries"
import { logger } from "../utils/logger"
import type { Profile } from "../types/database.types"

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
    logger.info("Blocked user detected", "AUTH", { userId, reason: profile.blocked_reason })
    return {
      isBlocked: true,
      reason: profile.blocked_reason || "Account blocked",
      profile,
    }
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
