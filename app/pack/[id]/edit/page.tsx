"use client"

import type React from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Upload, ImageIcon, Loader2, Trash2, Save, Percent } from "lucide-react"
import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter, useParams } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { PLAN_FEATURES, type PlanType } from "@/lib/plans"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GENRES, getSubgenres } from "@/lib/genres"

const ALL_PRICE_OPTIONS = Array.from({ length: 14 }, (_, i) => i * 5000)
const ALL_DISCOUNT_OPTIONS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

export default function EditPackPage() {
  const params = useParams()
  const router = useRouter()
  const packId = params.id as string
  const supabase = createBrowserClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [pack, setPack] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [userPlan, setUserPlan] = useState<PlanType>("free")

  const [price, setPrice] = useState("")
  const [discountPercent, setDiscountPercent] = useState("")
  const [discountCode, setDiscountCode] = useState("")
  const [discountRequiresCode, setDiscountRequiresCode] = useState(true)
  const [discountType, setDiscountType] = useState("all")
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [genre, setGenre] = useState("")
  const [subgenre, setSubgenre] = useState("")

  const MAX_PRICE = PLAN_FEATURES[userPlan].maxPrice || 65000
  const MAX_DISCOUNT = PLAN_FEATURES[userPlan]?.maxDiscountPercent || 50

  const PRICE_OPTIONS = ALL_PRICE_OPTIONS.filter((price) => price <= MAX_PRICE)
  const DISCOUNT_OPTIONS = ALL_DISCOUNT_OPTIONS.filter((discount) => discount <= MAX_DISCOUNT)

  useEffect(() => {
    checkAuthAndLoadPack()
  }, [])

  const checkAuthAndLoadPack = async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        router.push("/login")
        return
      }

      setUser(authUser)

      const { data: profileData } = await supabase.from("profiles").select("plan").eq("id", authUser.id).single()

      if (profileData?.plan) {
        setUserPlan(profileData.plan as PlanType)
      }

      const { data: packData, error } = await supabase.from("packs").select("*").eq("id", packId).single()

      if (error) throw error

      if (packData.user_id !== authUser.id) {
        toast({
          title: "Acceso denegado",
          description: "No tenés permiso para editar este pack",
          variant: "destructive",
        })
        router.push(`/pack/${packId}`)
        return
      }

      setPack(packData)
      setPrice(packData.price.toString())
      setDiscountPercent(packData.discount_percent?.toString() || "0")
      setCoverPreview(packData.cover_image_url)
      setGenre(packData.genre || "")
      setSubgenre(packData.subgenre || "")
    } catch (error: any) {
      console.error("Error loading pack:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar el pack",
        variant: "destructive",
      })
      router.push("/")
    } finally {
      setLoading(false)
    }
  }

  const handleGenreChange = (value: string) => {
    setGenre(value)
    setSubgenre("")
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      let coverUrl = pack.cover_image_url

      if (coverFile) {
        const fileExt = coverFile.name.split(".").pop()
        const fileName = `${user.id}/covers/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage.from("samplepacks").upload(fileName, coverFile)

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from("samplepacks").getPublicUrl(fileName)
        coverUrl = publicUrl
      }

      const { error } = await supabase
        .from("packs")
        .update({
          price: Number.parseInt(price),
          discount_percent: Number.parseInt(discountPercent) || 0,
          cover_image_url: coverUrl,
          genre,
          subgenre,
        })
        .eq("id", packId)

      if (error) throw error

      toast({
        title: "Pack actualizado",
        description: "Los cambios se guardaron exitosamente",
      })

      router.push(`/pack/${packId}`)
    } catch (error: any) {
      console.error("Error saving pack:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar los cambios",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const getMaxDiscount = () => {
    return PLAN_FEATURES[userPlan]?.maxDiscountPercent || 50
  }

  const uploadCoverToStorage = async (file: File) => {
    const fileExt = file.name.split(".").pop()
    const fileName = `${user.id}/covers/${Date.now()}.${fileExt}`

    const { error } = await supabase.storage.from("samplepacks").upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) throw error

    const {
      data: { publicUrl },
    } = supabase.storage.from("samplepacks").getPublicUrl(fileName)

    return publicUrl
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)

      const { error: markDeletedError } = await supabase
        .from("pack_uploads")
        .update({ deleted_at: new Date().toISOString() })
        .eq("pack_id", packId)
        .eq("user_id", user.id)

      if (markDeletedError) {
        console.error("Error marking upload as deleted:", markDeletedError)
      }

      const { error } = await supabase.from("packs").delete().eq("id", packId)

      if (error) throw error

      toast({
        title: "Pack eliminado",
        description: "El pack se eliminó correctamente",
      })

      router.push("/profile")
    } catch (error: any) {
      console.error("Error deleting pack:", error)
      toast({
        title: "Error al eliminar",
        description: error.message || "Intenta de nuevo más tarde",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!pack) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">Pack no encontrado</h1>
            <Button onClick={() => router.push("/")}>Volver al inicio</Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const priceNumber = Number.parseFloat(price) || 0
  const discountPercentNumber = Number.parseFloat(discountPercent) || 0
  const discountAmount = (priceNumber * discountPercentNumber) / 100
  const priceAfterDiscount = priceNumber - discountAmount
  const commission = PLAN_FEATURES[userPlan].commission
  const commissionAmount = priceAfterDiscount * commission
  const youWillReceive = priceAfterDiscount - commissionAmount

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-foreground mb-2">Editar Pack</h1>
          <p className="text-lg text-muted-foreground">{pack.title}</p>
        </div>

        <div className="space-y-8">
          <Card className="p-6 rounded-2xl">
            <h2 className="text-2xl font-bold text-foreground mb-6">Información del Pack</h2>

            <div className="space-y-4 mb-6">
              <div>
                <Label className="text-sm font-semibold mb-2">Título</Label>
                <p className="text-sm text-muted-foreground">{pack.title}</p>
              </div>

              <div>
                <Label className="text-sm font-semibold mb-2">Descripción</Label>
                <p className="text-sm text-muted-foreground">{pack.description}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="genre" className="text-sm font-semibold">
                  Género
                </Label>
                <Select value={genre} onValueChange={handleGenreChange}>
                  <SelectTrigger className="h-11 rounded-lg">
                    <SelectValue placeholder="Seleccionar género" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENRES.filter((g) => g !== "Todos").map((genreOption) => (
                      <SelectItem key={genreOption} value={genreOption}>
                        {genreOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {genre && genre !== "Todos" && (
                <div className="space-y-2">
                  <Label htmlFor="subgenre" className="text-sm font-semibold">
                    Subgénero
                  </Label>
                  <Select value={subgenre} onValueChange={setSubgenre}>
                    <SelectTrigger className="h-11 rounded-lg">
                      <SelectValue placeholder="Seleccionar subgénero" />
                    </SelectTrigger>
                    <SelectContent>
                      {getSubgenres(genre).map((subgenreOption) => (
                        <SelectItem key={subgenreOption} value={subgenreOption}>
                          {subgenreOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Cover Image */}
            <div className="space-y-4">
              <Label htmlFor="cover" className="text-lg font-bold flex items-center gap-2 text-foreground">
                <ImageIcon className="h-5 w-5 text-primary" />
                Cambiar Portada
              </Label>
              <div className="border-2 border-dashed border-border rounded-2xl p-12 hover:border-primary/50 transition-all bg-card">
                <input
                  id="cover"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  className="hidden"
                  disabled={saving}
                />
                <label htmlFor="cover" className="flex flex-col items-center justify-center cursor-pointer">
                  {coverPreview ? (
                    <div className="relative group">
                      <img
                        src={coverPreview || "/placeholder.svg"}
                        alt="Preview"
                        className="max-h-80 rounded-xl object-cover border-2 border-border"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                        <p className="text-white font-semibold">Cambiar imagen</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Upload className="h-10 w-10 text-primary" />
                      </div>
                      <p className="text-base font-bold text-foreground mb-2">Hacé clic para subir la portada</p>
                      <p className="text-sm text-muted-foreground">PNG, JPG o WEBP (máx. 5MB)</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-4">
              <Label htmlFor="price" className="text-lg font-bold text-foreground">
                Precio (ARS) *
              </Label>
              <Select value={price} onValueChange={setPrice} disabled={saving}>
                <SelectTrigger className="text-base h-14 rounded-xl bg-card border-border text-lg font-semibold">
                  <SelectValue placeholder="Seleccioná un precio" />
                </SelectTrigger>
                <SelectContent>
                  {PRICE_OPTIONS.map((priceOption) => (
                    <SelectItem key={priceOption} value={priceOption.toString()}>
                      {priceOption === 0 ? "GRATIS" : `$${priceOption.toLocaleString()} ARS`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Precio máximo permitido: ${MAX_PRICE.toLocaleString()} ARS
              </p>
            </div>

            {/* Discount */}
            <div className="space-y-4">
              <Label htmlFor="discount" className="text-lg font-bold flex items-center gap-2 text-foreground">
                <Percent className="h-5 w-5 text-primary" />
                Descuento (%)
              </Label>
              <Select value={discountPercent} onValueChange={setDiscountPercent} disabled={saving}>
                <SelectTrigger className="text-base h-14 rounded-xl bg-card border-border text-lg font-semibold">
                  <SelectValue placeholder="Seleccioná descuento" />
                </SelectTrigger>
                <SelectContent>
                  {DISCOUNT_OPTIONS.filter((opt) => opt <= MAX_DISCOUNT).map((discountOption) => (
                    <SelectItem key={discountOption} value={discountOption.toString()}>
                      {discountOption}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Descuento máximo para tu plan ({userPlan}): {MAX_DISCOUNT}%. Dejá en 0 para no aplicar descuento.
              </p>

              {Number.parseFloat(discountPercent) > 0 && (
                <Card className="p-6 rounded-xl border border-border bg-accent/30 mt-6">
                  <div className="space-y-4">
                    <h3 className="font-bold text-foreground text-sm">Configurar Descuento</h3>

                    <div className="space-y-2">
                      <Label htmlFor="discountCode" className="text-sm font-semibold text-foreground">
                        Código de Descuento
                      </Label>
                      <Input
                        id="discountCode"
                        placeholder="ARSOUND25"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                        className="h-11 rounded-lg bg-background"
                        disabled={saving || !discountRequiresCode}
                      />
                      <p className="text-xs text-muted-foreground">
                        {discountRequiresCode ? "Dejá vacío para auto-generar" : "Este descuento se aplica sin código"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discountType" className="text-sm font-semibold text-foreground">
                        Aplicar a
                      </Label>
                      <select
                        id="discountType"
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value)}
                        disabled={saving}
                        className="w-full h-11 rounded-lg bg-background border border-border px-3 text-sm"
                      >
                        <option value="all">Todos los usuarios</option>
                        <option value="first">Primera compra</option>
                        <option value="followers">Mis seguidores</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border">
                      <input
                        type="checkbox"
                        id="requireCode"
                        checked={discountRequiresCode}
                        onChange={(e) => {
                          setDiscountRequiresCode(e.target.checked)
                          if (!e.target.checked) setDiscountCode("")
                        }}
                        disabled={saving}
                        className="h-5 w-5 rounded border-border text-primary"
                      />
                      <label htmlFor="requireCode" className="text-sm text-muted-foreground cursor-pointer flex-1">
                        {discountRequiresCode ? "Se aplica solo con código" : "Se aplica automáticamente a todos"}
                      </label>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Price Summary */}
            {priceNumber > 0 && (
              <Card className="p-6 rounded-3xl border-border bg-accent/50">
                <h3 className="font-bold text-foreground mb-4 text-lg">Resumen de Ganancia</h3>
                <div className="space-y-3 text-base">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Precio del pack:</span>
                    <span className="font-bold text-foreground text-lg">
                      ${new Intl.NumberFormat("es-AR").format(priceNumber)} ARS
                    </span>
                  </div>
                  {discountPercentNumber > 0 && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Descuento aplicado ({discountPercentNumber}%):</span>
                        <span className="font-bold text-orange-500 text-lg">
                          - ${new Intl.NumberFormat("es-AR").format(discountAmount)} ARS
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Precio final para el comprador:</span>
                        <span className="font-bold text-primary text-lg">
                          ${new Intl.NumberFormat("es-AR").format(priceAfterDiscount)} ARS
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Comisión ARSOUND ({(commission * 100).toFixed(0)}%):</span>
                    <span className="font-bold text-destructive text-lg">
                      - ${new Intl.NumberFormat("es-AR").format(commissionAmount)} ARS
                    </span>
                  </div>
                  <div className="pt-3 border-t-2 border-border flex justify-between items-center">
                    <span className="font-bold text-foreground text-lg">Vas a recibir:</span>
                    <span className="font-black text-primary text-3xl">
                      ${new Intl.NumberFormat("es-AR").format(youWillReceive)}
                    </span>
                  </div>
                </div>
              </Card>
            )}
          </Card>

          <div className="flex justify-between gap-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="lg" className="gap-2" disabled={deleting}>
                  <Trash2 className="h-5 w-5" />
                  Eliminar Pack
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. El pack será eliminado permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button size="lg" className="gap-2" onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
