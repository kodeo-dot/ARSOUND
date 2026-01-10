export type NotificationType = "follow" | "like" | "purchase" | "limit_reached" | "download" | "profile_view"

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  actor_id: string | null
  pack_id?: string
  is_read: boolean
  created_at: string
  metadata?: {
    remaining_downloads?: number
    reset_date?: string
    max_downloads?: number
    [key: string]: any
  }
  actor?: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  } | null
  pack?: {
    id: string
    name: string
    cover_url: string | null
  }
}

export interface NotificationResponse {
  notifications: Notification[]
  unread_count: number
}
