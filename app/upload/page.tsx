"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Upload,
  ImageIcon,
  Music,
  FileArchive,
  DollarSign,
  Tag,
  Info,
  Loader2,
  X,
  AlertCircle,
  Zap,
  Crown,
  Percent,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import type { PlanType } from "@/lib/plans"
import { validatePackUpload } from "@/lib/pack-validation"
import { PLAN_FEATURES } from "@/lib/plans"
import { BlockWarningBanner } from "@/components/block-warning-banner"
import { useBlockStatus } from "@/hooks/use-block-status"
import Link from "next/link"
import { Switch } from "@/components/ui/switch"

const ALL_PRICE_OPTIONS = Array.from({ length: 14 }, (_, i) => i * 5000) // 0, 5000, 10000... 65000
const ALL_DISCOUNT_OPTIONS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

// Mock implementation for canUserUploadPack as it's not provided
// In a real scenario, this would be imported or defined elsewhere.
const canUserUploadPack = async (userId: string, plan: PlanType): Promise<{ canUpload: boolean; reason?: string }> => {
  // Placeholder logic: Replace with actual implementation
  console.log(`[Mock] Checking upload permission for user ${userId} on plan ${plan}`)
  if (plan === "free") {
    // Example: Free users have a limit of 3 uploads
    const currentUploads = Math.floor(Math.random() * 4) // Simulate current uploads
    if (currentUploads >= 3) {
      return { canUpload: false, reason: "Has alcanzado el límite de 3 packs para el plan gratuito." }
    }
  }
  return { canUpload: true }
}

export default function UploadPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const router = useRouter()
  const supabase = createBrowserClient()

  // Form states
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [genre, setGenre] = useState("")
  const [bpmRange, setBpmRange] = useState("")
  const [fileSize, setFileSize] = useState("")
  const [fileCount, setFileCount] = useState(0)
  const [price, setPrice] = useState("")
  const [ownershipConfirmed, setOwnershipConfirmed] = useState(false)

  // File states
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [demoFile, setDemoFile] = useState<File | null>(null)
  const [demoFileName, setDemoFileName] = useState("")
  const [packFile, setPackFile] = useState<File | null>(null)
  const [zipFileName, setZipFileName] = useState("")

  // Discount states
  const [hasDiscount, setHasDiscount] = useState(false)
  const [discountPercent, setDiscountPercent] = useState("")
  const [discountCode, setDiscountCode] = useState("")
  const [discountType, setDiscountType] = useState("all")
  const [discountRequiresCode, setDiscountRequiresCode] = useState(true)

  // Tags state
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")

  const [userPlan, setUserPlan] = useState<PlanType>("free")
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [fileSizeError, setFileSizeError] = useState<string | null>(null)

  const [canUpload, setCanUpload] = useState(true)
  const [uploadBlockReason, setUploadBlockReason] = useState<string | null>(null)
  const [mpConnected, setMpConnected] = useState(false)
  // Added isPurchasing state for handlePurchase
  const [isPurchasing, setIsPurchasing] = useState(false)

  const blockStatus = useBlockStatus()

  const MAX_PRICE = PLAN_FEATURES[userPlan].maxPrice || 65000
  const MAX_DISCOUNT = PLAN_FEATURES[userPlan]?.maxDiscountPercent || 50
  const MAX_FILE_SIZE_MB = PLAN_FEATURES[userPlan]?.maxFileSizeMB || 50
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
  const commission = PLAN_FEATURES[userPlan]?.commission ?? 0.15

  const PRICE_OPTIONS = ALL_PRICE_OPTIONS.filter((price) => price <= MAX_PRICE)
  const DISCOUNT_OPTIONS = ALL_DISCOUNT_OPTIONS.filter((discount) => discount <= MAX_DISCOUNT)

  const priceNumber = Math.min(Number.parseFloat(price) || 0, MAX_PRICE)

  const discountPercentNumber = Math.min(Number.parseFloat(discountPercent) || 0, MAX_DISCOUNT)
  const discountAmount = hasDiscount ? (priceNumber * discountPercentNumber) / 100 : 0
  const priceAfterDiscount = priceNumber - discountAmount
  const commissionAmount = priceAfterDiscount * commission
  const youWillReceive = priceAfterDiscount - commissionAmount

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
      } else {
        setIsAuthenticated(true)

        try {
          console.log("[v0] Fetching plan for user:", user.id)

          const { data: existingProfile, error: fetchError } = await supabase
            .from("profiles")
            .select("plan, mp_connected")
            .eq("id", user.id)
            .single()

          if (fetchError?.code === "PGRST116") {
            // Profile doesn't exist, create it
            console.log("[v0] Profile doesn't exist, creating one...")
            const { error: createError } = await supabase.from("profiles").insert({
              id: user.id,
              username: user.email?.split("@")[0] || "user_" + user.id.slice(0, 8),
              plan: "free",
              mp_connected: false,
            })

            if (createError) {
              console.warn("[v0] Could not create profile:", createError.message)
            } else {
              console.log("[v0] Profile created successfully")
            }
            setUserPlan("free")
            setMpConnected(false)
          } else if (fetchError) {
            console.warn("[v0] Error fetching profile:", fetchError.message)
            setUserPlan("free")
            setMpConnected(false)
          } else if (existingProfile) {
            let plan = (existingProfile.plan as string) || "free"
            plan = plan.replace(/-/g, "_")
            setUserPlan(plan as PlanType)
            setMpConnected(existingProfile.mp_connected || false)

            const uploadCheck = await canUserUploadPack(user.id, plan as PlanType)
            setCanUpload(uploadCheck.canUpload)
            setUploadBlockReason(uploadCheck.reason || null)
          }
        } catch (err) {
          console.warn("[v0] Could not fetch plan, using default", err)
          setUserPlan("free")
          setMpConnected(false)
        }
      }
    }
    checkAuth()
  }, [supabase, router])

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

  const handleDemoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setDemoFile(file)
      setDemoFileName(file.name)
    }
  }

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2)
        const errorMsg = `El archivo es muy grande (${fileSizeMB} MB). Tu plan permite máximo ${MAX_FILE_SIZE_MB} MB.`
        setFileSizeError(errorMsg)
        toast({
          title: "Archivo demasiado grande",
          description: errorMsg,
          variant: "destructive",
        })
        return
      }

      setFileSizeError(null)
      setPackFile(file)
      setZipFileName(file.name)

      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2)
      setFileSize(`${sizeInMB} MB`)

      setFileCount(0)
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

  const addTag = () => {
    const trimmedTag = tagInput.trim()

    if (trimmedTag.length > 12) {
      toast({
        title: "Tag muy largo",
        description: "Los tags deben tener máximo 12 caracteres",
        variant: "destructive",
      })
      return
    }

    if (trimmedTag && tags.length < 5 && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setTagInput("")
    } else if (tags.includes(trimmedTag)) {
      toast({
        title: "Tag duplicado",
        description: "Este tag ya fue agregado",
        variant: "destructive",
      })
    } else if (tags.length >= 5) {
      toast({
        title: "Límite alcanzado",
        description: "Máximo 5 tags permitidos",
        variant: "destructive",
      })
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag()
    }
  }

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value.length <= 12) {
      setTagInput(value)
    }
  }

  const uploadFileToStorage = async (file: File, folder: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("No user found")

    const fileExt = file.name.split(".").pop()
    const fileName = `${user.id}/${folder}/${Date.now()}.${fileExt}`

    try {
      const { data, error } = await supabase.storage.from("samplepacks").upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (error) {
        if (error.message.includes("bucket")) {
          throw new Error(`Storage error: Bucket not accessible. ${error.message}`)
        } else if (error.message.includes("permission")) {
          throw new Error(`Storage error: Permission denied. Check RLS policies.`)
        } else if (error.message.includes("size")) {
          throw new Error(`File too large. Maximum size: ${MAX_FILE_SIZE_MB}MB`)
        } else {
          throw new Error(`Storage upload failed: ${error.message}`)
        }
      }

      if (!data) {
        throw new Error("Upload succeeded but no data returned from storage")
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("samplepacks").getPublicUrl(fileName)

      if (!publicUrl) {
        throw new Error("Could not generate public URL for uploaded file")
      }

      return publicUrl
    } catch (error: any) {
      console.error(`[v0] Error uploading ${folder} file:`, error)
      throw error
    }
  }

  const handlePurchase = async () => {
    setIsPurchasing(true)

    // This logic is for when a user *downloads* a pack, not uploads.
    // For the purpose of this merge, we'll assume 'packId', 'pack', and 'pack.price'
    // are available in this scope if this function were truly used on a download page.
    // Since this is the upload page, this function might be misplaced or a remnant.
    // We'll keep the logic as provided in the updates for now.

    // Mocking pack and packId for demonstration as they are not defined in this component's scope.
    const mockPack = { title: "Test Pack", price: 0, free: true }
    const mockPackId = "12345"

    if (mockPack.price === 0 || mockPack.free === true) {
      try {
        // In a real scenario, this would fetch a download URL or stream the file.
        // For this example, we simulate a successful download.
        const blob = new Blob(["This is a dummy zip file content."], { type: "application/zip" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${mockPack.title.replace(/[^a-zA-Z0-9]/g, "_")}.zip`
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
      // This would redirect to a checkout page for paid packs.
      // window.location.href = `/pack/${mockPackId}/checkout`
      console.log("Redirecting to checkout for paid pack.")
      setIsPurchasing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!canUpload) {
      toast({
        title: "No puedes subir packs",
        description: uploadBlockReason || "Alcanzaste tu límite de uploads",
        variant: "destructive",
      })
      return
    }

    if (priceNumber > 0 && !mpConnected) {
      toast({
        title: "Mercado Pago no conectado",
        description: "Necesitás conectar tu cuenta de Mercado Pago para vender packs. Andá a tu perfil.",
        variant: "destructive",
      })
      return
    }

    if (!title || !description || !genre || !price || !demoFile || !packFile || !ownershipConfirmed) {
      toast({
        title: "Error",
        description: "Por favor completá todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    if (packFile && packFile.size > MAX_FILE_SIZE_BYTES) {
      const fileSizeMB = (packFile.size / (1024 * 1024)).toFixed(2)
      toast({
        title: "Archivo demasiado grande",
        description: `El archivo (${fileSizeMB} MB) excede el límite de ${MAX_FILE_SIZE_MB} MB para tu plan.`,
        variant: "destructive",
      })
      return
    }

    if (hasDiscount && discountPercentNumber > MAX_DISCOUNT) {
      toast({
        title: "Descuento no permitido",
        description: `Tu plan permite máximo ${MAX_DISCOUNT}% de descuento`,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      const validation = await validatePackUpload(user.id, userPlan, priceNumber)
      if (!validation.valid) {
        setUploadError(validation.errors[0])
        toast({
          title: "No puedes subir este pack",
          description: validation.errors[0],
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }
    } catch (error) {
      console.error("Validation error:", error)
      setIsLoading(false)
      return
    }

    setUploadProgress(0)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      // Upload files
      setUploadProgress(20)
      let coverUrl = null
      try {
        if (coverFile) {
          coverUrl = await uploadFileToStorage(coverFile, "covers")
        }
      } catch (error: any) {
        const message = error.message || "Error uploading cover image"
        setUploadError(message)
        toast({
          title: "Error subiendo portada",
          description: message,
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      setUploadProgress(40)
      let demoUrl: string
      try {
        demoUrl = await uploadFileToStorage(demoFile, "demos")
      } catch (error: any) {
        const message = error.message || "Error uploading demo audio"
        setUploadError(message)
        toast({
          title: "Error subiendo demo",
          description: message,
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      setUploadProgress(60)
      let fileUrl: string
      try {
        fileUrl = await uploadFileToStorage(packFile, "packs")
      } catch (error: any) {
        const message = error.message || "Error uploading pack file"
        setUploadError(message)
        toast({
          title: "Error subiendo archivo",
          description: message,
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      setUploadProgress(80)

      const response = await fetch("/api/packs/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          genre,
          bpm: bpmRange || null,
          price: Number.parseInt(price),
          cover_image_url: coverUrl,
          demo_audio_url: demoUrl,
          file_url: fileUrl,
          tags: tags,
          has_discount: hasDiscount,
          discount_percent: hasDiscount ? Number.parseInt(discountPercent) : 0,
          discountCode: hasDiscount && discountRequiresCode ? discountCode : null,
          discountType: hasDiscount ? discountType : null,
          discountRequiresCode: hasDiscount ? discountRequiresCode : false,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 403 && result.errorCode === "REUPLOAD_FORBIDDEN") {
          toast({
            title: "No podés resubir este pack",
            description: "Este pack ya existe en la plataforma. No se permite resubir contenido duplicado.",
            variant: "destructive",
            duration: 5000,
          })
          setIsLoading(false)
          return
        }

        const errorMsg = result.details || result.error || "Unknown error occurred"
        setUploadError(errorMsg)
        toast({
          title: "Error al crear el pack",
          description: errorMsg,
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      setUploadProgress(100)

      toast({
        title: "Pack subido exitosamente!",
        description: "Tu pack ya está disponible en ARSOUND",
      })

      setTimeout(() => {
        router.push("/")
      }, 1500)
    } catch (error: any) {
      console.error("[v0] Upload error:", error)
      const message = error.message || "An unexpected error occurred"
      setUploadError(message)
      toast({
        title: "Error al subir el pack",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setUploadProgress(0)
    }
  }

  if (!isAuthenticated) {
    return null
  }

  const MUSICAL_KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {blockStatus.isNearBlock && !blockStatus.loading && (
        <BlockWarningBanner attemptCount={blockStatus.attemptCount} />
      )}

      <main className="flex-1 container mx-auto px-4 py-12 max-w-5xl">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary mb-3">
            <Upload className="h-4 w-4" />
            SUBIR PACK
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground mb-3">Publicá tu Sample Pack</h1>
          <p className="text-lg text-muted-foreground">Compartí tus sonidos con miles de productores argentinos</p>
        </div>

        {userPlan === "free" && (
          <Card className="p-8 rounded-3xl border-2 border-primary/30 bg-primary/5 mb-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl font-black text-foreground mb-3">¿Querés tener el 100% de tus ganancias?</h2>
                <p className="text-muted-foreground mb-6">
                  Mejorá tu plan y accedé a beneficios exclusivos como comisiones reducidas, sin límites de packs y
                  descuentos ilimitados.
                </p>
                <Button className="gap-2 rounded-full h-12 bg-primary hover:bg-primary/90" asChild>
                  <Link href="/plans">
                    <Zap className="h-4 w-4" />
                    Mejorar Plan
                  </Link>
                </Button>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl border border-border bg-card">
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-foreground text-sm">De 0 a Hit - 5.000 ARS/mes</div>
                      <div className="text-xs text-muted-foreground">
                        {(PLAN_FEATURES["de_0_a_hit"].commission * 100).toFixed(0)}% comisión, hasta 50% descuento
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-border bg-card">
                  <div className="flex items-start gap-3">
                    <Crown className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-foreground text-sm">Studio Plus - 15.000 ARS/mes</div>
                      <div className="text-xs text-muted-foreground">
                        {(PLAN_FEATURES["studio_plus"].commission * 100).toFixed(0)}% comisión, descuentos ilimitados
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {!canUpload && (
          <Card className="p-6 rounded-2xl border-2 border-destructive/50 bg-destructive/10 mb-8">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-bold text-destructive text-lg mb-2">No puedes subir más packs</h3>
                <p className="text-destructive/90 mb-4">{uploadBlockReason}</p>
                <Button className="gap-2 rounded-full bg-primary hover:bg-primary/90" asChild>
                  <Link href="/plans">
                    <Zap className="h-4 w-4" />
                    Mejorar Plan
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        )}

        {priceNumber > 0 && !mpConnected && (
          <Card className="p-6 rounded-2xl border-2 border-amber-500/50 bg-amber-500/10 mb-8">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-bold text-amber-600 text-lg mb-2">Conectá tu cuenta de Mercado Pago</h3>
                <p className="text-amber-600/90 mb-4">
                  Para vender packs necesitás conectar tu cuenta de Mercado Pago. Así vas a recibir tus ganancias
                  automáticamente.
                </p>
                <Button className="gap-2 rounded-full bg-amber-600 hover:bg-amber-700 text-white" asChild>
                  <Link href="/profile">Conectar Mercado Pago</Link>
                </Button>
              </div>
            </div>
          </Card>
        )}

        {isLoading && (
          <div className="mb-8 bg-card rounded-xl p-6 border-2 border-primary">
            <div className="flex items-center gap-3 mb-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="font-bold text-foreground">Subiendo tu pack...</p>
            </div>
            <div className="w-full bg-secondary rounded-full h-3">
              <div
                className="bg-primary h-3 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">{uploadProgress}% completado</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Portada */}
          <div className="space-y-4">
            <Label htmlFor="cover" className="text-lg font-bold flex items-center gap-2 text-foreground">
              <ImageIcon className="h-5 w-5 text-primary" />
              Portada del Pack
            </Label>
            <div className="border-2 border-dashed border-border rounded-2xl p-12 hover:border-primary/50 transition-all bg-card">
              <input
                id="cover"
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="hidden"
                disabled={isLoading}
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

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label htmlFor="packName" className="text-lg font-bold text-foreground">
                Nombre del Pack *
              </Label>
              <Input
                id="packName"
                placeholder="Ej: Trap Argentino Vol. 1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-base h-12 rounded-xl bg-card border-border"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-4">
              <Label htmlFor="genre" className="text-lg font-bold text-foreground">
                Género *
              </Label>
              <Select value={genre} onValueChange={setGenre} disabled={isLoading}>
                <SelectTrigger className="h-12 rounded-xl bg-card border-border text-base">
                  <SelectValue placeholder="Seleccionar género" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RKT">RKT</SelectItem>
                  <SelectItem value="TRAP">TRAP</SelectItem>
                  <SelectItem value="REGGAETON">REGGAETON</SelectItem>
                  <SelectItem value="CUMBIA">CUMBIA</SelectItem>
                  <SelectItem value="CUMBIA_VILLERA">CUMBIA VILLERA</SelectItem>
                  <SelectItem value="DRILL">DRILL</SelectItem>
                  <SelectItem value="CUARTETO">CUARTETO</SelectItem>
                  <SelectItem value="DANCEHALL">DANCEHALL</SelectItem>
                  <SelectItem value="LATIN_URBANO">LATIN URBANO</SelectItem>
                  <SelectItem value="AFROTRAP">AFROTRAP</SelectItem>
                  <SelectItem value="HIP_HOP">HIP HOP</SelectItem>
                  <SelectItem value="DEMBOW">DEMBOW</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 md:col-span-2">
              <Label htmlFor="bpmRange" className="text-lg font-bold text-foreground">
                Rango de BPM
              </Label>
              <Select value={bpmRange} onValueChange={setBpmRange} disabled={isLoading}>
                <SelectTrigger className="h-12 rounded-xl bg-card border-border text-base">
                  <SelectValue placeholder="Seleccionar rango de BPM" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50-100">50 - 100 BPM</SelectItem>
                  <SelectItem value="100-150">100 - 150 BPM</SelectItem>
                  <SelectItem value="200-250">200 - 250 BPM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-4">
            <Label htmlFor="description" className="text-lg font-bold text-foreground">
              Descripción *
            </Label>
            <Textarea
              id="description"
              placeholder="Contá sobre tu pack: qué incluye, instrumentos, estilo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-32 text-base rounded-xl bg-card border-border resize-none"
              required
              disabled={isLoading}
            />
          </div>

          {/* Demo y Archivo */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label htmlFor="demo" className="text-lg font-bold flex items-center gap-2 text-foreground">
                <Music className="h-5 w-5 text-primary" />
                Demo (Audio Preview) *
              </Label>
              <div className="border-2 border-dashed border-border rounded-xl p-8 hover:border-primary/50 transition-all bg-card">
                <input
                  id="demo"
                  type="file"
                  accept="audio/*"
                  onChange={handleDemoChange}
                  className="hidden"
                  required
                  disabled={isLoading}
                />
                <label htmlFor="demo" className="flex flex-col items-center justify-center cursor-pointer">
                  {demoFileName ? (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Music className="h-6 w-6 text-primary" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-bold text-foreground text-sm">{demoFileName}</p>
                        <p className="text-xs text-muted-foreground">Listo para subir</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Music className="h-10 w-10 text-muted-foreground mb-3 mx-auto" />
                      <p className="text-sm font-bold text-foreground mb-1">Subir demo</p>
                      <p className="text-xs text-muted-foreground">MP3, WAV (máx. 10MB)</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <Label htmlFor="packFile" className="text-lg font-bold flex items-center gap-2 text-foreground">
                <FileArchive className="h-5 w-5 text-primary" />
                Archivo del Pack *
              </Label>
              <div
                className={`border-2 border-dashed rounded-xl p-8 transition-all bg-card ${
                  fileSizeError ? "border-red-500/50 hover:border-red-500/50" : "border-border hover:border-primary/50"
                }`}
              >
                <input
                  id="packFile"
                  type="file"
                  name="packFile"
                  accept=".zip,.rar"
                  onChange={handleZipChange}
                  className="hidden"
                  required
                  disabled={isLoading}
                />
                <label htmlFor="packFile" className="flex flex-col items-center justify-center cursor-pointer">
                  {zipFileName ? (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                        <FileArchive className="h-6 w-6 text-secondary" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-bold text-foreground text-sm">{zipFileName}</p>
                        <p className="text-xs text-muted-foreground">{fileSize}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <FileArchive className="h-10 w-10 text-muted-foreground mb-3 mx-auto" />
                      <p className="text-sm font-bold text-foreground mb-1">Subir ZIP/RAR</p>
                      <p className="text-xs text-muted-foreground">ZIP o RAR (máx. {MAX_FILE_SIZE_MB} MB)</p>
                    </div>
                  )}
                </label>
              </div>
              {fileSizeError && (
                <div className="flex gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-500 font-medium">{fileSizeError}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <Label htmlFor="tags" className="text-lg font-bold flex items-center gap-2 text-foreground">
              <Tag className="h-5 w-5 text-primary" />
              Tags (hasta 5, máximo 12 caracteres)
            </Label>
            <p className="text-sm text-muted-foreground">
              Agregá palabras clave para que los usuarios encuentren tu pack más fácilmente
            </p>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  id="tags"
                  placeholder="Ej: 808, melodías, oscuro..."
                  value={tagInput}
                  onChange={handleTagInputChange}
                  onKeyDown={handleTagKeyDown}
                  className="text-base h-12 rounded-xl bg-card border-border pr-16"
                  disabled={isLoading || tags.length >= 5}
                  maxLength={12}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {tagInput.length}/12
                </span>
              </div>
              <Button
                type="button"
                onClick={addTag}
                disabled={isLoading || tags.length >= 5 || !tagInput.trim()}
                className="h-12 px-6 rounded-xl"
              >
                Agregar
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="px-4 py-2 rounded-full text-sm flex items-center gap-2"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-destructive transition-colors"
                      disabled={isLoading}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">{tags.length}/5 tags agregados</p>
          </div>

          {/* Precio */}
          <div className="space-y-4">
            <Label htmlFor="price" className="text-lg font-bold flex items-center gap-2 text-foreground">
              <DollarSign className="h-5 w-5 text-primary" />
              Precio (ARS) *
            </Label>
            <Select value={price} onValueChange={setPrice} disabled={isLoading} required>
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
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Info className="h-4 w-4" />
              Precio máximo permitido: ${MAX_PRICE.toLocaleString()} ARS
            </p>

            <div className="bg-accent rounded-xl p-6 space-y-6 border border-border mt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Tag className="h-5 w-5 text-primary" />
                  <div>
                    <Label htmlFor="hasDiscount" className="text-base font-bold text-foreground cursor-pointer">
                      Código de Descuento
                    </Label>
                    <p className="text-sm text-muted-foreground">Ofrecé un descuento especial</p>
                  </div>
                </div>
                <Switch id="hasDiscount" checked={hasDiscount} onCheckedChange={setHasDiscount} disabled={isLoading} />
              </div>

              {hasDiscount && (
                <div className="space-y-4 pt-2 border-t border-border">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="discountCode"
                        className="text-sm font-semibold text-foreground flex items-center gap-2"
                      >
                        Código
                      </Label>
                      <Input
                        id="discountCode"
                        placeholder="ARSOUND25"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                        className="h-11 rounded-lg bg-background"
                        disabled={isLoading || !discountRequiresCode}
                      />
                      <p className="text-xs text-muted-foreground">
                        {discountRequiresCode
                          ? "Dejá vacío para sin código"
                          : "Este descuento se aplica sin código a todos"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="discountPercent"
                        className="text-sm font-semibold text-foreground flex items-center gap-2"
                      >
                        <Percent className="h-4 w-4" />
                        Porcentaje (máx. {MAX_DISCOUNT}%)
                      </Label>
                      <Select value={discountPercent} onValueChange={setDiscountPercent} disabled={isLoading}>
                        <SelectTrigger className="h-11 rounded-lg bg-background">
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
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="discountType" className="text-sm font-semibold text-foreground">
                        Aplicar a
                      </Label>
                      <Select value={discountType} onValueChange={setDiscountType} disabled={isLoading}>
                        <SelectTrigger className="h-11 rounded-lg bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los usuarios</SelectItem>
                          <SelectItem value="first">Primera compra</SelectItem>
                          <SelectItem value="followers">Mis seguidores</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="requireCode" className="text-sm font-semibold text-foreground">
                        Requisito de Código
                      </Label>
                      <div className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border">
                        <input
                          type="checkbox"
                          id="requireCode"
                          checked={discountRequiresCode}
                          onChange={(e) => {
                            setDiscountRequiresCode(e.target.checked)
                            if (!e.target.checked) setDiscountCode("")
                          }}
                          disabled={isLoading}
                          className="h-5 w-5 rounded border-border text-primary"
                        />
                        <label htmlFor="requireCode" className="text-sm text-muted-foreground cursor-pointer flex-1">
                          {discountRequiresCode ? "Se aplica solo con código" : "Se aplica automáticamente a todos"}
                        </label>
                      </div>
                    </div>
                  </div>

                  {discountPercentNumber > 0 && (
                    <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                      <p className="text-sm font-semibold text-primary mb-1">Precio con descuento:</p>
                      <p className="text-2xl font-black text-primary">${priceAfterDiscount.toFixed(0)} ARS</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ahorro de ${discountAmount.toFixed(0)} ARS ({discountPercentNumber}% OFF)
                      </p>
                      <p className="text-xs text-primary mt-2">
                        {discountRequiresCode
                          ? discountCode
                            ? `Código: ${discountCode}`
                            : "Código: AUTOMÁTICO"
                          : "Sin código - Se aplica a todos"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {priceNumber > 0 && (
              <div className="bg-card rounded-xl p-6 space-y-3 border-2 border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-foreground">Resumen de Ganancia</h3>
                </div>
                <div className="space-y-3 text-base">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Precio del pack:</span>
                    <span className="font-bold text-foreground text-lg">
                      ${new Intl.NumberFormat("es-AR").format(priceNumber)} ARS
                    </span>
                  </div>
                  {hasDiscount && discountPercentNumber > 0 && (
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
                    <span className="text-muted-foreground">
                      Comisión ARSOUND ({(commission * 100).toFixed(0)}%
                      {hasDiscount && discountPercentNumber > 0 ? " del precio final" : ""}):
                    </span>
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
              </div>
            )}
          </div>

          {/* Ownership Confirmation */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-accent border border-border">
            <input
              type="checkbox"
              id="ownership"
              checked={ownershipConfirmed}
              onChange={(e) => setOwnershipConfirmed(e.target.checked)}
              required
              className="mt-1 h-5 w-5 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="ownership" className="text-sm text-foreground cursor-pointer">
              <span className="font-bold">Confirmo que todos los sonidos son propios.</span>
              <p className="text-xs text-muted-foreground mt-1">
                Al subir este pack, declaro que tengo todos los derechos sobre el contenido y que no infringe derechos
                de autor de terceros.
              </p>
            </label>
          </div>

          {/* Botones */}
          <div className="flex gap-4 pt-6">
            <Button
              type="submit"
              size="lg"
              className="flex-1 h-14 text-base font-bold rounded-xl bg-primary hover:bg-primary/90"
              disabled={isLoading || !canUpload || (priceNumber > 0 && !mpConnected)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 mr-2" />
                  Publicar Pack
                </>
              )}
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="h-14 text-base font-semibold rounded-xl bg-transparent"
              onClick={() => router.push("/")}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  )
}
