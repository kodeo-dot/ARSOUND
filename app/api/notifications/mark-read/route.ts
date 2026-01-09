import type { NextRequest } from "next/server"
import { createServerClient } from "@/lib/database/supabase.client"
import { successResponse, errorResponse } from "@/lib/utils/response"
import { logger } from "@/lib/utils/logger"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return errorResponse("No autorizado", 401)
    }

    const body = await request.json()
    const { notification_id } = body

    if (notification_id) {
      // Mark single notification as read
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notification_id)
        .eq("user_id", user.id)

      if (error) {
        logger.error("Error marking notification as read", { error })
        return errorResponse("Error al marcar notificación", 500)
      }
    } else {
      // Mark all notifications as read
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false)

      if (error) {
        logger.error("Error marking all notifications as read", { error })
        return errorResponse("Error al marcar notificaciones", 500)
      }
    }

    return successResponse({ success: true })
  } catch (error) {
    logger.error("Error in mark-read POST", { error })
    return errorResponse("Error del servidor", 500)
  }
}
