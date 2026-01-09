import type { NextRequest } from "next/server"
import { createServerClient } from "@/lib/database/supabase.client"
import { successResponse, errorResponse } from "@/lib/utils/response"
import { logger } from "@/lib/utils/logger"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      logger.error("Unauthorized access to notifications", { error: authError })
      return errorResponse("No autorizado", 401)
    }

    const searchParams = request.nextUrl.searchParams
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    // Get notifications with actor and pack data
    const { data: notifications, error: notifError } = await supabase
      .from("notifications")
      .select(`
        *,
        actor:actor_id (
          id,
          username,
          display_name,
          avatar_url
        ),
        pack:pack_id (
          id,
          name,
          cover_url
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (notifError) {
      logger.error("Error fetching notifications", { error: notifError })
      return errorResponse("Error al obtener notificaciones", 500)
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false)

    return successResponse({
      notifications: notifications || [],
      unread_count: unreadCount || 0,
    })
  } catch (error) {
    logger.error("Error in notifications GET", { error })
    return errorResponse("Error del servidor", 500)
  }
}
