"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { DollarSign, Heart, Loader2, Play, MessageCircle, Package, Upload } from "lucide-react"
import Link from "next/link"
import type { PlanType } from "@/lib/constants"
import Image from "next/image"

interface Profile {
  id: string
  username: string
  total_sales: number
  plan: PlanType
}

interface PackWithMetrics {
  id: string
  title: string
  cover_image_url: string | null
  price: number
  unique_plays: number
  total_revenue: number
  comments_count: number
  likes_count: number
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [packs, setPacks] = useState<PackWithMetrics[]>([])
  const [totalStats, setTotalStats] = useState({
    totalPacks: 0,
    totalRevenue: 0,
    totalPlays: 0,
    totalLikes: 0,
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      setLoading(true)

      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.error("[v0] Supabase environment variables not configured")
        alert("Error: Variables de entorno de Supabase no configuradas. Por favor verifica la sección 'Vars' en v0.")
        setLoading(false)
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, total_sales, plan")
        .eq("id", user.id)
        .single()

      if (profileError) {
        console.error("[v0] Error loading profile:", profileError)
        setLoading(false)
        return
      }

      if (!profileData) {
        console.error("[v0] No profile data found")
        setLoading(false)
        return
      }

      setProfile(profileData as Profile)

      const { data: userPacks, error: packsError } = await supabase
        .from("packs")
        .select("id, title, cover_image_url, price, likes_count")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (packsError) {
        console.error("[v0] Error loading packs:", packsError)
        setLoading(false)
        return
      }

      if (!userPacks || userPacks.length === 0) {
        setPacks([])
        setLoading(false)
        return
      }

      const packsWithMetrics: PackWithMetrics[] = await Promise.all(
        userPacks.map(async (pack) => {
          try {
            // Get unique plays for this pack
            const { data: plays, error: playsError } = await supabase
              .from("pack_plays")
              .select("user_id")
              .eq("pack_id", pack.id)

            if (playsError) {
              console.error(`[v0] Error loading plays for pack ${pack.id}:`, playsError)
            }

            const uniquePlayUsers = new Set(plays?.filter((p) => p.user_id).map((p) => p.user_id) || [])
            const unique_plays = uniquePlayUsers.size

            const { data: purchases, error: purchasesError } = await supabase
              .from("purchases")
              .select("seller_earnings, amount_paid, amount")
              .eq("pack_id", pack.id)
              .eq("status", "completed")

            if (purchasesError) {
              console.error(`[v0] Error loading purchases for pack ${pack.id}:`, purchasesError)
            }

            // Sum actual earnings from completed purchases
            const total_revenue =
              purchases?.reduce((sum, purchase) => {
                // Use seller_earnings if available, fallback to amount_paid, then amount
                const earnings = purchase.seller_earnings || purchase.amount_paid || purchase.amount || 0
                return sum + earnings
              }, 0) || 0

            // Get comments count for this pack
            const { count: comments_count, error: commentsError } = await supabase
              .from("pack_comments")
              .select("*", { count: "exact", head: true })
              .eq("pack_id", pack.id)

            if (commentsError) {
              console.error(`[v0] Error loading comments for pack ${pack.id}:`, commentsError)
            }

            return {
              id: pack.id,
              title: pack.title,
              cover_image_url: pack.cover_image_url,
              price: pack.price,
              unique_plays,
              total_revenue,
              comments_count: comments_count || 0,
              likes_count: pack.likes_count || 0,
            }
          } catch (error) {
            console.error(`[v0] Error processing pack ${pack.id}:`, error)
            return {
              id: pack.id,
              title: pack.title,
              cover_image_url: pack.cover_image_url,
              price: pack.price,
              unique_plays: 0,
              total_revenue: 0,
              comments_count: 0,
              likes_count: pack.likes_count || 0,
            }
          }
        }),
      )

      setPacks(packsWithMetrics)

      const totalPacks = packsWithMetrics.length
      const totalRevenue = packsWithMetrics.reduce((sum, pack) => sum + pack.total_revenue, 0)
      const totalPlays = packsWithMetrics.reduce((sum, pack) => sum + pack.unique_plays, 0)
      const totalLikes = packsWithMetrics.reduce((sum, pack) => sum + pack.likes_count, 0)

      setTotalStats({
        totalPacks,
        totalRevenue,
        totalPlays,
        totalLikes,
      })
    } catch (error) {
      console.error("[v0] Error loading dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-foreground" />
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
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Resumen de tus packs y rendimiento</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 border">
            <div className="flex items-center gap-3 mb-3">
              <Package className="h-5 w-5 text-foreground" />
              <div className="text-sm text-muted-foreground">Packs</div>
            </div>
            <div className="text-3xl font-bold text-foreground">{totalStats.totalPacks}</div>
          </Card>

          <Card className="p-6 border">
            <div className="flex items-center gap-3 mb-3">
              <Play className="h-5 w-5 text-foreground" />
              <div className="text-sm text-muted-foreground">Reproducciones</div>
            </div>
            <div className="text-3xl font-bold text-foreground">{totalStats.totalPlays}</div>
          </Card>

          <Card className="p-6 border">
            <div className="flex items-center gap-3 mb-3">
              <DollarSign className="h-5 w-5 text-foreground" />
              <div className="text-sm text-muted-foreground">Ventas</div>
            </div>
            <div className="text-3xl font-bold text-foreground">${totalStats.totalRevenue.toLocaleString("es-AR")}</div>
          </Card>

          <Card className="p-6 border">
            <div className="flex items-center gap-3 mb-3">
              <Heart className="h-5 w-5 text-foreground" />
              <div className="text-sm text-muted-foreground">Likes</div>
            </div>
            <div className="text-3xl font-bold text-foreground">{totalStats.totalLikes}</div>
          </Card>
        </div>

        <Card className="border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-foreground">Mis Packs</h2>
          </div>

          {packs.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No tienes packs subidos</h3>
              <p className="text-sm text-muted-foreground mb-6">Sube tu primer pack para empezar a ver métricas</p>
              <Link href="/upload">
                <Button className="gap-2">
                  <Upload className="h-4 w-4" />
                  Subir Pack
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {packs.map((pack) => (
                <div key={pack.id} className="p-6 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0 border">
                      {pack.cover_image_url ? (
                        <Image
                          src={pack.cover_image_url || "/placeholder.svg"}
                          alt={pack.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <Link href={`/pack/${pack.id}`} className="block group">
                        <h3 className="text-lg font-semibold text-foreground group-hover:underline transition-all truncate mb-1">
                          {pack.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {pack.price === 0 ? "Gratis" : `$${pack.price.toLocaleString("es-AR")}`}
                        </p>
                      </Link>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                          <Play className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-semibold text-foreground">{pack.unique_plays}</div>
                            <div className="text-xs text-muted-foreground">plays</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-semibold text-foreground">
                              ${pack.total_revenue.toLocaleString("es-AR")}
                            </div>
                            <div className="text-xs text-muted-foreground">ventas</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-semibold text-foreground">{pack.comments_count}</div>
                            <div className="text-xs text-muted-foreground">comentarios</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-semibold text-foreground">{pack.likes_count}</div>
                            <div className="text-xs text-muted-foreground">likes</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
      <Footer />
    </div>
  )
}
