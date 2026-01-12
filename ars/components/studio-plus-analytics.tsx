"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, TrendingUp, TrendingDown, Globe, Clock, Percent, Package, DollarSign } from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

interface StudioPlusAnalyticsProps {
  userId: string
}

export function StudioPlusAnalytics({ userId }: StudioPlusAnalyticsProps) {
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState({
    total_plays: 0,
    total_sales: 0,
    conversion_rate: "0",
    packs_count: 0,
    top_packs: [] as any[],
    play_activity: [] as any[],
  })
  const supabase = createClient()

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)

        // Fetch user's packs
        const { data: packs } = await supabase
          .from("packs")
          .select("id, title, downloads_count")
          .eq("user_id", userId)

        const packIds = packs?.map(p => p.id) || []

        if (packIds.length === 0) {
          setAnalytics({
            total_plays: 0,
            total_sales: 0,
            conversion_rate: "0",
            packs_count: 0,
            top_packs: [],
            play_activity: [],
          })
          return
        }

        // Fetch plays
        const { data: plays } = await supabase
          .from("pack_plays")
          .select("*")
          .in("pack_id", packIds)

        // Fetch sales
        const { data: sales } = await supabase
          .from("purchases")
          .select("*")
          .in("pack_id", packIds)

        // Calculate conversion rate
        const totalPlays = plays?.length || 0
        const totalSales = sales?.length || 0
        const conversionRate = totalPlays > 0 ? ((totalSales / totalPlays) * 100).toFixed(2) : "0"

        // Get top packs by sales
        const topPacksData = packs
          ?.sort((a, b) => (b.downloads_count || 0) - (a.downloads_count || 0))
          .slice(0, 5)
          .map(p => ({
            name: p.title.length > 15 ? p.title.substring(0, 15) + "..." : p.title,
            sales: p.downloads_count || 0,
          })) || []

        // Get play activity by week
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const playsByWeek: any = {}
        plays?.forEach((play: any) => {
          if (play.played_at && new Date(play.played_at) >= thirtyDaysAgo) {
            const date = new Date(play.played_at)
            const weekStart = new Date(date)
            weekStart.setDate(date.getDay() === 0 ? date.getDate() - 6 : date.getDate() - (date.getDay() - 1))
            const weekKey = weekStart.toLocaleDateString("es-AR", { month: "short", day: "numeric" })
            playsByWeek[weekKey] = (playsByWeek[weekKey] || 0) + 1
          }
        })

        const playActivityData = Object.entries(playsByWeek)
          .map(([week, count]) => ({
            week,
            plays: count as number,
          }))
          .slice(0, 8)

        setAnalytics({
          total_plays: totalPlays,
          total_sales: totalSales,
          conversion_rate: conversionRate,
          packs_count: packIds.length,
          top_packs: topPacksData,
          play_activity: playActivityData,
        })
      } catch (error) {
        console.error("[v0] Error fetching analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [userId, supabase])

  if (loading) {
    return (
      <Card className="p-12 rounded-3xl border-border">
        <div className="flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 rounded-3xl border-border bg-gradient-to-br from-primary/10 to-primary/5">
          <div className="flex items-center justify-between mb-2">
            <Package className="h-8 w-8 text-primary" />
            <Badge variant="outline" className="text-xs">Este mes</Badge>
          </div>
          <div className="text-3xl font-black text-foreground">{analytics.total_sales}</div>
          <div className="text-sm text-muted-foreground font-semibold mt-2">Ventas</div>
        </Card>

        <Card className="p-6 rounded-3xl border-border bg-gradient-to-br from-secondary/10 to-secondary/5">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-8 w-8 text-secondary" />
            <Badge variant="outline" className="text-xs">Este mes</Badge>
          </div>
          <div className="text-3xl font-black text-foreground">{analytics.total_plays}</div>
          <div className="text-sm text-muted-foreground font-semibold mt-2">Reproducciones</div>
        </Card>

        <Card className="p-6 rounded-3xl border-border bg-gradient-to-br from-orange-500/10 to-orange-500/5">
          <div className="flex items-center justify-between mb-2">
            <Percent className="h-8 w-8 text-orange-500" />
            <TrendingUp className="h-5 w-5 text-orange-500/60" />
          </div>
          <div className="text-3xl font-black text-foreground">{analytics.conversion_rate}%</div>
          <div className="text-sm text-muted-foreground font-semibold mt-2">Tasa de Conversión</div>
        </Card>

        <Card className="p-6 rounded-3xl border-border bg-gradient-to-br from-green-500/10 to-green-500/5">
          <div className="flex items-center justify-between mb-2">
            <Package className="h-8 w-8 text-green-500" />
            <Badge variant="outline" className="text-xs">Total</Badge>
          </div>
          <div className="text-3xl font-black text-foreground">{analytics.packs_count}</div>
          <div className="text-sm text-muted-foreground font-semibold mt-2">Packs Activos</div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Top Packs */}
        {analytics.top_packs.length > 0 && (
          <Card className="p-6 rounded-3xl border-border">
            <h3 className="text-2xl font-black text-foreground mb-6">Packs Más Vendidos</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.top_packs}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                  }}
                />
                <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]}>
                  {analytics.top_packs.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={`hsl(var(--primary))`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Play Activity */}
        {analytics.play_activity.length > 0 && (
          <Card className="p-6 rounded-3xl border-border">
            <h3 className="text-2xl font-black text-foreground mb-6">Actividad de Reproducciones (30 días)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.play_activity}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="week"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="plays"
                  stroke="hsl(var(--secondary))"
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--secondary))", r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Insights */}
      <Card className="p-6 rounded-3xl border-border bg-gradient-to-r from-primary/5 to-secondary/5">
        <h3 className="text-lg font-black text-foreground mb-4">Insights</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">
              Tu tasa de conversión es de <strong>{analytics.conversion_rate}%</strong>. Esto significa que por cada 100 reproducciones, obtenés {Math.round(parseFloat(analytics.conversion_rate))} ventas.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Package className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">
              Tenés <strong>{analytics.packs_count}</strong> packs activos con un total de <strong>{analytics.total_sales}</strong> ventas y <strong>{analytics.total_plays}</strong> reproducciones.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
