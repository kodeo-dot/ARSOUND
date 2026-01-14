"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Play,
  Heart,
  Download,
  Share2,
  Clock,
  Disc,
  Loader2,
  ShoppingCart,
  Edit,
  Check,
  Pause,
  FileText,
  Monitor,
} from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase/client"
import { useAudioPlayer } from "@/hooks/use-audio-player"
import { useParams, useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { formatGenreDisplay } from "@/lib/genres"
import { PRODUCT_TYPES } from "@/lib/constants/product-types"

export default function PackDetailPage() {
  const params = useParams()
  const router = useRouter()
  const packId = params.id as string

  const [isLiked, setIsLiked] = useState(false)
  const [pack, setPack] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [likesCount, setLikesCount] = useState(0)
  const [activeOffer, setActiveOffer] = useState<any>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [hasPurchasedBefore, setHasPurchasedBefore] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [isShareCopied, setIsShareCopied] = useState(false)
  const [appliedDiscount, setAppliedDiscount] = useState(0)
  const [discountReason, setDiscountReason] = useState("")

  const { playPack, isPlaying, currentPack } = useAudioPlayer()
  const supabase = createBrowserClient()

  const isCurrentlyPlaying = currentPack?.id === packId && isPlaying

  useEffect(() => {
    const fetchPack = async () => {
      try {
        const { data, error } = await supabase
          .from("packs")
          .select(`
            *,
            profiles (
              username,
              display_name,
              avatar_url,
              mp_user_id
            )
          `)
          .eq("id", packId)
          .single()

        if (error) throw error
        console.log("[v0] Pack data loaded:", data)
        console.log("[v0] Initial likes_count:", data.likes_count)
        setPack(data)
        setLikesCount(data.likes_count || 0)

        const { data: offerData } = await supabase.rpc("get_active_offer", { p_pack_id: packId }).maybeSingle()

        if (offerData) {
          setActiveOffer(offerData)
        }
      } catch (error) {
        console.error("Error fetching pack:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPack()
  }, [packId, supabase])

  useEffect(() => {
    const checkUserAndLike = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      setUser(authUser)

      if (authUser && packId) {
        const { data } = await supabase
          .from("pack_likes")
          .select("id")
          .eq("user_id", authUser.id)
          .eq("pack_id", packId)
          .maybeSingle()

        setIsLiked(!!data)

        if (pack?.user_id) {
          setIsOwner(authUser.id === pack.user_id)

          const { data: followData } = await supabase
            .from("followers")
            .select("id")
            .eq("follower_id", authUser.id)
            .eq("following_id", pack.user_id)
            .maybeSingle()

          setIsFollowing(!!followData)
        }

        const { data: purchaseData } = await supabase
          .from("purchases")
          .select("id")
          .eq("buyer_id", authUser.id)
          .eq("pack_id", packId)
          .eq("status", "completed")
          .limit(1)
          .maybeSingle()

        setHasPurchasedBefore(!!purchaseData)
      }
    }

    checkUserAndLike()
  }, [packId, pack?.user_id, supabase])

  const handlePlay = () => {
    if (pack?.demo_audio_url) {
      playPack({
        id: pack.id,
        title: pack.title,
        producer: pack.profiles?.username || "Usuario",
        image: pack.cover_image_url || "/placeholder.svg",
        audioUrl: pack.demo_audio_url,
      })
    }
  }

  const handlePurchase = async () => {
    setIsPurchasing(true)

    if (pack?.price === 0 || pack?.free === true) {
      try {
        const response = await fetch(`/api/packs/${packId}/download`)
        if (!response.ok) {
          const error = await response.json()
          toast({
            title: "Error al descargar",
            description: error.error || "Error al descargar el pack",
            variant: "destructive",
          })
          setIsPurchasing(false)
          return
        }
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${pack.title.replace(/[^a-zA-Z0-9]/g, "_")}.zip`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Descarga iniciada",
          description: "El pack se está descargando",
        })
      } catch (error) {
        console.error("Download error:", error)
        toast({
          title: "Error",
          description: "Error al descargar el pack",
          variant: "destructive",
        })
      } finally {
        setIsPurchasing(false)
      }
    } else {
      if (user && pack?.profiles?.mp_user_id) {
        const { data: buyerProfile } = await supabase.from("profiles").select("mp_user_id").eq("id", user.id).single()

        if (buyerProfile?.mp_user_id && buyerProfile.mp_user_id === pack.profiles.mp_user_id) {
          toast({
            title: "No podés comprar este pack",
            description:
              "Detectamos que estás usando la misma cuenta de MercadoPago que el vendedor. No podés comprarte a vos mismo.",
            variant: "destructive",
          })
          setIsPurchasing(false)
          return
        }
      }

      window.location.href = `/pack/${packId}/checkout`
    }
  }

  const handleEdit = () => {
    router.push(`/pack/${packId}/edit`)
  }

  const handleLike = async () => {
    if (!user) {
      alert("Iniciá sesión para dar like a este pack")
      return
    }

    console.log("[v0] handleLike called - isLiked:", isLiked, "current count:", likesCount)
    setIsLiking(true)

    try {
      if (isLiked) {
        console.log("[v0] Removing like...")
        const { error } = await supabase.from("pack_likes").delete().eq("user_id", user.id).eq("pack_id", packId)

        if (!error) {
          console.log("[v0] Like removed successfully")
          setIsLiked(false)
          setLikesCount((prev) => {
            const newCount = Math.max(0, prev - 1)
            console.log("[v0] Updated likes count:", prev, "->", newCount)
            return newCount
          })
        } else {
          console.error("[v0] Error removing like:", error)
        }
      } else {
        console.log("[v0] Adding like...")
        const { error } = await supabase.from("pack_likes").insert({
          user_id: user.id,
          pack_id: packId,
        })

        if (!error) {
          console.log("[v0] Like added successfully")
          setIsLiked(true)
          setLikesCount((prev) => {
            const newCount = prev + 1
            console.log("[v0] Updated likes count:", prev, "->", newCount)
            return newCount
          })
        } else {
          console.error("[v0] Error adding like:", error)
        }
      }

      const { data: packData, error: packError } = await supabase
        .from("packs")
        .select("likes_count")
        .eq("id", packId)
        .single()

      if (!packError && packData) {
        console.log("[v0] Real likes_count from DB:", packData.likes_count)
        setLikesCount(packData.likes_count || 0)
      }
    } catch (error) {
      console.error("[v0] Error toggling like:", error)
    } finally {
      setIsLiking(false)
    }
  }

  const handleSharePack = async () => {
    if (!pack) return

    const baseUrl = window.location.origin
    const shareUrl = `${baseUrl}/pack/${pack.id}`

    try {
      await navigator.clipboard.writeText(shareUrl)
      setIsShareCopied(true)
      setTimeout(() => setIsShareCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy link:", err)
    }
  }

  const formatPrice = (price: number) => {
    if (price === 0) {
      return "GRATIS"
    }
    return new Intl.NumberFormat("es-AR", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  useEffect(() => {
    const checkDiscounts = () => {
      if (pack?.price === 0 || pack?.free === true) {
        setAppliedDiscount(0)
        setDiscountReason("")
        return
      }

      if (pack?.has_discount && pack?.discount_percent && !pack?.discount_requires_code) {
        const discountAmount = Math.round((pack.price * pack.discount_percent) / 100)
        setAppliedDiscount(discountAmount)
        setDiscountReason(`${pack.discount_percent}% OFF - Oferta especial`)
      } else if (activeOffer) {
        const offerAmount = Number(activeOffer.discount_percent) || 0
        const discountAmount = Math.round((pack.price * offerAmount) / 100)
        setAppliedDiscount(discountAmount)
        setDiscountReason(`${offerAmount}% OFF - Oferta temporal`)
      } else {
        setAppliedDiscount(0)
        setDiscountReason("")
      }
    }

    if (pack) {
      checkDiscounts()
    }
  }, [pack, activeOffer, user, isFollowing, hasPurchasedBefore])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!pack) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">Pack no encontrado</h1>
            <Link href="/">
              <Button>Volver al inicio</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const productTypeLabel =
    pack.product_type && pack.product_type !== "sample_pack"
      ? PRODUCT_TYPES[pack.product_type as keyof typeof PRODUCT_TYPES]?.label
      : null

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-7xl mx-auto">
          <div className="space-y-6">
            <Card className="overflow-hidden rounded-2xl border-border">
              <div className="relative aspect-square bg-muted group overflow-hidden">
                <img
                  src={pack.cover_image_url || "/placeholder.svg?height=800&width=800"}
                  alt={pack.title}
                  className="w-full h-full object-cover"
                />

                {pack.genre && (
                  <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground font-bold px-4 py-2 text-sm rounded-full">
                    {formatGenreDisplay(pack.genre, pack.subgenre)}
                  </Badge>
                )}

                {productTypeLabel && (
                  <Badge className="absolute top-4 right-4 bg-accent text-white font-bold px-4 py-2 text-sm rounded-full">
                    {productTypeLabel}
                  </Badge>
                )}
              </div>
            </Card>

            {pack.demo_audio_url && (
              <Card className="p-6 rounded-2xl border-border bg-card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Demo Preview</h3>
                    <p className="text-sm text-muted-foreground">{pack.title} - Demo</p>
                  </div>
                  <Button size="lg" className="rounded-full h-14 w-14 p-0" onClick={handlePlay}>
                    {isCurrentlyPlaying ? (
                      <Pause className="h-6 w-6" fill="currentColor" />
                    ) : (
                      <Play className="h-6 w-6 ml-1" fill="currentColor" />
                    )}
                  </Button>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-3 gap-4">
              {pack.bpm && (
                <Card className="p-5 text-center rounded-xl border-border">
                  <Clock className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-2xl font-black text-foreground">{pack.bpm}</div>
                  <div className="text-xs text-muted-foreground font-medium">BPM</div>
                </Card>
              )}
              <Card className="p-5 text-center rounded-xl border-border">
                <Disc className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <div className="text-2xl font-black text-foreground">
                  {pack.product_type === "midi_pack" ? "MIDI" : "WAV"}
                </div>
                <div className="text-xs text-muted-foreground font-medium">Formato</div>
              </Card>
              <Card className="p-5 text-center rounded-xl border-border">
                <Download className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <div className="text-2xl font-black text-foreground">{pack.downloads_count || 0}</div>
                <div className="text-xs text-muted-foreground font-medium">Descargas</div>
              </Card>
            </div>

            {pack.daw_compatibility && pack.daw_compatibility.length > 0 && (
              <Card className="p-6 rounded-2xl border-border bg-card">
                <div className="flex items-center gap-2 mb-4">
                  <Monitor className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-foreground">Compatibilidad DAW</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {pack.daw_compatibility.map((daw: string) => (
                    <Badge key={daw} variant="outline" className="px-3 py-1">
                      {daw}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {pack.product_type === "preset" && pack.plugin && (
              <Card className="p-6 rounded-2xl border-border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Disc className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-foreground">Plugin / Instrumento</h3>
                </div>
                <p className="text-foreground text-lg font-semibold">{pack.plugin}</p>
              </Card>
            )}
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground text-balance leading-tight">
                {pack.title}
              </h1>
              <Link
                href={`/profile/${pack.profiles?.username}`}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity w-fit"
              >
                {pack.profiles?.avatar_url ? (
                  <img
                    src={pack.profiles.avatar_url || "/placeholder.svg"}
                    alt={pack.profiles.username || ""}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
                    {(pack.profiles?.username || "U")[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Creado por</div>
                  <div className="text-base font-bold text-foreground">{pack.profiles?.username || "Usuario"}</div>
                </div>
              </Link>
            </div>

            <Card className="p-8 rounded-2xl border-border">
              <div className="flex items-start justify-between mb-6">
                <div>
                  {pack.price === 0 || pack.free === true ? (
                    <div className="text-5xl font-black text-green-600">GRATIS</div>
                  ) : appliedDiscount > 0 ? (
                    <div>
                      <div className="text-xl font-bold text-muted-foreground line-through">
                        ${formatPrice(pack.price)}
                      </div>
                      <div className="text-5xl font-black text-foreground">
                        ${formatPrice(pack.price - appliedDiscount)}
                      </div>
                      <div className="text-sm text-orange-500 font-semibold mt-2">
                        Ahorrás ${formatPrice(appliedDiscount)} ARS
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-5xl font-black text-foreground">${formatPrice(pack.price)}</div>
                      <div className="text-sm text-muted-foreground font-medium mt-1">ARS</div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full h-11 w-11 bg-transparent relative"
                    onClick={handleLike}
                    disabled={isLiking}
                  >
                    <Heart
                      className={`h-5 w-5 transition-all ${isLiked ? "fill-red-500 text-red-500 scale-110" : ""} ${isLiking ? "animate-pulse" : ""}`}
                    />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full h-11 w-11 bg-transparent"
                    onClick={handleSharePack}
                    disabled={!pack}
                  >
                    {isShareCopied ? <Check className="h-5 w-5 text-green-500" /> : <Share2 className="h-5 w-5" />}
                  </Button>
                </div>
              </div>

              {discountReason && appliedDiscount > 0 && (
                <div className="mb-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <p className="text-sm font-semibold text-orange-600 text-center">{discountReason}</p>
                </div>
              )}

              {isOwner ? (
                <Button className="w-full gap-2 rounded-full h-12 text-base font-bold" onClick={handleEdit}>
                  <Edit className="h-5 w-5" />
                  Editar Pack
                </Button>
              ) : hasPurchasedBefore ? (
                <Button
                  className="w-full gap-2 rounded-full h-12 text-base font-bold bg-green-600 hover:bg-green-700"
                  disabled
                >
                  <Check className="h-5 w-5" />
                  Ya compraste este pack
                </Button>
              ) : (
                <Button
                  className="w-full gap-2 rounded-full h-12 text-base font-bold"
                  onClick={handlePurchase}
                  disabled={isPurchasing}
                >
                  {isPurchasing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Procesando...
                    </>
                  ) : pack.price === 0 || pack.free === true ? (
                    <>
                      <Download className="h-5 w-5" />
                      Descargar Gratis
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5" />
                      Comprar Ahora
                    </>
                  )}
                </Button>
              )}
            </Card>

            {pack.description && (
              <Card className="p-8 rounded-2xl border-border bg-card">
                <h2 className="text-2xl font-black text-foreground mb-4">Descripción</h2>
                <p className="text-foreground whitespace-pre-line leading-relaxed">{pack.description}</p>
              </Card>
            )}

            {pack.tags && pack.tags.length > 0 && (
              <Card className="p-8 rounded-2xl border-border bg-card">
                <h2 className="text-2xl font-black text-foreground mb-4">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {pack.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-sm px-4 py-2">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            <Card className="p-8 rounded-2xl border-border bg-card">
              <h2 className="text-2xl font-black text-foreground mb-4 flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                Licencia de Uso
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Al comprar este pack, aceptás los términos de uso de ARSOUND. Podés usar estos samples en tus
                producciones comerciales, pero no podés redistribuirlos o revenderlos como parte de otros sample packs.
              </p>
              <Link href="/license" target="_blank">
                <Button variant="outline" size="sm" className="rounded-full bg-transparent">
                  Ver licencia completa
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
