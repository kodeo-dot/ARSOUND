"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useRouter } from 'next/navigation'
import { createClient } from "@/lib/supabase/client"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Settings, MapPin, Calendar, Package, Check, X, Loader2, Upload, TrendingUp, Heart, Play, DollarSign, Users, Zap, Camera, AlertCircle, Download } from 'lucide-react'
import Link from "next/link"
import { LogoutButton } from "@/components/logout-button"
// import { AvatarUpload } from "@/components/avatar-upload" // Removed AvatarUpload component
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
  Cell,
} from "recharts"
import type { PlanType } from "@/lib/plans"
import { ProfileLimitsCard } from "@/components/profile-limits-card"
import { PLAN_FEATURES } from "@/lib/plans" // Added for commission calculation
import { toast } from "@/components/ui/use-toast" // Added for toast notifications
import { ProfilePurchasesTab } from "@/components/profile-purchases-tab"

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
  mp_connected?: boolean // Added for Mercado Pago connection status
  mp_user_id?: string | null // Added for Mercado Pago user ID
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

interface LikedPack {
  pack_id: string
  pack: {
    id: string
    title: string
    price: number
    cover_image_url: string | null
    genre: string | null
    is_deleted: boolean
  } | null
}

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userPlan, setUserPlan] = useState<PlanType>("free")
  const [userPacks, setUserPacks] = useState<Pack[]>([])
  const [likedPacks, setLikedPacks] = useState<LikedPack[]>([])
  const [packStats, setPackStats] = useState<any[]>([])
  const [followerStats, setFollowerStats] = useState<any[]>([])
  const [packsLoading, setPacksLoading] = useState(false)
  const [likedPacksLoading, setLikedPacksLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)

  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [editForm, setEditForm] = useState({
    username: "",
    bio: "",
    avatar_url: "",
  })
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null) // Ref for the file input

  const [mpConnected, setMpConnected] = useState(false)
  const [mpUserId, setMpUserId] = useState<string | null>(null)
  const [mpConnecting, setMpConnecting] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadUserData()
  }, [])

  useEffect(() => {
    if (profile?.id) {
      loadUserPacks()
      loadStatistics()
      loadLikedPacks()
    }
  }, [profile?.id])

  useEffect(() => {
    if (!isEditing) return

    const checkUsername = async () => {
      const username = editForm.username.trim()

      // Validate format
      if (!username) {
        setUsernameAvailable(null)
        return
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setUsernameAvailable(false)
        return
      }

      if (username.length > 12) {
        setUsernameAvailable(false)
        return
      }

      // If username hasn't changed, it's available
      if (username === profile?.username) {
        setUsernameAvailable(true)
        return
      }

      setUsernameChecking(true)

      try {
        const { data, error } = await supabase.from("profiles").select("username").eq("username", username).single()

        setUsernameAvailable(!data)
      } catch (error) {
        setUsernameAvailable(true)
      } finally {
        setUsernameChecking(false)
      }
    }

    const timeoutId = setTimeout(checkUsername, 500)
    return () => clearTimeout(timeoutId)
  }, [editForm.username, isEditing])

  async function loadUserData() {
    try {
      setLoading(true)

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        router.push("/login")
        return
      }

      setUser(user)

      console.log("[v0] Loading profile for user:", user.id)

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*, mp_connected, mp_user_id")
        .eq("id", user.id)
        .single()

      console.log("[v0] Profile data received:", profileData)
      console.log("[v0] Profile error:", profileError)

      if (!profileError && profileData) {
        setProfile(profileData as Profile)

        const plan = (profileData.plan as PlanType) || "free"
        console.log("[v0] Setting user plan to:", plan)
        setUserPlan(plan)

        setMpConnected(profileData.mp_connected || false)
        setMpUserId(profileData.mp_user_id || null)

        setEditForm({
          username: profileData.username || "",
          bio: profileData.bio || "",
          avatar_url: profileData.avatar_url || "",
        })
      }
    } catch (error) {
      console.error("[v0] Error loading profile:", error)
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

  async function loadStatistics() {
    try {
      setStatsLoading(true)

      if (!profile?.id) {
        setStatsLoading(false)
        return
      }

      const { data: packs, error: packsError } = await supabase
        .from("packs")
        .select(`
          id,
          title,
          likes_count,
          downloads_count
        `)
        .eq("user_id", profile.id)

      if (!packsError && packs && packs.length > 0) {
        setPackStats(
          packs.map((pack: any) => ({
            name: pack.title.length > 20 ? pack.title.substring(0, 20) + "..." : pack.title,
            sales: pack.downloads_count || 0,
            likes: pack.likes_count || 0,
          })),
        )

        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const packIds = packs.map((p: any) => p.id)

        if (packIds.length > 0) {
          const { data: plays, error: playsError } = await supabase
            .from("pack_plays")
            .select("played_at, pack_id")
            .in("pack_id", packIds)
            .gte("played_at", thirtyDaysAgo.toISOString())
            .order("played_at", { ascending: true })

          if (!playsError && plays && plays.length > 0) {
            const playsByWeek: any = {}
            plays.forEach((play: any) => {
              const date = new Date(play.played_at)
              const weekStart = new Date(date)
              weekStart.setDate(date.getDay() === 0 ? date.getDate() - 6 : date.getDate() - (date.getDay() - 1)) // Adjust for Sunday being day 0
              const weekKey = weekStart.toLocaleDateString("es-AR", { month: "short", day: "numeric" })
              playsByWeek[weekKey] = (playsByWeek[weekKey] || 0) + 1
            })

            const playsArray = Object.entries(playsByWeek).map(([week, count]) => ({
              week,
              plays: count,
            }))

            setFollowerStats(playsArray)
          }
        }
      }
    } catch (error) {
      console.error("Error loading statistics:", error)
    } finally {
      setStatsLoading(false)
    }
  }

  async function loadLikedPacks() {
    try {
      setLikedPacksLoading(true)

      if (!profile?.id) {
        setLikedPacksLoading(false)
        return
      }

      const { data: likes, error } = await supabase
        .from("pack_likes")
        .select(`
          pack_id,
          packs:pack_id (
            id,
            title,
            price,
            cover_image_url,
            genre,
            is_deleted
          )
        `)
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })

      if (!error && likes) {
        setLikedPacks(likes as any)
      }
    } catch (error) {
      console.error("Error loading liked packs:", error)
    } finally {
      setLikedPacksLoading(false)
    }
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  async function handleSaveProfile() {
    try {
      setSaving(true)
      setMessage(null)

      // Validate username
      const username = editForm.username.trim()
      if (!username) {
        setMessage({ type: "error", text: "El username es requerido" })
        return
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setMessage({ type: "error", text: "Username solo puede contener letras, números y guiones bajos" })
        return
      }

      if (username.length > 12) {
        setMessage({ type: "error", text: "Username no puede tener más de 12 caracteres" })
        return
      }

      if (usernameAvailable === false) {
        setMessage({ type: "error", text: "Este username no está disponible" })
        return
      }

      let avatarUrl = editForm.avatar_url

      if (avatarFile) {
        const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

        if (avatarFile.size > MAX_FILE_SIZE) {
          setMessage({ type: "error", text: "La imagen no debe superar 5MB" })
          return
        }

        if (!avatarFile.type.startsWith("image/")) {
          setMessage({ type: "error", text: "Solo se permiten archivos de imagen" })
          return
        }

        try {
          if (profile?.avatar_url) {
            const fileName = profile.avatar_url.split("/").pop()
            if (fileName) {
              await supabase.storage
                .from("avatars")
                .remove([`avatars/${fileName}`])
                .catch(() => {
                  // Silently fail if file doesn't exist
                })
            }
          }

          const fileExt = avatarFile.name.split(".").pop()
          const fileName = `${user.id}-${Date.now()}.${fileExt}`
          const filePath = `avatars/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(filePath, avatarFile, { upsert: true })

          if (uploadError) {
            throw new Error(`Error al subir imagen: ${uploadError.message}`)
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from("avatars").getPublicUrl(filePath)

          avatarUrl = publicUrl
        } catch (error: any) {
          setMessage({ type: "error", text: error.message || "Error al subir la imagen" })
          return
        }
      }

      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update({
          username: username,
          bio: editForm.bio,
          avatar_url: avatarUrl,
        })
        .eq("id", user.id)

      if (error) throw error

      setMessage({ type: "success", text: "Perfil actualizado correctamente" })
      setIsEditing(false)
      setAvatarFile(null)
      setAvatarPreview(null)
      loadUserData()
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Error al actualizar el perfil" })
    } finally {
      setSaving(false)
    }
  }

  const handleConnectMercadoPago = async () => {
    try {
      setMpConnecting(true)

      console.log("[v0] Starting Mercado Pago connection...")

      const response = await fetch('/api/mercadopago/connect', {
        method: 'POST',
      })

      console.log("[v0] Response status:", response.status)

      const data = await response.json()

      console.log("[v0] Response data:", data)

      if (!response.ok) {
        toast({
          title: "Error de configuración",
          description: data.error || "No se pudo conectar con Mercado Pago",
          variant: "destructive",
        })
        return
      }

      if (data.oauthUrl) {
        console.log("[v0] Redirecting to:", data.oauthUrl)
        // Redirect to Mercado Pago OAuth
        window.location.href = data.oauthUrl
      } else {
        toast({
          title: "Error",
          description: "No se pudo generar la URL de conexión",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error connecting Mercado Pago:", error)
      toast({
        title: "Error",
        description: "Hubo un error al conectar con Mercado Pago. Por favor, intentá de nuevo.",
        variant: "destructive",
      })
    } finally {
      setMpConnecting(false)
    }
  }

  const handleDisconnectMercadoPago = async () => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          mp_access_token: null,
          mp_user_id: null,
          mp_connected: false,
        })
        .eq("id", user?.id)

      if (error) throw error

      setMpConnected(false)
      setMpUserId(null)

      toast({
        title: "Desconectado",
        description: "Tu cuenta de Mercado Pago fue desconectada exitosamente",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al desconectar Mercado Pago",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const mpSuccess = params.get('mp_success')
    const mpError = params.get('mp_error')

    if (mpSuccess === 'true') {
      toast({
        title: "Conectado exitosamente",
        description: "Tu cuenta de Mercado Pago fue conectada correctamente",
      })
      // Reload profile data
      loadUserData()
      // Clean URL
      window.history.replaceState({}, '', '/profile')
    }

    if (mpError) {
      const errorMessages: Record<string, string> = {
        denied: "Cancelaste la conexión con Mercado Pago",
        invalid: "Hubo un error en el proceso de autenticación",
        config: "Error de configuración del servidor",
        token: "No se pudo obtener el token de acceso",
        save: "No se pudo guardar la conexión",
        unknown: "Error desconocido al conectar",
      }

      toast({
        title: "Error al conectar",
        description: errorMessages[mpError] || "Hubo un error al conectar con Mercado Pago",
        variant: "destructive",
      })
      // Clean URL
      window.history.replaceState({}, '', '/profile')
    }
  }, [])

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

  if (loading) {
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
        {/* Profile Header - RESPONSIVE IMPROVEMENTS */}
        <Card className="p-6 md:p-8 rounded-3xl border-border mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            {/* Avatar */}
            <div className="flex-shrink-0 flex justify-center md:justify-start">
              {avatarPreview || profile?.avatar_url ? (
                <img
                  src={avatarPreview || profile?.avatar_url || "/placeholder.svg"}
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
              {!isEditing ? (
                <>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="w-full">
                      <h1 className="text-3xl md:text-4xl font-black text-foreground mb-2">
                        {profile?.username || "Usuario"}
                      </h1>
                      <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-2 md:gap-3 mb-3 flex-wrap">
                        <Badge variant="secondary" className="px-3 md:px-4 py-1 md:py-1.5 rounded-full font-bold uppercase text-xs">
                          {userPlan === "free" && "Plan Gratuito"}
                          {userPlan === "de_0_a_hit" && "De 0 a Hit"}
                          {userPlan === "studio_plus" && "Studio Plus"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            console.log("[v0] Reloading user data...")
                            loadUserData()
                          }}
                          className="h-7 px-3 rounded-full text-xs"
                        >
                          <Loader2 className="h-3 w-3 mr-1" />
                          Recargar
                        </Button>
                      </div>
                      <p className="text-sm md:text-base text-muted-foreground mb-3">
                        {profile?.bio || <span className="text-muted-foreground/60 italic">Sin descripción</span>}
                      </p>
                      <div className="flex flex-col sm:flex-row flex-wrap gap-2 md:gap-3 text-xs md:text-sm text-muted-foreground justify-center md:justify-start">
                        <div className="flex items-center gap-2 justify-center md:justify-start">
                          <MapPin className="h-4 w-4" />
                          <span>Argentina</span>
                        </div>
                        <div className="flex items-center gap-2 justify-center md:justify-start">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Miembro desde{" "}
                            {new Date(profile?.created_at || Date.now()).toLocaleDateString("es-AR", {
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs md:text-sm text-muted-foreground mt-2">{user?.email}</div>
                    </div>

                    <div className="flex flex-col gap-2 w-full md:w-auto">
                      <Button onClick={() => setIsEditing(true)} className="gap-2 rounded-full h-10 md:h-11 px-4 md:px-6 text-sm md:text-base w-full md:w-auto">
                        <Settings className="h-4 w-4" />
                        <span className="hidden sm:inline">Editar Perfil</span>
                        <span className="sm:hidden">Editar</span>
                      </Button>
                      <LogoutButton />
                    </div>
                  </div>

                  {/* Stats cards - RESPONSIVE */}
                  <div className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-6 pt-4 justify-center md:justify-start">
                    <div className="text-center md:text-left">
                      <div className="text-2xl md:text-3xl font-black text-foreground">
                        {profile?.packs_count || 0}
                      </div>
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
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-foreground">Editar Perfil</h2>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false)
                          setEditForm({
                            username: profile?.username || "",
                            bio: profile?.bio || "",
                            avatar_url: profile?.avatar_url || "",
                          })
                          setAvatarFile(null)
                          setAvatarPreview(null)
                          setMessage(null)
                        }}
                        className="rounded-full"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSaveProfile}
                        disabled={saving || usernameAvailable === false}
                        className="rounded-full gap-2"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4" />
                            Guardar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {message && (
                    <div
                      className={`p-4 rounded-xl font-medium ${
                        message.type === "success"
                          ? "bg-green-500/10 text-green-600 border border-green-500/20"
                          : "bg-red-500/10 text-red-600 border border-red-500/20"
                      }`}
                    >
                      {message.text}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-4">
                      <Label className="text-foreground font-semibold">Foto de Perfil</Label>

                      <div className="relative w-32 h-32">
                        {avatarPreview || profile?.avatar_url ? (
                          <img
                            src={avatarPreview || profile?.avatar_url || ""}
                            alt="Avatar preview"
                            className="w-full h-full rounded-full object-cover border-4 border-primary/20"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl font-black text-white">
                            {(profile?.username || user?.email || "US").substring(0, 2).toUpperCase()}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute bottom-0 right-0 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-2.5 shadow-lg transition-all"
                        >
                          <Camera className="h-5 w-5" />
                        </button>
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="gap-2 rounded-full bg-transparent"
                        >
                          <Upload className="h-4 w-4" />
                          Cambiar Foto
                        </Button>

                        {(profile?.avatar_url || avatarPreview) && avatarFile && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setAvatarFile(null)
                              setAvatarPreview(null)
                              if (fileInputRef.current) {
                                fileInputRef.current.value = ""
                              }
                            }}
                            className="gap-2 rounded-full text-red-600 hover:text-red-600 hover:bg-red-500/10"
                          >
                            <X className="h-4 w-4" />
                            Cancelar Cambio
                          </Button>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground">Formato: JPG, PNG. Tamaño máximo: 5MB</p>
                    </div>

                    {/* Username */}
                    <div>
                      <Label htmlFor="username" className="text-foreground font-semibold">
                        Username
                      </Label>
                      <div className="relative mt-2">
                        <Input
                          id="username"
                          value={editForm.username}
                          onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                          placeholder="tu_username"
                          maxLength={12}
                          className="rounded-xl h-12 pr-10"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {usernameChecking ? (
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          ) : usernameAvailable === true ? (
                            <Check className="h-5 w-5 text-green-600" />
                          ) : usernameAvailable === false ? (
                            <X className="h-5 w-5 text-red-600" />
                          ) : null}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Solo letras, números y guiones bajos. Máximo 12 caracteres.
                      </p>
                    </div>

                    {/* Bio */}
                    <div>
                      <Label htmlFor="bio" className="text-foreground font-semibold">
                        Bio
                      </Label>
                      <Textarea
                        id="bio"
                        value={editForm.bio}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                        placeholder="Contanos un poco sobre vos..."
                        className="rounded-xl min-h-[100px] mt-2"
                        maxLength={200}
                      />
                      <p className="text-xs text-muted-foreground mt-1">{editForm.bio.length}/200 caracteres</p>
                    </div>
                  </div>
                </div>
              )}
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
                <TabsTrigger
                  value="stats"
                  className="rounded-full px-3 md:px-6 py-2 md:py-3 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold whitespace-nowrap flex-shrink-0"
                >
                  Estadísticas
                </TabsTrigger>
                <TabsTrigger
                  value="likes"
                  className="rounded-full px-3 md:px-6 py-2 md:py-3 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold whitespace-nowrap flex-shrink-0"
                >
                  Me Gusta
                </TabsTrigger>
                <TabsTrigger
                  value="purchases"
                  className="rounded-full px-3 md:px-6 py-2 md:py-3 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold whitespace-nowrap flex-shrink-0"
                >
                  Compras
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="rounded-full px-3 md:px-6 py-2 md:py-3 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold whitespace-nowrap flex-shrink-0"
                >
                  <Settings className="h-4 w-4 mr-1 md:mr-2 inline" />
                  <span className="hidden sm:inline">Configuración</span>
                  <span className="sm:hidden">Config</span>
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

              <TabsContent value="stats" className="space-y-6">
                {statsLoading ? (
                  <Card className="p-12 rounded-3xl border-border">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                  </Card>
                ) : (
                  <>
                    {showUpgradeCTA && (
                      <Card className="p-8 rounded-3xl border-2 border-primary/30 bg-primary/5 mb-8">
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="text-2xl font-black text-foreground mb-2">Estadísticas Completas</h2>
                            <p className="text-muted-foreground">
                              Mejorá tu plan para acceder a gráficos interactivos y más métricas detalladas.
                            </p>
                          </div>
                          <Link href="/plans">
                            <Button className="gap-2 rounded-full h-12 px-8 bg-primary hover:bg-primary/90">
                              <Zap className="h-4 w-4" />
                              Mejorar Plan
                            </Button>
                          </Link>
                        </div>
                      </Card>
                    )}

                    {/* Statistics Cards - Free: 2 cards, De 0 a Hit+: 4 cards */}
                    <div
                      className={`grid grid-cols-1 ${canShow4Cards ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-2"} gap-4`}
                    >
                      <Card className="p-6 rounded-3xl border-border bg-gradient-to-br from-primary/10 to-primary/5">
                        <div className="flex items-center justify-between mb-2">
                          <DollarSign className="h-8 w-8 text-primary" />
                          <TrendingUp className="h-5 w-5 text-primary/60" />
                        </div>
                        <div className="text-3xl font-black text-foreground">
                          ${formatPrice(profile?.total_sales || 0)}
                        </div>
                        <div className="text-sm text-muted-foreground font-semibold mt-1">Total de Ventas</div>
                      </Card>

                      <Card className="p-6 rounded-3xl border-border bg-gradient-to-br from-secondary/10 to-secondary/5">
                        <div className="flex items-center justify-between mb-2">
                          <Play className="h-8 w-8 text-secondary" />
                          <TrendingUp className="h-5 w-5 text-secondary/60" />
                        </div>
                        <div className="text-3xl font-black text-foreground">{profile?.total_plays_count || 0}</div>
                        <div className="text-sm text-muted-foreground font-semibold mt-1">Reproducciones</div>
                      </Card>

                      {canShow4Cards && (
                        <>
                          <Card className="p-6 rounded-3xl border-border bg-gradient-to-br from-red-500/10 to-red-500/5">
                            <div className="flex items-center justify-between mb-2">
                              <Heart className="h-8 w-8 text-red-500" />
                              <TrendingUp className="h-5 w-5 text-red-500/60" />
                            </div>
                            <div className="text-3xl font-black text-foreground">
                              {profile?.total_likes_received || 0}
                            </div>
                            <div className="text-sm text-muted-foreground font-semibold mt-1">Likes Recibidos</div>
                          </Card>

                          <Card className="p-6 rounded-3xl border-border bg-gradient-to-br from-blue-500/10 to-blue-500/5">
                            <div className="flex items-center justify-between mb-2">
                              <Users className="h-8 w-8 text-blue-500" />
                              <TrendingUp className="h-5 w-5 text-blue-500/60" />
                            </div>
                            <div className="text-3xl font-black text-foreground">{profile?.followers_count || 0}</div>
                            <div className="text-sm text-muted-foreground font-semibold mt-1">Seguidores</div>
                          </Card>
                        </>
                      )}
                    </div>

                    {/* Graphs - Only for Studio Plus */}
                    {canShowGraphs && packStats.length > 0 && (
                      <>
                        <Card className="p-6 rounded-3xl border-border">
                          <div className="flex items-center gap-3 mb-6">
                            <Package className="h-6 w-6 text-primary" />
                            <h3 className="text-2xl font-black text-foreground">Ventas por Pack</h3>
                          </div>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={packStats}>
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
                                {packStats.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={`hsl(var(--primary))`} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </Card>

                        <Card className="p-6 rounded-3xl border-border">
                          <div className="flex items-center gap-3 mb-6">
                            <Heart className="h-6 w-6 text-red-500" />
                            <h3 className="text-2xl font-black text-foreground">Reproducciones</h3>
                          </div>
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={followerStats}>
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
                                stroke="hsl(var(--secondary))"
                                strokeWidth={3}
                                dot={{ fill: "hsl(var(--secondary))", r: 6 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </Card>
                      </>
                    )}

                    {packStats.length === 0 && followerStats.length === 0 && (
                      <Card className="p-12 text-center rounded-3xl border-border">
                        <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-xl font-bold text-foreground mb-2">
                          Todavía no hay estadísticas disponibles
                        </h3>
                        <p className="text-muted-foreground">Subí packs y compartí tu perfil para ver tus métricas.</p>
                      </Card>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="likes">
                {likedPacksLoading ? (
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
                ) : likedPacks.length > 0 ? (
                  (() => {
                    const existingPacks = likedPacks.filter(
                      (like) => like.pack !== null && like.pack !== undefined && !like.pack.is_deleted,
                    )

                    return existingPacks.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {existingPacks.map((like) => {
                          const pack = like.pack
                          if (!pack) return null

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
                                    <Badge className="absolute top-3 right-3 bg-secondary text-secondary-foreground font-bold">
                                      {pack.genre}
                                    </Badge>
                                  )}
                                </div>
                                <div className="p-5 space-y-3">
                                  <h3 className="font-bold text-lg text-foreground line-clamp-2">{pack.title}</h3>
                                  <div className="flex items-center justify-between">
                                    <div>
                                      {pack.price === 0 ? (
                                        <div className="text-2xl font-black text-green-600">GRATIS</div>
                                      ) : (
                                        <>
                                          <div className="text-2xl font-black text-foreground">
                                            ${formatPrice(pack.price)}
                                          </div>
                                          <div className="text-xs text-muted-foreground">ARS</div>
                                        </>
                                      )}
                                    </div>
                                    <Button variant="outline" className="rounded-full bg-transparent">
                                      Ver Pack
                                    </Button>
                                  </div>
                                </div>
                              </Link>
                            </Card>
                          )
                        })}
                      </div>
                    ) : (
                      <Card className="p-12 text-center rounded-3xl border-2 border-dashed border-border">
                        <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-xl font-bold text-foreground mb-2">
                          Los packs que marcaste se han eliminado
                        </h3>
                        <p className="text-muted-foreground">
                          Algunos packs ya no están disponibles, pero podés explorar más
                        </p>
                      </Card>
                    )
                  })()
                ) : (
                  <Card className="p-12 text-center rounded-3xl border-2 border-dashed border-border">
                    <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-bold text-foreground mb-2">Aún no tenés packs guardados en Me gusta</h3>
                    <p className="text-muted-foreground">Explorá packs y guardá tus favoritos para verlos acá</p>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="purchases">
                <ProfilePurchasesTab profile={profile} />
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <Card className="p-8 rounded-3xl border-border">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-[#009EE3]/10 flex items-center justify-center">
                      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="#009EE3">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-foreground">Mercado Pago</h2>
                      <p className="text-sm text-muted-foreground">
                        Configurá tu método de pago para recibir tus ganancias
                      </p>
                    </div>
                  </div>

                  {mpConnected ? (
                    <div className="space-y-6">
                      <div className="p-6 rounded-2xl bg-green-500/10 border-2 border-green-500/20">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                            <Check className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-green-600 text-lg mb-1">
                              Cuenta conectada exitosamente
                            </h3>
                            <p className="text-green-600/80 text-sm mb-3">
                              Ya podés vender packs y recibir pagos automáticamente
                            </p>
                            {mpUserId && (
                              <p className="text-xs text-muted-foreground font-mono bg-background/50 px-3 py-2 rounded-lg inline-block">
                                ID de cuenta: {mpUserId}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-bold text-foreground">¿Cómo funcionan los pagos?</h3>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs font-bold text-primary">1</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Cuando alguien compra tu pack, el pago se procesa automáticamente con Mercado Pago
                            </p>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs font-bold text-primary">2</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              ARSOUND retiene la comisión según tu plan ({(PLAN_FEATURES[userPlan].commission * 100).toFixed(0)}%)
                            </p>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs font-bold text-primary">3</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Recibís tu parte directamente en tu cuenta de Mercado Pago
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-border">
                        <Button
                          variant="outline"
                          onClick={handleDisconnectMercadoPago}
                          className="gap-2 rounded-full text-red-600 hover:text-red-600 hover:bg-red-500/10 border-red-500/20"
                        >
                          <X className="h-4 w-4" />
                          Desconectar cuenta
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="p-6 rounded-2xl bg-amber-500/10 border-2 border-amber-500/20">
                        <div className="flex items-start gap-4">
                          <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
                          <div>
                            <h3 className="font-bold text-amber-600 text-lg mb-1">
                              Cuenta no conectada
                            </h3>
                            <p className="text-amber-600/80 text-sm">
                              Necesitás conectar tu cuenta de Mercado Pago para vender packs pagos y recibir tus ganancias.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-bold text-foreground">Beneficios de conectar tu cuenta:</h3>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-muted-foreground">
                              <span className="font-semibold text-foreground">Pagos automáticos:</span> Recibí tu dinero directamente en tu cuenta
                            </p>
                          </div>
                          <div className="flex items-start gap-3">
                            <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-muted-foreground">
                              <span className="font-semibold text-foreground">Sin intermediarios:</span> El dinero va directo de la compra a tu cuenta
                            </p>
                          </div>
                          <div className="flex items-start gap-3">
                            <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-muted-foreground">
                              <span className="font-semibold text-foreground">Seguro y confiable:</span> Mercado Pago es la plataforma de pagos más usada en Argentina
                            </p>
                          </div>
                          <div className="flex items-start gap-3">
                            <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-muted-foreground">
                              <span className="font-semibold text-foreground">Configuración simple:</span> Solo tomará unos minutos
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4">
                        <Button
                          onClick={handleConnectMercadoPago}
                          disabled={mpConnecting}
                          className="w-full h-14 rounded-full font-bold text-lg bg-[#009EE3] hover:bg-[#0086c3] gap-3"
                        >
                          {mpConnecting ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              Conectando...
                            </>
                          ) : (
                            <>
                              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                              </svg>
                              Conectar con Mercado Pago
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-center text-muted-foreground mt-3">
                          Serás redirigido a Mercado Pago para autorizar la conexión de forma segura
                        </p>
                      </div>
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - RESPONSIVE */}
          <div className="space-y-4 md:space-y-6">
            {profile && <ProfileLimitsCard userId={profile.id} userPlan={userPlan} />}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
