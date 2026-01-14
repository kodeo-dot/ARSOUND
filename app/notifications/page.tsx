"use client"

import { useEffect, useState } from "react"
import {
  Bell,
  Check,
  Loader2,
  Heart,
  ShoppingBag,
  UserPlus,
  Download,
  Eye,
  AlertCircle,
  ArrowRight,
  Star,
  MessageCircle,
  MessageSquare,
  ArrowLeft,
} from "lucide-react"
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
      case "download":
        return `descargó tu pack "${notif.pack?.name}"`
      case "profile_view":
        return "vio tu perfil"
      case "comment":
        return `comentó en tu pack "${notif.metadata?.pack_name || notif.pack?.name}"`
      case "reply":
        const isOwner = notif.metadata?.is_pack_owner
        return `respondió tu comentario${isOwner ? " (Creador del pack)" : ""}`
      case "review":
        const rating = notif.metadata?.rating
        return `dejó una review ${rating ? `(${rating}★)` : ""} en tu pack "${notif.metadata?.pack_name || notif.pack?.name}"`
      case "question":
        return `hizo una pregunta sobre tu pack "${notif.metadata?.pack_name || notif.pack?.name}"`
      case "answer":
        const isPackOwner = notif.metadata?.is_pack_owner
        return `respondió tu pregunta${isPackOwner ? " (Creador del pack)" : ""}`
      case "limit_reached":
        const resetDate = notif.metadata?.reset_date ? new Date(notif.metadata.reset_date) : null
        const resetText = resetDate ? ` Se restablecen el ${resetDate.getDate()}/${resetDate.getMonth() + 1}` : ""
        return `Alcanzaste el límite de ${notif.metadata?.max_downloads || 10} descargas mensuales.${resetText}`
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
        return <UserPlus className="h-4 w-4" />
      case "like":
        return <Heart className="h-4 w-4" />
      case "purchase":
        return <ShoppingBag className="h-4 w-4" />
      case "download":
        return <Download className="h-4 w-4" />
      case "profile_view":
        return <Eye className="h-4 w-4" />
      case "comment":
        return <MessageCircle className="h-4 w-4" />
      case "reply":
        return <MessageSquare className="h-4 w-4" />
      case "review":
        return <Star className="h-4 w-4" />
      case "question":
        return <MessageCircle className="h-4 w-4" />
      case "answer":
        return <MessageSquare className="h-4 w-4" />
      case "limit_reached":
        return <AlertCircle className="h-4 w-4" />
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
      case "download":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400"
      case "profile_view":
        return "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
      case "comment":
        return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
      case "reply":
        return "bg-teal-500/10 text-teal-600 dark:text-teal-400"
      case "review":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
      case "question":
        return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
      case "answer":
        return "bg-teal-500/10 text-teal-600 dark:text-teal-400"
      case "limit_reached":
        return "bg-orange-500/10 text-orange-600 dark:text-orange-400"
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
      <div className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="container max-w-4xl py-4 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2 rounded-xl">
                  <ArrowLeft className="h-4 w-4" />
                  Volver
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-black">Notificaciones</h1>
                  {unreadCount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {unreadCount} {unreadCount === 1 ? "nueva" : "nuevas"}
                    </p>
                  )}
                </div>
              </div>
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead} className="rounded-xl bg-transparent gap-2">
                <Check className="h-4 w-4" />
                <span className="hidden sm:inline">Marcar todas</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container max-w-4xl py-8 px-4">
        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center p-6 bg-muted/50 rounded-2xl mb-4">
              <Bell className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-black text-foreground mb-2">No tienes notificaciones</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Cuando alguien interactúe con tu contenido, aparecerá aquí
            </p>
            <Button asChild className="rounded-xl">
              <Link href="/">Explorar ARSOUND</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {notifications.map((notif) => (
                <Link
                  key={notif.id}
                  href={getNotificationLink(notif)}
                  onClick={() => !notif.is_read && markAsRead(notif.id)}
                  className={`block p-4 rounded-2xl border transition-all hover:shadow-md ${
                    !notif.is_read
                      ? "bg-primary/5 border-primary/30 hover:bg-primary/10"
                      : "bg-card border-border hover:border-primary/20"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {notif.type === "limit_reached" ? (
                      <div className={`p-3 rounded-xl ${getNotificationColor(notif.type)}`}>
                        {getNotificationIcon(notif.type)}
                      </div>
                    ) : (
                      <div className="relative flex-shrink-0">
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
                    )}

                    <div className="flex-1 min-w-0">
                      {notif.type === "limit_reached" ? (
                        <>
                          <p className="text-sm font-black text-foreground mb-1">Límite de descargas alcanzado</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">{getNotificationText(notif)}</p>
                          <Button size="sm" variant="outline" className="mt-3 rounded-xl bg-transparent">
                            Mejorar plan
                            <ArrowRight className="h-3 w-3 ml-2" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <p className="text-sm leading-relaxed">
                            <span className="font-black text-foreground">
                              {notif.actor?.display_name || notif.actor?.username}
                            </span>{" "}
                            <span className="text-muted-foreground">{getNotificationText(notif)}</span>
                          </p>
                        </>
                      )}
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {formatDistanceToNow(new Date(notif.created_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                    </div>

                    {!notif.is_read && (
                      <div className="flex-shrink-0">
                        <div className="w-2.5 h-2.5 bg-primary rounded-full" />
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
                  className="min-w-[200px] rounded-xl"
                >
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
          </>
        )}
      </div>
    </div>
  )
}
