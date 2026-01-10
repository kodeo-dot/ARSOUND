"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PackComments } from "@/components/pack-comments"
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
} from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase/client"
import { useAudioPlayer } from "@/hooks/use-audio-player"
import { useParams, useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { formatGenreDisplay } from "@/lib/genres"

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
              avatar_url
            )
          `)
          .eq("id", packId)
          .single()

        if (error) throw error
        console.log("[v0] Pack data loaded:", data)
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

    setIsLiking(true)

    try {
      if (isLiked) {
        const { error } = await supabase.from("pack_likes").delete().eq("user_id", user.id).eq("pack_id", packId)

        if (!error) {
          setIsLiked(false)
          setLikesCount((prev) => Math.max(0, prev - 1))
        }
      } else {
        const { error } = await supabase.from("pack_likes").insert({
          user_id: user.id,
          pack_id: packId,
        })

        if (!error) {
          setIsLiked(true)
          setLikesCount((prev) => prev + 1)
        }
      }
    } catch (error) {
      console.error("Error toggling like:", error)
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
      let finalPrice = pack.price
      let appliedDiscount = 0
      let discountReason = ""

      // Ensure discount_percent is a valid number
      const packDiscountPercent = Number(pack.discount_percent) || 0
      if (pack.price === 0 || pack.free === true) {
        setAppliedDiscount(0)
        setDiscountReason("")
        return
      }

      if (activeOffer) {
        const offerAmount = Number(activeOffer.discount_percent) || 0 // en realidad es el monto del descuento
        appliedDiscount = offerAmount
        finalPrice = pack.price - appliedDiscount
        discountReason = `Descuento activo del ${formatPrice(offerAmount)}%`
      } else if (pack.has_discount && packDiscountPercent > 0 && packDiscountPercent <= 100) {
        appliedDiscount = (pack.price * packDiscountPercent) / 100
        finalPrice = pack.price - appliedDiscount
        discountReason = `${packDiscountPercent}% de descuento`
      }

      setAppliedDiscount(appliedDiscount)
      setDiscountReason(discountReason)
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
                <div className="text-2xl font-black text-foreground">WAV</div>
                <div className="text-xs text-muted-foreground font-medium">Formato</div>
              </Card>
              <Card className="p-5 text-center rounded-xl border-border">
                <Download className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <div className="text-2xl font-black text-foreground">{pack.downloads_count || 0}</div>
                <div className="text-xs text-muted-foreground font-medium">Descargas</div>
              </Card>
            </div>
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
                    {likesCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {likesCount > 99 ? "99+" : likesCount}
                      </span>
                    )}
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

              {discountReason && (pack.has_discount || activeOffer) && (
                <div className="mb-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <p className="text-sm font-semibold text-orange-600 text-center">{discountReason}</p>
                </div>
              )}

              {isOwner ? (
                <Button className="w-full gap-2 rounded-full h-12 text-base font-bold" onClick={handleEdit}>
                  <Edit className="h-5 w-5" />
                  Editar Pack
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
              <div className="space-y-3">
                <h2 className="text-2xl font-black text-foreground">Descripción</h2>
                <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {pack.description}
                </p>
              </div>
            )}

            {/* License Information Section */}
            <Card className="p-6 rounded-2xl border-border bg-card">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground mb-2">Licencia de Uso</h3>
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                    Al comprar o descargar este pack, obtenés una licencia global que te permite usar los samples en tus
                    producciones comerciales y no comerciales. Los samples no pueden ser redistribuidos ni registrados
                    en Content ID.
                  </p>
                  <Link href="/license" target="_blank">
                    <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                      <FileText className="h-4 w-4" />
                      Ver Licencia Completa
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>

            {pack.tags && pack.tags.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-muted-foreground uppercase">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {pack.tags.map((tag: string, index: number) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="px-4 py-1.5 rounded-full border-border hover:bg-accent cursor-pointer text-sm"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-4xl mx-auto mt-16">
          <PackComments packId={packId} packOwnerId={pack.user_id} isAuthenticated={!!user} currentUserId={user?.id} />
        </div>
      </main>

      <Footer />
    </div>
  )
}
