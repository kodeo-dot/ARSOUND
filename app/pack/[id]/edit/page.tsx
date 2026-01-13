"use client"

import type React from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
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
import { Input } from "@/components/ui/input"

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
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [genre, setGenre] = useState("")
  const [subgenre, setSubgenre] = useState("")

  const [priceType, setPriceType] = useState<"preset" | "custom">("preset")
  const [customPrice, setCustomPrice] = useState("")
  const [priceError, setPriceError] = useState("")

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

      const packPrice = packData.price
      const isPreset = ALL_PRICE_OPTIONS.includes(packPrice)

      if (isPreset) {
        setPriceType("preset")
        setPrice(packPrice.toString())
      } else {
        setPriceType("custom")
        setCustomPrice(packPrice.toString())
        setPrice(packPrice.toString())
      }

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

  const validateCustomPrice = (value: string) => {
    const numValue = Number.parseInt(value)

    if (!value || isNaN(numValue)) {
      setPriceError("Ingresá un precio válido")
      return false
    }

    if (numValue < 500) {
      setPriceError("El precio mínimo es $500 ARS")
      return false
    }

    if (numValue > MAX_PRICE) {
      setPriceError(`El precio máximo para tu plan es $${MAX_PRICE.toLocaleString()} ARS`)
      return false
    }

    setPriceError("")
    return true
  }

  const handleCustomPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, "")
    setCustomPrice(value)

    if (value) {
      validateCustomPrice(value)
      setPrice(value)
    }
  }

  const handlePriceTypeChange = (value: "preset" | "custom") => {
    setPriceType(value)
    setPriceError("")

    if (value === "preset") {
      setPrice("0")
      setCustomPrice("")
    } else {
      setPrice("")
      setCustomPrice("")
    }
  }

  const handleSave = async () => {
    if (priceType === "custom") {
      if (!validateCustomPrice(customPrice)) {
        toast({
          title: "Error en el precio",
          description: "Por favor corregí el precio antes de guardar",
          variant: "destructive",
        })
        return
      }
    }

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

      const discountValue = Number.parseInt(discountPercent) || 0
      const finalPrice = priceType === "custom" ? Number.parseInt(customPrice) : Number.parseInt(price)

      const { error } = await supabase
        .from("packs")
        .update({
          price: finalPrice,
          has_discount: discountValue > 0,
          discount_percent: discountValue,
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

  const priceNumber = priceType === "custom" ? Number.parseFloat(customPrice) || 0 : Number.parseFloat(price) || 0
  const discountPercentNumber = Number.parseFloat(discountPercent) || 0
  const discountAmount = (priceNumber * discountPercentNumber) / 100
  const priceAfterDiscount = priceNumber - discountAmount
  const commission = PLAN_FEATURES[userPlan].commission
  const commissionAmount = priceAfterDiscount * commission
  const youWillReceive = priceAfterDiscount - commissionAmount

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

            <div className="space-y-4">
              <Label className="text-lg font-bold text-foreground">Precio (ARS) *</Label>

              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  variant={priceType === "preset" ? "default" : "outline"}
                  onClick={() => handlePriceTypeChange("preset")}
                  className="flex-1"
                  disabled={saving}
                >
                  Precio Predefinido
                </Button>
                <Button
                  type="button"
                  variant={priceType === "custom" ? "default" : "outline"}
                  onClick={() => handlePriceTypeChange("custom")}
                  className="flex-1"
                  disabled={saving}
                >
                  Precio Personalizado
                </Button>
              </div>

              {priceType === "preset" ? (
                <>
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
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="Ingresá el precio (ej: 1000)"
                      value={customPrice}
                      onChange={handleCustomPriceChange}
                      className={`text-base h-14 rounded-xl text-lg font-semibold ${
                        priceError ? "border-red-500 focus-visible:ring-red-500" : ""
                      }`}
                      min={500}
                      max={MAX_PRICE}
                      disabled={saving}
                    />
                    {priceError && <p className="text-sm text-red-500 font-medium">{priceError}</p>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Ingresá cualquier precio entre $500 y ${MAX_PRICE.toLocaleString()} ARS
                  </p>
                </>
              )}
            </div>

            {priceNumber > 0 && (
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
                  Descuento máximo para tu plan ({userPlan}): {MAX_DISCOUNT}%. Dejá en 0 para no aplicar descuento. Los
                  descuentos se aplican automáticamente para todos los compradores.
                </p>
              </div>
            )}

            {priceNumber > 0 && (
              <Card className="p-6 rounded-3xl border-border bg-card">
                <h3 className="font-bold text-foreground mb-4 text-lg">Resumen de Ganancia</h3>
                <div className="space-y-3 text-base">
                  <div className="flex justify-between items-center">
                    <span className="text-foreground">Precio del pack:</span>
                    <span className="font-bold text-foreground text-lg">
                      ${new Intl.NumberFormat("es-AR").format(priceNumber)} ARS
                    </span>
                  </div>
                  {discountPercentNumber > 0 && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-foreground">Descuento aplicado ({discountPercentNumber}%):</span>
                        <span className="font-bold text-orange-500 text-lg">
                          - ${new Intl.NumberFormat("es-AR").format(discountAmount)} ARS
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-foreground">Precio final para el comprador:</span>
                        <span className="font-bold text-primary text-lg">
                          ${new Intl.NumberFormat("es-AR").format(priceAfterDiscount)} ARS
                        </span>
                      </div>
                    </>
                  )}
                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-foreground">Comisión plataforma ({(commission * 100).toFixed(0)}%):</span>
                      <span className="font-bold text-red-500 text-lg">
                        - ${new Intl.NumberFormat("es-AR").format(commissionAmount)} ARS
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
                      <span className="font-bold text-foreground text-lg">Vas a recibir:</span>
                      <span className="font-black text-green-600 dark:text-green-400 text-2xl">
                        ${new Intl.NumberFormat("es-AR").format(youWillReceive)} ARS
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </Card>

          <div className="flex gap-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2 rounded-full" disabled={saving || deleting}>
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Eliminar Pack
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Eliminar Pack</AlertDialogTitle>
                  <AlertDialogDescription>
                    Estás seguro de que querés eliminar este pack? Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button className="flex-1 gap-2 rounded-full" onClick={handleSave} disabled={saving || deleting}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
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
