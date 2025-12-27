"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Settings, Check, X, Loader2, Upload, Camera, AlertCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { PLAN_FEATURES } from "@/lib/plans"
import type { PlanType } from "@/lib/plans"
import { useAuth } from "@/components/auth-provider"

interface Profile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  plan: PlanType
  mp_connected?: boolean
  mp_user_id?: string | null
}

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [mpConnected, setMpConnected] = useState(false)
  const [mpUserId, setMpUserId] = useState<string | null>(null)
  const [mpConnecting, setMpConnecting] = useState(false)

  console.log("[v0] Settings - user:", user?.id, "authLoading:", authLoading, "loading:", loading)

  useEffect(() => {
    if (!authLoading && !user) {
      console.log("[v0] Settings - No user, redirecting to login")
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && !authLoading) {
      console.log("[v0] Settings - Loading data for user:", user.id)
      loadData()
    }
  }, [user, authLoading])

  useEffect(() => {
    const checkUsername = async () => {
      const username = editForm.username.trim()

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

      if (username === profile?.username) {
        setUsernameAvailable(true)
        return
      }

      setUsernameChecking(true)

      try {
        const { data } = await supabase.from("profiles").select("username").eq("username", username).single()
        setUsernameAvailable(!data)
      } catch {
        setUsernameAvailable(true)
      } finally {
        setUsernameChecking(false)
      }
    }

    const timeoutId = setTimeout(checkUsername, 500)
    return () => clearTimeout(timeoutId)
  }, [editForm.username, profile?.username, supabase])

  async function loadData() {
    try {
      setLoading(true)

      if (!user) {
        return
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*, mp_connected, mp_user_id")
        .eq("id", user.id)
        .single()

      if (!profileError && profileData) {
        console.log("[v0] Settings - Profile loaded:", profileData)
        setProfile(profileData as Profile)
        setMpConnected(profileData.mp_connected || false)
        setMpUserId(profileData.mp_user_id || null)

        setEditForm({
          username: profileData.username || "",
          bio: profileData.bio || "",
          avatar_url: profileData.avatar_url || "",
        })
      }
    } catch (error) {
      console.error("[v0] Settings - Error loading data:", error)
    } finally {
      setLoading(false)
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
        const MAX_FILE_SIZE = 5 * 1024 * 1024

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
                .catch(() => {})
            }
          }

          const fileExt = avatarFile.name.split(".").pop()
          const fileName = `${user!.id}-${Date.now()}.${fileExt}`
          const filePath = `avatars/${fileName}`

          const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, avatarFile, {
            upsert: true,
          })

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

      const { error } = await supabase
        .from("profiles")
        .update({
          username: username,
          bio: editForm.bio,
          avatar_url: avatarUrl,
        })
        .eq("id", user!.id)

      if (error) throw error

      setMessage({ type: "success", text: "Perfil actualizado correctamente" })
      setAvatarFile(null)
      setAvatarPreview(null)
      loadData()
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Error al actualizar el perfil" })
    } finally {
      setSaving(false)
    }
  }

  const handleConnectMercadoPago = async () => {
    try {
      setMpConnecting(true)

      const response = await fetch("/api/mercadopago/connect", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: "Error de configuración",
          description: data.error || "No se pudo conectar con Mercado Pago",
          variant: "destructive",
        })
        return
      }

      if (data.oauthUrl) {
        window.location.href = data.oauthUrl
      } else {
        toast({
          title: "Error",
          description: "No se pudo generar la URL de conexión",
          variant: "destructive",
        })
      }
    } catch (error) {
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
    const mpSuccess = params.get("mp_success")
    const mpError = params.get("mp_error")

    if (mpSuccess === "true") {
      toast({
        title: "Conectado exitosamente",
        description: "Tu cuenta de Mercado Pago fue conectada correctamente",
      })
      window.history.replaceState({}, "", "/settings")
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
      window.history.replaceState({}, "", "/settings")
    }
  }, [])

  function getAvatarInitials() {
    const username = profile?.username || user?.email || "US"
    return username.substring(0, 2).toUpperCase()
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <Card className="p-8 rounded-3xl border-border animate-pulse">
            <div className="space-y-6">
              <div className="h-10 bg-muted rounded-lg w-48" />
              <div className="h-32 bg-muted rounded-full w-32" />
              <div className="space-y-4">
                <div className="h-12 bg-muted rounded-xl" />
                <div className="h-12 bg-muted rounded-xl" />
                <div className="h-24 bg-muted rounded-xl" />
              </div>
            </div>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
              <Settings className="h-6 w-6 text-foreground" />
            </div>
            <h1 className="text-4xl font-black text-foreground">Configuración</h1>
          </div>
          <p className="text-muted-foreground">Administrá tu cuenta y preferencias</p>
        </div>

        <Card className="p-8 rounded-3xl border-border mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-foreground">Editar Perfil</h2>
            <Button onClick={handleSaveProfile} disabled={saving} className="gap-2 rounded-full h-11 px-6">
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

          {message && (
            <div
              className={`p-4 rounded-xl font-medium mb-6 ${
                message.type === "success"
                  ? "bg-muted text-foreground border border-border"
                  : "bg-destructive/10 text-destructive border border-destructive/20"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="space-y-6">
            {/* Avatar */}
            <div className="space-y-4">
              <Label className="text-foreground font-semibold">Foto de Perfil</Label>

              <div className="relative w-32 h-32">
                {avatarPreview || profile?.avatar_url ? (
                  <img
                    src={avatarPreview || profile?.avatar_url || ""}
                    alt="Avatar preview"
                    className="w-full h-full rounded-full object-cover border-4 border-border"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-muted flex items-center justify-center text-4xl font-black text-foreground">
                    {getAvatarInitials()}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-foreground hover:bg-foreground/90 text-background rounded-full p-2.5 shadow-lg transition-all"
                >
                  <Camera className="h-5 w-5" />
                </button>
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />

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
                    className="gap-2 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
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
                    <Check className="h-5 w-5 text-foreground" />
                  ) : usernameAvailable === false ? (
                    <X className="h-5 w-5 text-destructive" />
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
        </Card>

        <Card className="p-8 rounded-3xl border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor" className="text-foreground">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground">Mercado Pago</h2>
              <p className="text-sm text-muted-foreground">Configurá tu método de pago para recibir tus ganancias</p>
            </div>
          </div>

          {mpConnected ? (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-muted border-2 border-border">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-foreground flex items-center justify-center flex-shrink-0">
                    <Check className="h-6 w-6 text-background" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground text-lg mb-1">Cuenta conectada exitosamente</h3>
                    <p className="text-muted-foreground text-sm mb-3">
                      Ya podés vender packs y recibir pagos automáticamente
                    </p>
                    {mpUserId && (
                      <p className="text-xs text-muted-foreground font-mono bg-background px-3 py-2 rounded-lg inline-block">
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
                      ARSOUND retiene la comisión según tu plan (
                      {profile?.plan ? (PLAN_FEATURES[profile.plan].commission * 100).toFixed(0) : "0"}%)
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
                  className="gap-2 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 bg-transparent"
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
                    <h3 className="font-bold text-amber-600 text-lg mb-1">Cuenta no conectada</h3>
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
                      <span className="font-semibold text-foreground">Pagos automáticos:</span> Recibí tu dinero
                      directamente en tu cuenta
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">Sin intermediarios:</span> El dinero va directo de
                      la compra a tu cuenta
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">Seguro y confiable:</span> Mercado Pago es la
                      plataforma de pagos más usada en Argentina
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">Configuración simple:</span> Solo tomará unos
                      minutos
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
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                      </svg>
                      Conectar con Mercado Pago
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </main>

      <Footer />
    </div>
  )
}
