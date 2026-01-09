"use client"

import { useEffect, useState } from "react"
import { Bell, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/user-avatar"
import Link from "next/link"
import type { Notification } from "@/lib/types/notifications.types"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async (offset = 0) => {
    try {
      if (offset > 0) setLoadingMore(true)

      const response = await fetch(`/api/notifications?limit=20&offset=${offset}`)
      if (!response.ok) return

      const result = await response.json()
      if (result.success) {
        if (offset === 0) {
          setNotifications(result.data.notifications)
        } else {
          setNotifications((prev) => [...prev, ...result.data.notifications])
        }
        setUnreadCount(result.data.unread_count)
        setHasMore(result.data.notifications.length === 20)
      }
    } catch (error) {
      console.error("[ARSOUND] Error loading notifications:", error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_id: notificationId }),
      })
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error("[ARSOUND] Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error("[ARSOUND] Error marking all as read:", error)
    }
  }

  const getNotificationText = (notif: Notification) => {
    switch (notif.type) {
      case "follow":
        return "comenzó a seguirte"
      case "like":
        return `le dio like a tu pack "${notif.pack?.name}"`
      case "purchase":
        return `compró tu pack "${notif.pack?.name}"`
      default:
        return "interactuó contigo"
    }
  }

  const getNotificationLink = (notif: Notification) => {
    switch (notif.type) {
      case "follow":
        return `/profile/${notif.actor?.username}`
      case "like":
      case "purchase":
        return `/pack/${notif.pack_id}`
      default:
        return "/notifications"
    }
  }

  if (loading) {
    return (
      <div className="container max-w-2xl py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Notificaciones</h1>
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <Check className="h-4 w-4 mr-2" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No tienes notificaciones</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <Link
              key={notif.id}
              href={getNotificationLink(notif)}
              onClick={() => !notif.is_read && markAsRead(notif.id)}
              className={`block p-4 rounded-lg border transition-colors hover:bg-accent/50 ${
                !notif.is_read ? "bg-accent/30" : "bg-card"
              }`}
            >
              <div className="flex items-start gap-3">
                <UserAvatar
                  avatarUrl={notif.actor?.avatar_url}
                  username={notif.actor?.username}
                  displayName={notif.actor?.display_name}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-semibold">{notif.actor?.display_name || notif.actor?.username}</span>{" "}
                    <span className="text-muted-foreground">{getNotificationText(notif)}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notif.created_at), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </p>
                </div>
                {!notif.is_read && <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && notifications.length > 0 && (
        <div className="mt-6 text-center">
          <Button variant="outline" onClick={() => loadNotifications(notifications.length)} disabled={loadingMore}>
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cargando...
              </>
            ) : (
              "Cargar más"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
