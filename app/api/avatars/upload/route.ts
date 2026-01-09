import { requireSession } from "@/lib/auth/session"
import { createServerClient } from "@/lib/database/supabase.client"
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/utils/response"
import { logger } from "@/lib/utils/logger"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: Request) {
  try {
    const user = await requireSession()

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return validationErrorResponse("No file provided", ["file"])
    }

    if (file.size > MAX_FILE_SIZE) {
      return errorResponse(`File size exceeds 5MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`, 400)
    }

    if (!file.type.startsWith("image/")) {
      return errorResponse("File must be an image", 400)
    }

    const supabase = await createServerClient()

    // Delete old avatar if exists
    const { data: profile } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).single()

    if (profile?.avatar_url) {
      const oldFileName = profile.avatar_url.split("/").pop()
      if (oldFileName) {
        await supabase.storage
          .from("avatars")
          .remove([oldFileName])
          .catch(() => {
            // Ignore deletion errors
          })
      }
    }

    // Upload new avatar
    const fileExt = file.name.split(".").pop() || "jpg"
    const fileName = `${user.id}.${fileExt}`

    const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file, {
      upsert: true,
      contentType: file.type,
    })

    if (uploadError) {
      logger.error("Avatar upload error", "STORAGE", uploadError)
      return errorResponse("Failed to upload avatar", 500)
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(fileName)

    // Update profile
    const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id)

    if (updateError) {
      logger.error("Profile update error", "STORAGE", updateError)
      return errorResponse("Failed to update profile", 500)
    }

    logger.info("Avatar uploaded", "STORAGE", { userId: user.id })

    return successResponse({
      avatar_url: publicUrl,
      message: "Avatar uploaded successfully",
    })
  } catch (error) {
    logger.error("Avatar upload error", "STORAGE", error)
    return errorResponse("Internal server error", 500)
  }
}
