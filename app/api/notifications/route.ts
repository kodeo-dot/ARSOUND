import type { NextRequest } from "next/server"
import { createServerClient } from "@/lib/database/supabase.client"
import { successResponse, errorResponse } from "@/lib/utils/response"
import { logger } from "@/lib/utils/logger"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      logger.error("Unauthorized access to notifications", { error: authError })
      return errorResponse("No autorizado", 401)
    }

    console.log("[v0] Fetching notifications for user:", user.id)

    const searchParams = request.nextUrl.searchParams
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const { data: notifications, error: notifError } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    console.log("[v0] Notifications query result:", { notifications, error: notifError })

    if (notifError) {
      console.error("[v0] Supabase error:", notifError)
      logger.error("Error fetching notifications", { error: notifError })
      return errorResponse(`Error al obtener notificaciones: ${notifError.message}`, 500)
    }

    const enrichedNotifications = await Promise.all(
      (notifications || []).map(async (notif) => {
        const enriched: any = { ...notif }

        // Fetch actor profile
        if (notif.actor_id) {
          const { data: actor } = await supabase
            .from("profiles")
            .select("id, username, display_name, avatar_url")
            .eq("id", notif.actor_id)
            .single()
          enriched.actor = actor
        }

        // Fetch pack data
        if (notif.pack_id) {
          const { data: pack } = await supabase
            .from("packs")
            .select("id, name, cover_url")
            .eq("id", notif.pack_id)
            .single()
          enriched.pack = pack
        }

        return enriched
      }),
    )

    // Get unread count
    const { count: unreadCount } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false)

    console.log("[v0] Unread count:", unreadCount)
    console.log("[v0] Total notifications:", enrichedNotifications?.length)

    return successResponse({
      notifications: enrichedNotifications || [],
      unread_count: unreadCount || 0,
    })
  } catch (error) {
    console.error("[v0] Error in notifications GET:", error)
    logger.error("Error in notifications GET", { error })
    return errorResponse("Error del servidor", 500)
  }
}
