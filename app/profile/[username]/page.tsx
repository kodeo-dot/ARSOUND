"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Package, Loader2, UserPlus, Check } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { getPlanBadge } from "@/lib/plans"

interface Profile {
  id: string
  username: string
  bio: string | null
  avatar_url: string | null
  instagram: string | null
  twitter: string | null
  soundcloud: string | null
  followers_count: number
  total_sales: number
  packs_count: number
  created_at: string
  total_likes_received: number
  plan: string | null
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
  has_discount: boolean
  discount_percent: number
  genre: string | null
}

export default function PublicProfilePage() {
  const params = useParams()
  const username = params.username as string
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userPacks, setUserPacks] = useState<Pack[]>([])
  const [packsLoading, setPacksLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [userPlan, setUserPlan] = useState<string | null>(null)
  const supabase = createBrowserClient()

  useEffect(() => {
    loadProfile()
    checkCurrentUser()
  }, [username])

  useEffect(() => {
    if (profile?.id) {
      loadUserPacks()
    }
  }, [profile?.id])

  useEffect(() => {
    if (currentUserId && profile?.id && currentUserId !== profile.id) {
      checkIfFollowing()
    }
  }, [currentUserId, profile?.id])

  async function loadProfile() {
    try {
      setLoading(true)

      const { data: profileData, error } = await supabase.from("profiles").select("*").eq("username", username).single()

      if (error || !profileData) {
        console.error("Error loading profile:", error)
        setProfile(null)
      } else {
        setProfile(profileData as Profile)

        const { data: planData } = await supabase.rpc("get_user_plan").eq("user_id", profileData.id).single()

        setUserPlan(planData?.plan_type || "free")
      }
    } catch (error) {
      console.error("Error loading profile:", error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  async function loadUserPacks() {
    try {
      setPacksLoading(true)

      const { data: packs, error } = await supabase
        .from("packs")
        .select("*")
        .eq("user_id", profile?.id)
        .order("created_at", { ascending: false })

      if (!error && packs) {
        setUserPacks(packs as Pack[])
      }
    } catch (error) {
      console.error("Error loading packs:", error)
    } finally {
      setPacksLoading(false)
    }
  }

  async function checkCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      setCurrentUserId(user.id)
    }
  }

  async function checkIfFollowing() {
    try {
      const { data, error } = await supabase
        .from("followers")
        .select("id")
        .eq("follower_id", currentUserId)
        .eq("following_id", profile?.id)
        .single()

      setIsFollowing(!!data)
    } catch (error) {
      setIsFollowing(false)
    }
  }

  async function toggleFollow() {
    if (!currentUserId) {
      window.location.href = "/login"
      return
    }

    if (currentUserId === profile?.id) return

    try {
      setFollowLoading(true)

      if (isFollowing) {
        const { error } = await supabase
          .from("followers")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", profile?.id)

        if (!error) {
          setIsFollowing(false)
          setProfile({ ...profile!, followers_count: profile!.followers_count - 1 })
        }
      } else {
        const { error } = await supabase.from("followers").insert({
          follower_id: currentUserId,
          following_id: profile?.id,
        })

        if (!error) {
          setIsFollowing(true)
          setProfile({ ...profile!, followers_count: profile!.followers_count + 1 })
        }
      }
    } catch (error) {
      console.error("Error toggling follow:", error)
    } finally {
      setFollowLoading(false)
    }
  }

  function getAvatarInitials() {
    const name = profile?.username || "US"
    return name.substring(0, 2).toUpperCase()
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <Card className="p-12 text-center rounded-3xl border-border">
            <h1 className="text-3xl font-bold text-foreground mb-4">Usuario no encontrado</h1>
            <p className="text-muted-foreground mb-6">El perfil que buscás no existe</p>
            <Link href="/">
              <Button className="rounded-full">Volver al inicio</Button>
            </Link>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  const planBadge = userPlan ? getPlanBadge(userPlan as any) : null

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-12">
        <Card className="p-8 rounded-3xl border-border mb-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url || "/placeholder.svg"}
                  alt={profile.username}
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary/20"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-5xl font-black text-white">
                  {getAvatarInitials()}
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-4xl font-black text-foreground">@{profile.username}</h1>
                    {planBadge && <span className="text-4xl">{planBadge.icon}</span>}
                  </div>
                  <p className="text-muted-foreground text-lg mb-3">
                    {profile.bio || <span className="text-muted-foreground/60 italic">Sin descripción</span>}
                  </p>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>Argentina</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Miembro desde{" "}
                        {new Date(profile.created_at).toLocaleDateString("es-AR", {
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {currentUserId && currentUserId !== profile?.id && (
                  <Button
                    onClick={toggleFollow}
                    disabled={followLoading}
                    className={`gap-2 rounded-full h-11 px-6 ${
                      isFollowing ? "bg-accent text-foreground hover:bg-accent/80" : ""
                    }`}
                    variant={isFollowing ? "outline" : "default"}
                  >
                    {followLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isFollowing ? (
                      <>
                        <Check className="h-4 w-4" />
                        Siguiendo
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Seguir
                      </>
                    )}
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap gap-6 pt-4">
                <div>
                  <div className="text-3xl font-black text-foreground">{profile.packs_count || 0}</div>
                  <div className="text-sm text-muted-foreground">Packs Subidos</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-foreground">
                    {formatLikes(profile.total_likes_received || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Likes</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-foreground">{profile.followers_count || 0}</div>
                  <div className="text-sm text-muted-foreground">Seguidores</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <h2 className="text-2xl font-black text-foreground">Packs de {profile.username}</h2>

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
              {userPacks.map((pack) => {
                const finalPrice =
                  pack.has_discount && pack.discount_percent
                    ? pack.price * (1 - pack.discount_percent / 100)
                    : pack.price

                return (
                  <Card
                    key={pack.id}
                    className="overflow-hidden border-border rounded-2xl hover:border-primary/40 transition-all group"
                  >
                    <Link href={`/pack/${pack.id}`}>
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
                        {pack.genre && (
                          <Badge className="absolute top-3 left-3 bg-primary/90 backdrop-blur-sm text-primary-foreground font-bold">
                            {pack.genre}
                          </Badge>
                        )}
                        {pack.has_discount && pack.discount_percent > 0 && (
                          <Badge className="absolute top-3 right-3 bg-orange-500/90 backdrop-blur-sm text-white font-bold">
                            {pack.discount_percent}% OFF
                          </Badge>
                        )}
                      </div>
                    </Link>
                    <div className="p-5 space-y-3">
                      <Link href={`/pack/${pack.id}`}>
                        <h3 className="font-bold text-lg text-foreground line-clamp-2 hover:text-primary transition-colors">
                          {pack.title}
                        </h3>
                      </Link>
                      <div className="flex items-center justify-between">
                        <div>
                          {pack.has_discount && pack.discount_percent > 0 ? (
                            <div>
                              <div className="text-lg font-bold text-muted-foreground line-through">
                                ${formatPrice(pack.price)}
                              </div>
                              <div className="text-2xl font-black text-primary">${formatPrice(finalPrice)}</div>
                            </div>
                          ) : (
                            <div className="text-2xl font-black text-foreground">${formatPrice(pack.price)}</div>
                          )}
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
                )
              })}
            </div>
          ) : (
            <Card className="p-12 text-center rounded-3xl border-2 border-dashed border-border">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold text-foreground mb-2">Este usuario aún no subió ningún pack</h3>
              <p className="text-muted-foreground">Volvé más tarde para ver su contenido</p>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
