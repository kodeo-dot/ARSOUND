import { createServerClient } from "@/lib/supabase/server-client"

export interface ReuploadCheckResult {
  isAllowed: boolean
  isBlocked: boolean
  attemptCount: number
  message?: string
  errorCode?: "DUPLICATE_FILE" | "DUPLICATE_FILE_SECOND_ATTEMPT" | "ACCOUNT_BLOCKED" | "UNKNOWN_ERROR"
}

export async function checkReuploadProtection(
  userId: string,
  fileHash: string,
  existingPackUserId?: string,
): Promise<ReuploadCheckResult> {
  const supabase = await createServerClient()

  // Check if user account is blocked
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_blocked, blocked_reason")
    .eq("id", userId)
    .single()

  if (profileError) {
    console.error("[v0] Error checking profile:", profileError)
    return {
      isAllowed: false,
      isBlocked: false,
      attemptCount: 0,
      errorCode: "UNKNOWN_ERROR",
      message: "No se pudo verificar el estado de tu cuenta.",
    }
  }

  if (profile?.is_blocked) {
    return {
      isAllowed: false,
      isBlocked: true,
      attemptCount: 0,
      errorCode: "ACCOUNT_BLOCKED",
      message: `Tu cuenta ha sido bloqueada. Razón: ${profile.blocked_reason || "Intentos de reupload"}`,
    }
  }

  // Only check reupload if it's a different user trying to upload
  if (existingPackUserId && existingPackUserId !== userId) {
    // Get or create reupload attempt record
    const { data: existingAttempt, error: fetchError } = await supabase
      .from("reupload_attempts")
      .select("attempt_count, blocked_at")
      .eq("user_id", userId)
      .eq("file_hash", fileHash)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 means "no rows returned" which is expected for first attempt
      console.error("[v0] Error checking reupload attempts:", fetchError)
      return {
        isAllowed: false,
        isBlocked: false,
        attemptCount: 0,
        errorCode: "UNKNOWN_ERROR",
        message: "No se pudo verificar los intentos previos.",
      }
    }

    if (!existingAttempt) {
      // First attempt - create the record
      const { error: insertError } = await supabase.from("reupload_attempts").insert({
        user_id: userId,
        file_hash: fileHash,
        attempt_count: 1,
      })

      if (insertError) {
        console.error("[v0] Error creating reupload attempt record:", insertError)
      }

      return {
        isAllowed: false,
        isBlocked: false,
        attemptCount: 1,
        errorCode: "DUPLICATE_FILE",
        message:
          "⚠️ Este pack ya existe en la plataforma (subido por otro usuario). Si lo intentas de nuevo, tu cuenta será bloqueada.",
      }
    }

    if (existingAttempt.blocked_at) {
      // Already blocked for this file
      return {
        isAllowed: false,
        isBlocked: true,
        attemptCount: existingAttempt.attempt_count,
        errorCode: "ACCOUNT_BLOCKED",
        message: "Tu cuenta ha sido bloqueada por intentar resubir un pack duplicado.",
      }
    }

    if (existingAttempt.attempt_count >= 1) {
      // Second or more attempt - block the account
      const { error: updateProfileError } = await supabase
        .from("profiles")
        .update({
          is_blocked: true,
          blocked_reason: `Intentos de reupload de pack duplicado (hash: ${fileHash.substring(0, 8)}...)`,
          blocked_at: new Date().toISOString(),
        })
        .eq("id", userId)

      const { error: updateAttemptError } = await supabase
        .from("reupload_attempts")
        .update({
          blocked_at: new Date().toISOString(),
          attempt_count: existingAttempt.attempt_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("file_hash", fileHash)

      if (updateProfileError || updateAttemptError) {
        console.error("[v0] Error blocking account:", {
          updateProfileError,
          updateAttemptError,
        })
      }

      return {
        isAllowed: false,
        isBlocked: true,
        attemptCount: existingAttempt.attempt_count + 1,
        errorCode: "ACCOUNT_BLOCKED",
        message: "🔒 Tu cuenta ha sido bloqueada por intentar resubir un pack duplicado múltiples veces.",
      }
    }
  }

  return {
    isAllowed: true,
    isBlocked: false,
    attemptCount: 0,
  }
}
