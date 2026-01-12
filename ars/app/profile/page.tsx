"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth-provider"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Calendar, Package, Upload } from "lucide-react"
import Link from "next/link"
import type { PlanType } from "@/lib/plans"
import { ProfileLimitsCard } from "@/components/profile-limits-card"
import { BlockWarningBanner } from "@/components/block-warning-banner"
import { useBlockStatus } from "@/hooks/use-block-status"

interface Profile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  instagram: string | null
  twitter: string | null
  soundcloud: string | null
  followers_count: number
  total_sales: number
  packs_count: number
  created_at: string
  total_plays_count: number
  total_likes_received: number
  plan: PlanType
}

interface Pack {
  id: string
  title: string
  description: string | null
  price: number
  cover_image_url: string | null
  downloads_count: number
  likes_count: number
  created_at: string
  genre: string | null
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userPlan, setUserPlan] = useState<PlanType>("free")
  const [userPacks, setUserPacks] = useState<Pack[]>([])
  const [packStats, setPackStats] = useState<any[]>([])
  const [followerStats, setFollowerStats] = useState<any[]>([])
  const [packsLoading, setPacksLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)

  const blockStatus = useBlockStatus()

  const supabase = createClient()

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push("/login")
      return
    }

    loadUserData()
  }, [user, authLoading])

  useEffect(() => {
    if (profile?.id) {
      loadUserPacks()
      // Removed loadStatistics call
    }
  }, [profile?.id])

  async function loadUserData() {
    try {
      setLoading(true)

      if (!user) {
        router.push("/login")
        return
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (!profileError && profileData) {
        setProfile(profileData as Profile)

        const plan = (profileData.plan as PlanType) || "free"
        setUserPlan(plan)
      }
    } catch (error) {
      console.error("Error loading profile:", error)
    } finally {
      setLoading(false)
    }
  }

  async function loadUserPacks() {
    try {
      setPacksLoading(true)

      if (!profile?.id) {
        setPacksLoading(false)
        return
      }

      const { data: packs, error } = await supabase
        .from("packs")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })

      if (!error && packs) {
        setUserPacks(packs as Pack[])

        // Update packs count in profile if it doesn't match
        if (packs.length !== profile.packs_count) {
          await supabase.from("profiles").update({ packs_count: packs.length }).eq("id", profile.id)
        }
      }
    } catch (error) {
      console.error("Error loading packs:", error)
    } finally {
      setPacksLoading(false)
    }
  }

  // Removed loadStatistics function

  function getAvatarInitials() {
    const username = profile?.username || user?.email || "US"
    return username.substring(0, 2).toUpperCase()
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatLikes = (likes: number) => {
    if (likes <= 5) {
      return `${likes}`
    } else if (likes <= 10) {
      return "+5"
    } else if (likes <= 50) {
      return "+10"
    } else if (likes <= 100) {
      return "+50"
    } else {
      return "+100"
    }
  }

  const canShowGraphs = userPlan === "studio_plus"
  const canShow4Cards = userPlan === "de_0_a_hit" || userPlan === "studio_plus"
  const showUpgradeCTA = userPlan === "free"

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <Card className="p-8 rounded-3xl border-border mb-8 animate-pulse">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-32 h-32 rounded-full bg-muted" />
              <div className="flex-1 space-y-4">
                <div className="h-10 bg-muted rounded-lg w-48" />
                <div className="h-6 bg-muted rounded-lg w-96" />
                <div className="h-4 bg-muted rounded-lg w-64" />
              </div>
            </div>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-3 md:px-4 py-6 md:py-12">
        {blockStatus.isNearBlock && !blockStatus.loading && (
          <BlockWarningBanner attemptCount={blockStatus.attemptCount} />
        )}

        {/* Profile Header - RESPONSIVE IMPROVEMENTS */}
        <Card className="p-6 md:p-8 rounded-3xl border-border mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            {/* Avatar */}
            <div className="flex-shrink-0 flex justify-center md:justify-start">
              {profile?.avatar_url ? (
                <img
                  src={profile?.avatar_url || "/placeholder.svg"}
                  alt="Avatar"
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-primary/20"
                />
              ) : (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl md:text-5xl font-black text-white">
                  {getAvatarInitials()}
                </div>
              )}
            </div>

            {/* Info - RESPONSIVE IMPROVEMENTS */}
            <div className="flex-1 space-y-4 text-center md:text-left">
              <>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="space-y-2">
                    <h1 className="text-3xl md:text-4xl font-black text-foreground">@{profile?.username}</h1>
                    {profile?.bio && (
                      <p className="text-muted-foreground text-sm md:text-base max-w-2xl">{profile.bio}</p>
                    )}
                    <p className="text-xs md:text-sm text-muted-foreground flex items-center justify-center md:justify-start gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>Argentina</span>
                      <Calendar className="h-4 w-4" />
                      <span>
                        Miembro desde{" "}
                        {new Date(profile?.created_at || Date.now()).toLocaleDateString("es-AR", {
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Stats Grid - RESPONSIVE IMPROVEMENTS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-4 md:mt-6">
                  <div className="text-center md:text-left">
                    <div className="text-2xl md:text-3xl font-black text-foreground">{profile?.packs_count || 0}</div>
                    <div className="text-xs md:text-sm text-muted-foreground">Packs Subidos</div>
                  </div>
                  <div className="text-center md:text-left">
                    <div className="text-2xl md:text-3xl font-black text-foreground">
                      {formatLikes(profile?.total_likes_received || 0)}
                    </div>
                    <div className="text-xs md:text-sm text-muted-foreground">Likes</div>
                  </div>
                  <div className="text-center md:text-left">
                    <div className="text-2xl md:text-3xl font-black text-foreground">
                      {profile?.followers_count || 0}
                    </div>
                    <div className="text-xs md:text-sm text-muted-foreground">Seguidores</div>
                  </div>
                  {/* Only show sales if the user has the De 0 a Hit or Studio Plus plan */}
                  {(userPlan === "de_0_a_hit" || userPlan === "studio_plus") && (
                    <div className="text-center md:text-left">
                      <div className="text-2xl md:text-3xl font-black text-foreground">
                        ${formatPrice(profile?.total_sales || 0)}
                      </div>
                      <div className="text-xs md:text-sm text-muted-foreground">Total Ventas</div>
                    </div>
                  )}
                </div>
              </>
            </div>
          </div>
        </Card>

        {/* Tabs - RESPONSIVE IMPROVEMENTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2">
            <Tabs defaultValue="packs" className="space-y-4 md:space-y-6">
              <TabsList className="bg-accent rounded-full p-1 h-auto flex flex-wrap justify-center md:justify-start gap-1 overflow-x-auto">
                <TabsTrigger
                  value="packs"
                  className="rounded-full px-3 md:px-6 py-2 md:py-3 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold whitespace-nowrap flex-shrink-0"
                >
                  Packs ({profile?.packs_count || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="packs">
                {packsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="overflow-hidden border-border rounded-2xl animate-pulse">
                        <div className="aspect-square bg-muted" />
                        <div className="p-5 space-y-3">
                          <div className="h-6 bg-muted rounded" />
                          <div className="h-10 bg-muted rounded" />
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : userPacks.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userPacks.map((pack) => (
                      <Card
                        key={pack.id}
                        className="overflow-hidden border-border rounded-2xl hover:border-primary/40 transition-all group"
                      >
                        <div className="relative aspect-square bg-muted overflow-hidden">
                          {pack.cover_image_url ? (
                            <img
                              src={pack.cover_image_url || "/placeholder.svg"}
                              alt={pack.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                              <Package className="h-16 w-16 text-muted-foreground" />
                            </div>
                          )}
                          <Badge className="absolute top-3 right-3 bg-secondary text-secondary-foreground font-bold">
                            {pack.downloads_count} ventas
                          </Badge>
                        </div>
                        <div className="p-5 space-y-3">
                          <h3 className="font-bold text-lg text-foreground line-clamp-2">{pack.title}</h3>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-2xl font-black text-foreground">${formatPrice(pack.price)}</div>
                              <div className="text-xs text-muted-foreground">ARS</div>
                            </div>
                            <Link href={`/pack/${pack.id}`}>
                              <Button variant="outline" className="rounded-full bg-transparent">
                                Ver Pack
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-12 text-center rounded-3xl border-2 border-dashed border-border">
                    <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-bold text-foreground mb-2">Aún no subiste ningún pack</h3>
                    <p className="text-muted-foreground mb-6">Comenza a vender tus samples y loops en ARSOUND</p>
                    <Link href="/upload">
                      <Button className="gap-2 rounded-full h-12 px-8 text-base font-bold">
                        <Upload className="h-5 w-5" />
                        Subir Mi Primer Pack
                      </Button>
                    </Link>
                  </Card>
                )}

                {userPacks.length > 0 && (
                  <div className="mt-8 text-center">
                    <Link href="/upload">
                      <Button className="gap-2 rounded-full h-12 px-8 text-base font-bold">
                        <Package className="h-5 w-5" />
                        Subir Nuevo Pack
                      </Button>
                    </Link>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - RESPONSIVE IMPROVEMENTS */}
          <div className="space-y-4 md:space-y-6">
            {profile && <ProfileLimitsCard userId={profile.id} userPlan={userPlan} />}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
