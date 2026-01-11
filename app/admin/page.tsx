"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { createBrowserClient } from "@/lib/supabase/client"
import { Package, Users, MessageSquare, Shield, TrendingUp } from "lucide-react"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPacks: 0,
    totalUsers: 0,
    totalComments: 0,
    pendingAppeals: 0,
    recentPacks: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [{ count: packsCount }, { count: usersCount }, { count: commentsCount }, { count: appealsCount }] =
        await Promise.all([
          supabase.from("packs").select("*", { count: "exact", head: true }),
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("comments").select("*", { count: "exact", head: true }),
          supabase.from("appeals").select("*", { count: "exact", head: true }).eq("status", "pending"),
        ])

      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { count: recentPacksCount } = await supabase
        .from("packs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo.toISOString())

      setStats({
        totalPacks: packsCount || 0,
        totalUsers: usersCount || 0,
        totalComments: commentsCount || 0,
        pendingAppeals: appealsCount || 0,
        recentPacks: recentPacksCount || 0,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: "Total Packs",
      value: stats.totalPacks,
      icon: Package,
      color: "text-blue-500",
    },
    {
      title: "Total Usuarios",
      value: stats.totalUsers,
      icon: Users,
      color: "text-green-500",
    },
    {
      title: "Comentarios",
      value: stats.totalComments,
      icon: MessageSquare,
      color: "text-purple-500",
    },
    {
      title: "Apelaciones Pendientes",
      value: stats.pendingAppeals,
      icon: Shield,
      color: "text-orange-500",
    },
    {
      title: "Packs últimos 7 días",
      value: stats.recentPacks,
      icon: TrendingUp,
      color: "text-pink-500",
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black text-foreground mb-2">Dashboard</h1>
        <p className="text-lg text-muted-foreground">Vista general de la plataforma ARSOUND</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="p-6 rounded-2xl border-border">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-muted ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                <p className="text-3xl font-black text-foreground">{loading ? "..." : stat.value}</p>
              </div>
            </Card>
          )
        })}
      </div>

      <Card className="p-8 rounded-3xl border-border">
        <h2 className="text-2xl font-black text-foreground mb-4">Bienvenido al Panel de Administración</h2>
        <p className="text-foreground leading-relaxed">
          Desde aquí podés gestionar todos los aspectos de la plataforma ARSOUND. Usá el menú lateral para navegar entre
          las diferentes secciones de administración.
        </p>
      </Card>
    </div>
  )
}
