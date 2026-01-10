"use client"

import { useEffect, useState } from "react"
import { Bell, Check, Loader2, Heart, ShoppingBag, UserPlus, Sparkles, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/user-avatar"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { Notification } from "@/lib/types/notifications.types"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export default function NotificationsPage() {
  const router = useRouter()
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "follow":
        return <UserPlus className="h-4 w-4" />
      case "like":
        return <Heart className="h-4 w-4" />
      case "purchase":
        return <ShoppingBag className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "follow":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400"
      case "like":
        return "bg-pink-500/10 text-pink-600 dark:text-pink-400"
      case "purchase":
        return "bg-green-500/10 text-green-600 dark:text-green-400"
      default:
        return "bg-accent text-foreground"
    }
  }

  if (loading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-4xl py-4 px-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold truncate">Notificaciones</h1>
                {unreadCount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {unreadCount} {unreadCount === 1 ? "nueva" : "nuevas"}
                  </p>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead} className="shrink-0 bg-transparent">
                <Check className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Marcar todas como leídas</span>
                <span className="sm:hidden">Marcar</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container max-w-4xl py-8 px-4">
        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center p-4 bg-muted rounded-2xl mb-4">
              <Bell className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No tienes notificaciones</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Cuando alguien interactúe con tu contenido, aparecerá aquí
            </p>
            <Button asChild>
              <Link href="/">Explorar ARSOUND</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {notifications.map((notif) => (
                <Link
                  key={notif.id}
                  href={getNotificationLink(notif)}
                  onClick={() => !notif.is_read && markAsRead(notif.id)}
                  className={`block p-5 rounded-xl border transition-all hover:shadow-md hover:border-primary/30 ${
                    !notif.is_read ? "bg-primary/5 border-primary/20 shadow-sm" : "bg-card hover:bg-accent/50"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                      <UserAvatar
                        avatarUrl={notif.actor?.avatar_url}
                        username={notif.actor?.username}
                        displayName={notif.actor?.display_name}
                        size="lg"
                      />
                      <div
                        className={`absolute -bottom-1 -right-1 p-1.5 rounded-full border-2 border-background ${getNotificationColor(
                          notif.type,
                        )}`}
                      >
                        {getNotificationIcon(notif.type)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed break-words">
                        <span className="font-semibold text-foreground">
                          {notif.actor?.display_name || notif.actor?.username}
                        </span>{" "}
                        <span className="text-muted-foreground">{getNotificationText(notif)}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notif.created_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                    </div>

                    {!notif.is_read && (
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                        <span className="text-xs font-medium text-primary hidden sm:inline">Nueva</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {hasMore && (
              <div className="mt-8 text-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => loadNotifications(notifications.length)}
                  disabled={loadingMore}
                  className="min-w-[200px]"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Cargar más notificaciones
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
