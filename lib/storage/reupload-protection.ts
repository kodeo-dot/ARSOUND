import { createServerClient } from "../database/supabase.client"
import { updateProfile } from "../database/queries"
import { logger } from "../utils/logger"

export interface ReuploadCheckResult {
  isAllowed: boolean
  isBlocked: boolean
  attemptCount: number
  message?: string
  errorCode?: "DUPLICATE_FILE" | "DUPLICATE_FILE_WARNING" | "ACCOUNT_BLOCKED" | "SYSTEM_ERROR"
}

export async function checkReuploadProtection(
  userId: string,
  fileHash: string,
  existingPackUserId?: string,
): Promise<ReuploadCheckResult> {
  const supabase = await createServerClient()

  // Check if user is already blocked
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_blocked, blocked_reason")
    .eq("id", userId)
    .single()

  if (profile?.is_blocked) {
    return {
      isAllowed: false,
      isBlocked: true,
      attemptCount: 0,
      errorCode: "ACCOUNT_BLOCKED",
      message: `Tu cuenta ha sido bloqueada. Razón: ${profile.blocked_reason || "Intentos de reupload"}`,
    }
  }

  // Only check if it's a different user uploading
  if (!existingPackUserId || existingPackUserId === userId) {
    return {
      isAllowed: true,
      isBlocked: false,
      attemptCount: 0,
    }
  }

  // Check reupload attempts
  const { data: existingAttempt } = await supabase
    .from("reupload_attempts")
    .select("attempt_count, blocked_at")
    .eq("user_id", userId)
    .eq("file_hash", fileHash)
    .single()

  if (!existingAttempt) {
    // First attempt - record it
    await supabase.from("reupload_attempts").insert({
      user_id: userId,
      file_hash: fileHash,
      attempt_count: 1,
    })

    logger.warn("First reupload attempt detected", "REUPLOAD", { userId, fileHash: fileHash.substring(0, 16) })

    return {
      isAllowed: false,
      isBlocked: false,
      attemptCount: 1,
      errorCode: "DUPLICATE_FILE_WARNING",
      message: "Este pack ya existe en la plataforma. Si lo intentas de nuevo, tu cuenta será bloqueada.",
    }
  }

  if (existingAttempt.blocked_at) {
    return {
      isAllowed: false,
      isBlocked: true,
      attemptCount: existingAttempt.attempt_count,
      errorCode: "ACCOUNT_BLOCKED",
      message: "Tu cuenta ha sido bloqueada por intentar resubir un pack duplicado.",
    }
  }

  // Second or more attempt - block the account
  logger.error("Multiple reupload attempts - blocking account", "REUPLOAD", {
    userId,
    attemptCount: existingAttempt.attempt_count + 1,
  })

  await updateProfile(userId, {
    is_blocked: true,
    blocked_reason: `Intentos de reupload de pack duplicado (${existingAttempt.attempt_count + 1} intentos)`,
    blocked_at: new Date().toISOString(),
  })

  await supabase
    .from("reupload_attempts")
    .update({
      blocked_at: new Date().toISOString(),
      attempt_count: existingAttempt.attempt_count + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("file_hash", fileHash)

  return {
    isAllowed: false,
    isBlocked: true,
    attemptCount: existingAttempt.attempt_count + 1,
    errorCode: "ACCOUNT_BLOCKED",
    message: "Tu cuenta ha sido bloqueada por intentar resubir un pack duplicado múltiples veces.",
  }
}
