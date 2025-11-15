"use client"

import type React from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Upload, ImageIcon, Loader2, Trash2, Save, Percent, AlertTriangle } from "lucide-react"
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

  const MAX_PRICE = 65000

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

      // Check if user is owner
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
      setDiscountPercent(packData.discount_percent?.toString() || "")
      setCoverPreview(packData.cover_image_url)
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

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const numValue = Number.parseFloat(value) || 0
    if (numValue <= MAX_PRICE) {
      setPrice(value)
    } else {
      setPrice(MAX_PRICE.toString())
    }
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

  const handleSave = async () => {
    try {
      setSaving(true)

      const priceNum = Number.parseInt(price)
      const discountNum = Number.parseInt(discountPercent) || 0

      if (priceNum < 0 || priceNum > MAX_PRICE) {
        toast({
          title: "Error",
          description: `El precio debe estar entre $0 y $${MAX_PRICE.toLocaleString()}`,
          variant: "destructive",
        })
        return
      }

      if (discountNum < 0 || discountNum > 50) {
        toast({
          title: "Error",
          description: "El descuento debe estar entre 0% y 50%",
          variant: "destructive",
        })
        return
      }

      let coverUrl = pack.cover_image_url

      // Upload new cover if selected
      if (coverFile) {
        coverUrl = await uploadCoverToStorage(coverFile)
      }

      // Update pack
      const { error } = await supabase
        .from("packs")
        .update({
          price: priceNum,
          discount_percent: discountNum,
          has_discount: discountNum > 0,
          cover_image_url: coverUrl,
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
        title: "Error al guardar",
        description: error.message || "Intenta de nuevo más tarde",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
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

      // Delete pack from database
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
    return null
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

      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-3 mb-12">
            <h1 className="text-4xl md:text-5xl font-black text-foreground">Editar Pack</h1>
            <p className="text-lg text-muted-foreground">Modificá la portada, precio y descuento de tu pack</p>
            <p className="text-sm text-muted-foreground italic">Nota: El nombre del pack no se puede editar</p>
          </div>

          <div className="space-y-8">
            {/* Current Pack Info */}
            <Card className="p-6 rounded-3xl border-border bg-accent/30">
              <div className="flex items-center gap-4">
                {pack.cover_image_url && (
                  <img
                    src={pack.cover_image_url || "/placeholder.svg"}
                    alt={pack.title}
                    className="w-20 h-20 rounded-xl object-cover"
                  />
                )}
                <div className="flex-1">
                  <h2 className="text-2xl font-black text-foreground">{pack.title}</h2>
                  <p className="text-sm text-muted-foreground">{pack.genre}</p>
                </div>
              </div>
            </Card>

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
              <Input
                id="price"
                type="number"
                value={price}
                onChange={handlePriceChange}
                className="text-base h-14 rounded-xl bg-card border-border text-lg font-semibold"
                min="0"
                max={MAX_PRICE}
                step="100"
                required
                disabled={saving}
              />
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
              <Input
                id="discount"
                type="number"
                placeholder="0"
                value={discountPercent}
                onChange={(e) => {
                  const val = Number.parseFloat(e.target.value) || 0
                  setDiscountPercent(Math.min(val, 50).toString())
                }}
                className="text-base h-14 rounded-xl bg-card border-border text-lg font-semibold"
                min="0"
                max="50"
                step="5"
                disabled={saving}
              />
              <p className="text-sm text-muted-foreground">
                Descuento máximo: 50%. Dejá en 0 para no aplicar descuento.
              </p>
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

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button
                onClick={handleSave}
                disabled={saving || deleting}
                className="flex-1 h-14 text-base font-bold rounded-xl gap-2"
              >
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

              <Button
                variant="outline"
                onClick={() => router.push(`/pack/${packId}`)}
                disabled={saving || deleting}
                className="h-14 text-base font-semibold rounded-xl bg-transparent"
              >
                Cancelar
              </Button>
            </div>

            {/* Delete Section */}
            <Card className="p-6 rounded-3xl border-2 border-destructive/20 bg-destructive/5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground mb-2 text-lg">Zona Peligrosa</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Una vez que elimines este pack, no hay vuelta atrás. Por favor, asegurate antes de continuar.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" disabled={saving || deleting} className="gap-2 rounded-xl">
                        {deleting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Eliminando...
                          </>
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
                        <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Esto eliminará permanentemente tu pack "{pack.title}" y
                          todos los datos asociados a él.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Sí, eliminar pack
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
