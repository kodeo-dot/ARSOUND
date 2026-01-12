"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import {
  BarChart3,
  DollarSign,
  Download,
  Heart,
  Package,
  Play,
  TrendingUp,
  Users,
  Loader2,
  Zap,
  ShoppingBag,
  Upload,
  Eye,
  Calendar,
} from "lucide-react"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import Link from "next/link"
import type { PlanType } from "@/lib/constants"

interface Profile {
  id: string
  username: string
  total_sales: number
  total_plays_count: number
  total_likes_received: number
  followers_count: number
  packs_count: number
  plan: PlanType
}

export default function StatisticsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [packStats, setPackStats] = useState<any[]>([])
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalPurchases, setTotalPurchases] = useState(0)
  const [profileViews, setProfileViews] = useState<{
    last7Days: number
    last28Days: number
    total: number
  }>({ last7Days: 0, last28Days: 0, total: 0 })
  const [viewsTimeRange, setViewsTimeRange] = useState<"7" | "28">("7")

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileError || !profileData) {
        console.error("Error loading profile:", profileError)
        return
      }

      setProfile(profileData as Profile)

      // Fetch packs statistics
      const { data: packs, error: packsError } = await supabase
        .from("packs")
        .select("id, title, likes_count, downloads_count, price")
        .eq("user_id", user.id)
        .order("downloads_count", { ascending: false })
        .limit(10)

      if (!packsError && packs) {
        setPackStats(
          packs.map((pack: any) => ({
            name: pack.title.length > 15 ? pack.title.substring(0, 15) + "..." : pack.title,
            downloads: pack.downloads_count || 0,
            likes: pack.likes_count || 0,
          })),
        )

        const { data: packPlays } = await supabase
          .from("pack_plays")
          .select("user_id")
          .in(
            "pack_id",
            packs.map((p: any) => p.id),
          )

        // Count unique users who played
        const uniquePlayUsers = new Set(packPlays?.filter((p) => p.user_id).map((p) => p.user_id) || [])
        const uniquePlaysCount = uniquePlayUsers.size

        const { data: packDownloads } = await supabase
          .from("pack_downloads")
          .select("user_id")
          .in(
            "pack_id",
            packs.map((p: any) => p.id),
          )

        // Count unique users who downloaded
        const uniqueDownloadUsers = new Set(packDownloads?.filter((d) => d.user_id).map((d) => d.user_id) || [])
        const uniqueDownloadsCount = uniqueDownloadUsers.size

        // Update profile with unique play and download counts
        setProfile((prevProfile) => ({
          ...prevProfile,
          total_plays_count: uniquePlaysCount,
          packs_count: uniqueDownloadsCount,
        }))
      }

      // Calculate revenue and purchases
      const { data: purchases, error: purchasesError } = await supabase
        .from("purchases")
        .select("price, created_at")
        .eq("seller_id", user.id)

      if (!purchasesError && purchases) {
        const revenue = purchases.reduce((sum, p) => sum + (p.price || 0), 0)
        setTotalRevenue(revenue)
        setTotalPurchases(purchases.length)

        // Group by week for time series
        const last30Days = new Date()
        last30Days.setDate(last30Days.getDate() - 30)

        const filteredPurchases = purchases.filter((p) => new Date(p.created_at) >= last30Days)

        const purchasesByWeek: any = {}
        filteredPurchases.forEach((purchase: any) => {
          const date = new Date(purchase.created_at)
          const weekStart = new Date(date)
          weekStart.setDate(date.getDay() === 0 ? date.getDate() - 6 : date.getDate() - (date.getDay() - 1))
          const weekKey = weekStart.toLocaleDateString("es-AR", { month: "short", day: "numeric" })
          purchasesByWeek[weekKey] = (purchasesByWeek[weekKey] || 0) + 1
        })

        const timeSeriesArray = Object.entries(purchasesByWeek).map(([week, count]) => ({
          week,
          sales: count,
        }))

        setTimeSeriesData(timeSeriesArray)
      }

      const userPlan = profileData?.plan || "free"
      const canAccessFullStats = ["de 0 a hit", "de 0 a hit+", "studio plus"].includes(userPlan)

      console.log("[v0] User plan:", userPlan)
      console.log("[v0] Can access full stats:", canAccessFullStats)

      if (canAccessFullStats) {
        const now = new Date()
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const last28Days = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000)

        console.log("[v0] Fetching profile views for user:", user.id)

        // Get total views
        const { count: totalCount } = await supabase
          .from("profile_views")
          .select("*", { count: "exact", head: true })
          .eq("profile_id", user.id)

        // Get views in last 7 days
        const { count: last7Count } = await supabase
          .from("profile_views")
          .select("*", { count: "exact", head: true })
          .eq("profile_id", user.id)
          .gte("viewed_at", last7Days.toISOString())

        // Get views in last 28 days
        const { count: last28Count } = await supabase
          .from("profile_views")
          .select("*", { count: "exact", head: true })
          .eq("profile_id", user.id)
          .gte("viewed_at", last28Days.toISOString())

        console.log("[v0] Profile views - Total:", totalCount, "Last 7 days:", last7Count, "Last 28 days:", last28Count)

        setProfileViews({
          last7Days: last7Count || 0,
          last28Days: last28Count || 0,
          total: totalCount || 0,
        })
      }
    } catch (error) {
      console.error("Error loading statistics:", error)
    } finally {
      setLoading(false)
    }
  }

  const userPlan = profile?.plan || "free"
  const canShowGraphs = ["de 0 a hit", "de 0 a hit+", "studio plus"].includes(userPlan)
  const canShow4Cards = ["de 0 a hit", "de 0 a hit+", "studio plus"].includes(userPlan)

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-foreground mb-2">Estadísticas</h1>
          <p className="text-muted-foreground">Tu rendimiento en la plataforma</p>
        </div>

        {/* Upgrade CTA for free users */}
        {userPlan === "free" && (
          <Card className="p-6 md:p-8 rounded-2xl border-2 border-primary/30 bg-primary/5 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-foreground mb-2">
                  Desbloquea estadísticas completas
                </h2>
                <p className="text-muted-foreground">
                  Mejora tu plan para acceder a gráficos detallados, análisis de ventas y más métricas.
                </p>
              </div>
              <Link href="/plans">
                <Button className="gap-2 rounded-xl h-11 px-6 font-semibold whitespace-nowrap">
                  <Zap className="h-4 w-4" />
                  Mejorar Plan
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Stats Grid */}
        <div
          className={`grid grid-cols-1 ${canShow4Cards ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2"} gap-4 mb-8`}
        >
          {/* Total Downloads */}
          <Card className="p-5 rounded-2xl border bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <Download className="h-7 w-7 text-primary" />
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="text-3xl font-black text-foreground">{profile?.packs_count || 0}</div>
            <div className="text-sm text-muted-foreground font-medium mt-1">Packs Subidos</div>
          </Card>

          {/* Total Plays */}
          <Card className="p-5 rounded-2xl border bg-gradient-to-br from-secondary/10 to-secondary/5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <Play className="h-7 w-7 text-secondary" />
              <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-secondary" />
              </div>
            </div>
            <div className="text-3xl font-black text-foreground">{profile?.total_plays_count || 0}</div>
            <div className="text-sm text-muted-foreground font-medium mt-1">Usuarios únicos (reproducciones)</div>
          </Card>

          {/* Additional stats for paid plans */}
          {canShow4Cards && (
            <>
              <Card className="p-5 rounded-2xl border bg-gradient-to-br from-red-500/10 to-red-500/5 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <Heart className="h-7 w-7 text-red-500" />
                  <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-red-500" />
                  </div>
                </div>
                <div className="text-3xl font-black text-foreground">{profile?.total_likes_received || 0}</div>
                <div className="text-sm text-muted-foreground font-medium mt-1">Likes Recibidos</div>
              </Card>

              <Card className="p-5 rounded-2xl border bg-gradient-to-br from-blue-500/10 to-blue-500/5 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <Users className="h-7 w-7 text-blue-500" />
                  <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                  </div>
                </div>
                <div className="text-3xl font-black text-foreground">{profile?.followers_count || 0}</div>
                <div className="text-sm text-muted-foreground font-medium mt-1">Seguidores</div>
              </Card>
            </>
          )}
        </div>

        {/* Revenue & Purchases (Paid plans only) */}
        {canShow4Cards && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <Card className="p-5 rounded-2xl border bg-gradient-to-br from-green-500/10 to-green-500/5 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <DollarSign className="h-7 w-7 text-green-500" />
                <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
              </div>
              <div className="text-3xl font-black text-foreground">${totalRevenue.toLocaleString("es-AR")}</div>
              <div className="text-sm text-muted-foreground font-medium mt-1">Recaudación Total</div>
            </Card>

            <Card className="p-5 rounded-2xl border bg-gradient-to-br from-orange-500/10 to-orange-500/5 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <ShoppingBag className="h-7 w-7 text-orange-500" />
                <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                </div>
              </div>
              <div className="text-3xl font-black text-foreground">{totalPurchases}</div>
              <div className="text-sm text-muted-foreground font-medium mt-1">Compras Totales</div>
            </Card>
          </div>
        )}

        {canShow4Cards && (
          <Card className="p-6 rounded-2xl border mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Eye className="h-6 w-6 text-purple-500" />
                <h3 className="text-xl font-black text-foreground">Visitas al Perfil</h3>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={viewsTimeRange === "7" ? "default" : "outline"}
                  onClick={() => setViewsTimeRange("7")}
                  className="h-9 rounded-lg"
                >
                  <Calendar className="h-4 w-4 mr-1" />7 días
                </Button>
                <Button
                  size="sm"
                  variant={viewsTimeRange === "28" ? "default" : "outline"}
                  onClick={() => setViewsTimeRange("28")}
                  className="h-9 rounded-lg"
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  28 días
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-purple-500/10 rounded-xl">
                <div className="text-2xl font-black text-foreground mb-1">
                  {viewsTimeRange === "7" ? profileViews.last7Days : profileViews.last28Days}
                </div>
                <div className="text-sm text-muted-foreground">Últimos {viewsTimeRange} días</div>
              </div>
              <div className="p-4 bg-purple-500/10 rounded-xl">
                <div className="text-2xl font-black text-foreground mb-1">{profileViews.total}</div>
                <div className="text-sm text-muted-foreground">Total de visitas únicas</div>
              </div>
              <div className="p-4 bg-purple-500/10 rounded-xl">
                <div className="text-2xl font-black text-foreground mb-1">
                  {profileViews.total > 0
                    ? Math.round(((profile?.followers_count || 0) / profileViews.total) * 100)
                    : 0}
                  %
                </div>
                <div className="text-sm text-muted-foreground">Tasa de conversión a seguidor</div>
              </div>
            </div>
          </Card>
        )}

        {/* Charts (Premium plans only) */}
        {canShowGraphs && packStats.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Most Downloaded Packs */}
            <Card className="p-6 rounded-2xl border">
              <div className="flex items-center gap-3 mb-6">
                <Package className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-black text-foreground">Packs Más Descargados</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={packStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                    }}
                  />
                  <Bar dataKey="downloads" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Sales Over Time */}
            {timeSeriesData.length > 0 && (
              <Card className="p-6 rounded-2xl border">
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="h-6 w-6 text-secondary" />
                  <h3 className="text-xl font-black text-foreground">Ventas (Últimos 30 días)</h3>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="week"
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="hsl(var(--secondary))"
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--secondary))", r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>
        )}

        {/* Empty State */}
        {packStats.length === 0 && (
          <Card className="p-12 text-center rounded-2xl border">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-bold text-foreground mb-2">Todavía no hay estadísticas disponibles</h3>
            <p className="text-muted-foreground mb-6">Sube packs y comparte tu perfil para ver tus métricas.</p>
            <Link href="/upload">
              <Button className="gap-2 rounded-xl h-11 px-6 font-semibold">
                <Upload className="h-4 w-4" />
                Subir mi primer pack
              </Button>
            </Link>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  )
}
