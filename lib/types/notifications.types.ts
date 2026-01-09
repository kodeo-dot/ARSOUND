export type NotificationType = "follow" | "like" | "purchase"

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  actor_id: string
  pack_id?: string
  is_read: boolean
  created_at: string
  actor?: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
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
