"use client"

import {
  Bell,
  AlertCircle,
  Heart,
  UserPlus,
  ShoppingBag,
  Download,
  Eye,
  Star,
  MessageCircle,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useEffect, useState } from "react"
import { UserAvatar } from "@/components/user-avatar"
import Link from "next/link"
import type { Notification } from "@/lib/types/notifications.types"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifications()
    // Refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async () => {
    try {
      console.log("[v0] Loading notifications...")
      const response = await fetch("/api/notifications?limit=3")
      console.log("[v0] Response status:", response.status)

      if (!response.ok) {
        console.log("[v0] Response not OK")
        return
      }

      const result = await response.json()
      console.log("[v0] Notifications result:", result)

      if (result.success) {
        setNotifications(result.data.notifications)
        setUnreadCount(result.data.unread_count)
        console.log("[v0] Set notifications:", result.data.notifications.length)
        console.log("[v0] Unread count:", result.data.unread_count)
      }
    } catch (error) {
      console.error("[ARSOUND] Error loading notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_id: notificationId }),
      })
      loadNotifications()
    } catch (error) {
      console.error("[ARSOUND] Error marking notification as read:", error)
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
      case "download":
        return `descargó tu pack "${notif.pack?.name}"`
      case "profile_view":
        return "vio tu perfil"
      case "comment":
        return `comentó en tu pack`
      case "reply":
        const isOwner = notif.metadata?.is_pack_owner
        return `respondió tu comentario${isOwner ? " (Creador)" : ""}`
      case "review":
        const rating = notif.metadata?.rating
        return `dejó una review ${rating ? `(${rating}⭐)` : ""} en tu pack`
      case "question":
        return `hizo una pregunta sobre tu pack`
      case "answer":
        const isPackOwner = notif.metadata?.is_pack_owner
        return `respondió tu pregunta${isPackOwner ? " (Creador)" : ""}`
      case "limit_reached":
        return `Alcanzaste el límite de descargas. Mejorá tu plan.`
      default:
        return "interactuó contigo"
    }
  }

  const getNotificationLink = (notif: Notification) => {
    switch (notif.type) {
      case "follow":
      case "profile_view":
        return `/profile/${notif.actor?.username}`
      case "like":
      case "purchase":
      case "download":
      case "comment":
      case "reply":
      case "review":
      case "question":
      case "answer":
        return `/pack/${notif.pack_id}`
      case "limit_reached":
        return "/plans"
      default:
        return "/notifications"
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "follow":
        return <UserPlus className="h-3.5 w-3.5" />
      case "like":
        return <Heart className="h-3.5 w-3.5" />
      case "purchase":
        return <ShoppingBag className="h-3.5 w-3.5" />
      case "download":
        return <Download className="h-3.5 w-3.5" />
      case "profile_view":
        return <Eye className="h-3.5 w-3.5" />
      case "comment":
        return <MessageCircle className="h-3.5 w-3.5" />
      case "reply":
        return <MessageSquare className="h-3.5 w-3.5" />
      case "review":
        return <Star className="h-3.5 w-3.5" />
      case "question":
        return <MessageCircle className="h-3.5 w-3.5" />
      case "answer":
        return <MessageSquare className="h-3.5 w-3.5" />
      case "limit_reached":
        return <AlertCircle className="h-3.5 w-3.5" />
      default:
        return <Bell className="h-3.5 w-3.5" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "follow":
        return "text-blue-600 dark:text-blue-400"
      case "like":
        return "text-pink-600 dark:text-pink-400"
      case "purchase":
        return "text-green-600 dark:text-green-400"
      case "download":
        return "text-purple-600 dark:text-purple-400"
      case "profile_view":
        return "text-cyan-600 dark:text-cyan-400"
      case "comment":
        return "text-indigo-600 dark:text-indigo-400"
      case "reply":
        return "text-teal-600 dark:text-teal-400"
      case "review":
        return "text-yellow-600 dark:text-yellow-400"
      case "question":
        return "text-indigo-600 dark:text-indigo-400"
      case "answer":
        return "text-teal-600 dark:text-teal-400"
      case "limit_reached":
        return "text-orange-600 dark:text-orange-400"
      default:
        return "text-foreground"
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">Cargando...</div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">No tienes notificaciones</div>
        ) : (
          <>
            {notifications.map((notif) => (
              <DropdownMenuItem
                key={notif.id}
                asChild
                className="cursor-pointer p-3"
                onClick={() => !notif.is_read && markAsRead(notif.id)}
              >
                <Link href={getNotificationLink(notif)}>
                  <div className="flex items-start gap-3 w-full">
                    {notif.type === "limit_reached" ? (
                      <div
                        className={`p-2 rounded-full bg-white border-2 border-orange-500/20 ${getNotificationColor(notif.type)}`}
                      >
                        {getNotificationIcon(notif.type)}
                      </div>
                    ) : (
                      <div className="relative">
                        <UserAvatar
                          avatarUrl={notif.actor?.avatar_url}
                          username={notif.actor?.username}
                          displayName={notif.actor?.display_name}
                          size="sm"
                        />
                        <div
                          className={`absolute -bottom-0.5 -right-0.5 p-1 rounded-full bg-white border-2 border-background ${getNotificationColor(notif.type)}`}
                        >
                          {getNotificationIcon(notif.type)}
                        </div>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        {notif.type === "limit_reached" ? (
                          <span className="text-muted-foreground">{getNotificationText(notif)}</span>
                        ) : (
                          <>
                            <span className="font-semibold">{notif.actor?.display_name || notif.actor?.username}</span>{" "}
                            <span className="text-muted-foreground">{getNotificationText(notif)}</span>
                          </>
                        )}
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
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer justify-center">
              <Link href="/notifications" className="text-center w-full text-primary font-semibold">
                Ver todas las notificaciones
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
