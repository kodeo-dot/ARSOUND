"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Globe, Clock, TrendingUp, Tag, Zap, Trophy, Loader2 } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface StudioPlusAnalyticsProps {
  userId: string
}

interface AnalyticsData {
  playsByCountry: Array<{ country: string; count: number }>
  salesByCountry: Array<{ country: string; count: number }>
  activityByHour: Array<{ hour: string; count: number }>
  weeklyGrowth: Array<{ week: string; plays: number; sales: number }>
  discountCodeUsage: Array<{ code: string; uses: number; discount: number }>
  conversionRate: string
  topPacks: Array<{
    rank: number
    title: string
    sales: number
    plays: number
    likes: number
    price: number
  }>
}

const COLORS = ['#0080ae', '#FF8B3D', '#10B981', '#F59E0B', '#8B5CF6']

export function StudioPlusAnalytics({ userId }: StudioPlusAnalyticsProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true)
        const response = await fetch("/api/studio/plus/analytics")
        const analyticsData = await response.json()
        
        if (response.ok) {
          setData(analyticsData)
        }
      } catch (error) {
        console.error("[v0] Error loading Studio Plus analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [userId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!data) {
    return (
      <Card className="p-12 text-center rounded-3xl border-border">
        <p className="text-muted-foreground">No se pudieron cargar las estadísticas avanzadas</p>
      </Card>
    )
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Zap className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-foreground">Analíticas Studio Plus</h2>
          <p className="text-sm text-muted-foreground">Métricas avanzadas para mejorar tu estrategia</p>
        </div>
      </div>

      {/* Conversion Rate - Highlighted */}
      <Card className="p-6 rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Tasa de Conversión</p>
              <p className="text-4xl font-black text-foreground">{data.conversionRate}%</p>
              <p className="text-xs text-muted-foreground mt-1">Reproducciones que se convierten en ventas</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Top Packs Ranking */}
      <Card className="p-6 rounded-3xl border-border">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="h-6 w-6 text-primary" />
          <h3 className="text-2xl font-black text-foreground">Ranking de Tus Packs</h3>
        </div>
        <div className="space-y-3">
          {data.topPacks.map((pack) => (
            <div
              key={pack.rank}
              className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex-shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${
                  pack.rank === 1 ? 'bg-yellow-500 text-white' :
                  pack.rank === 2 ? 'bg-gray-400 text-white' :
                  pack.rank === 3 ? 'bg-orange-500 text-white' :
                  'bg-muted-foreground/20 text-muted-foreground'
                }`}>
                  {pack.rank}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-foreground truncate">{pack.title}</h4>
                <p className="text-xs text-muted-foreground">${formatPrice(pack.price)}</p>
              </div>
              <div className="flex gap-4 text-right">
                <div>
                  <p className="text-sm font-bold text-foreground">{pack.sales}</p>
                  <p className="text-xs text-muted-foreground">Ventas</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{pack.plays}</p>
                  <p className="text-xs text-muted-foreground">Plays</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{pack.likes}</p>
                  <p className="text-xs text-muted-foreground">Likes</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plays by Country */}
        <Card className="p-6 rounded-3xl border-border">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="h-6 w-6 text-primary" />
            <h3 className="text-2xl font-black text-foreground">Reproducciones por País</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.playsByCountry}
                dataKey="count"
                nameKey="country"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(entry) => entry.country}
              >
                {data.playsByCountry.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Activity by Hour */}
        <Card className="p-6 rounded-3xl border-border">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="h-6 w-6 text-primary" />
            <h3 className="text-2xl font-black text-foreground">Horarios de Mayor Actividad</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.activityByHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="hour" 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
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
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Weekly Growth */}
      <Card className="p-6 rounded-3xl border-border">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h3 className="text-2xl font-black text-foreground">Crecimiento Semanal</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.weeklyGrowth}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="week"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
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
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={{ fill: "hsl(var(--primary))", r: 6 }}
              name="Reproducciones"
            />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="hsl(var(--secondary))"
              strokeWidth={3}
              dot={{ fill: "hsl(var(--secondary))", r: 6 }}
              name="Ventas"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Discount Code Usage */}
      {data.discountCodeUsage.length > 0 && (
        <Card className="p-6 rounded-3xl border-border">
          <div className="flex items-center gap-3 mb-6">
            <Tag className="h-6 w-6 text-primary" />
            <h3 className="text-2xl font-black text-foreground">Códigos de Descuento Más Usados</h3>
          </div>
          <div className="space-y-3">
            {data.discountCodeUsage.map((discount, index) => (
              <div
                key={discount.code}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <div>
                    <Badge className="bg-green-500/10 text-green-600 font-mono">
                      {discount.code}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {discount.discount}% de descuento
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-foreground">{discount.uses}</p>
                  <p className="text-xs text-muted-foreground">usos</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
