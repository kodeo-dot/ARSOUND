"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth-provider"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Upload,
  ImageIcon,
  Music,
  FileArchive,
  DollarSign,
  Tag,
  Loader2,
  X,
  AlertCircle,
  Zap,
  Crown,
  FileText,
  Percent,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { PlanType } from "@/lib/plans"
import { validatePackUpload } from "@/lib/pack-validation"
import { PLAN_FEATURES } from "@/lib/plans"
import { BlockWarningBanner } from "@/components/block-warning-banner"
import { useBlockStatus } from "@/hooks/use-block-status"
import Link from "next/link"
import { GENRES, getSubgenres } from "@/lib/genres"
import { PRODUCT_TYPES, DAW_OPTIONS, type ProductTypeKey } from "@/lib/constants/product-types"
import { Switch } from "@/components/ui/switch"

const ALL_PRICE_OPTIONS = Array.from({ length: 14 }, (_, i) => i * 5000)
const ALL_DISCOUNT_OPTIONS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

export default function UploadPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const router = useRouter()
  const { toast } = useToast()
  const { user, loading: authLoading } = useAuth()
  const [userPlan, setUserPlan] = useState<PlanType>("free")
  const supabase = createClient()

  const [productType, setProductType] = useState<ProductTypeKey>("sample_pack")
  const [dawCompatibility, setDawCompatibility] = useState<string[]>([])
  const [plugin, setPlugin] = useState("")

  // Form states
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [genre, setGenre] = useState("")
  const [subgenre, setSubgenre] = useState("")
  const [bpmRange, setBpmRange] = useState("")
  const [fileSize, setFileSize] = useState("")
  const [fileCount, setFileCount] = useState(0)
  const [price, setPrice] = useState("")
  const [ownershipConfirmed, setOwnershipConfirmed] = useState(false)
  const [licenseAccepted, setLicenseAccepted] = useState(false)

  // File states
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [demoFile, setDemoFile] = useState<File | null>(null)
  const [demoFileName, setDemoFileName] = useState("")
  const [packFile, setPackFile] = useState<File | null>(null)
  const [zipFileName, setZipFileName] = useState("")

  const [hasDiscount, setHasDiscount] = useState(false)
  const [discountPercent, setDiscountPercent] = useState("")

  // Tags state
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")

  const [uploadError, setUploadError] = useState<string | null>(null)
  const [fileSizeError, setFileSizeError] = useState<string | null>(null)

  const [canUpload, setCanUpload] = useState(true)
  const [uploadBlockReason, setUploadBlockReason] = useState<string | null>(null)
  const [mpConnected, setMpConnected] = useState(false)
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
    if (authLoading) return

    if (!user) {
      router.push("/login")
      return
    }

    setIsAuthenticated(true)

    const fetchUserPlan = async () => {
      try {
        console.log("[v0] Fetching plan for user:", user.id)

        const { data: existingProfile, error: fetchError } = await supabase
          .from("profiles")
          .select("plan, mp_connected")
          .eq("id", user.id)
          .single()

        if (fetchError?.code === "PGRST116") {
          const newProfile = {
            id: user.id,
            username: user.email?.split("@")[0] || `user_${user.id.slice(0, 8)}`,
            plan: "free" as PlanType,
            mp_connected: false,
          }
          const { error: insertError } = await supabase.from("profiles").insert(newProfile)
          if (!insertError) {
            console.log("[v0] Profile created successfully")
            setUserPlan("free")
            setMpConnected(false)
            await checkUploadLimits(user.id, "free")
          } else {
            console.warn("[v0] Could not create profile:", insertError.message)
            setUserPlan("free")
            setMpConnected(false)
            setCanUpload(true)
          }
        } else if (fetchError) {
          console.warn("[v0] Error fetching profile:", fetchError.message)
          setUserPlan("free")
          setMpConnected(false)
          setCanUpload(true)
        } else if (existingProfile) {
          let plan = (existingProfile.plan as string) || "free"
          plan = plan.replace(/-/g, "_")
          setUserPlan(plan as PlanType)
          setMpConnected(existingProfile.mp_connected || false)
          console.log("[v0] User plan:", plan)
          await checkUploadLimits(user.id, plan as PlanType)
        }
      } catch (error) {
        console.warn("[v0] Could not fetch plan, using default", error)
        setUserPlan("free")
        setMpConnected(false)
        setCanUpload(true)
      }
    }

    const checkUploadLimits = async (userId: string, plan: PlanType) => {
      try {
        const { data: packs, error } = await supabase.from("packs").select("id, created_at").eq("user_id", userId)

        if (error) {
          console.warn("[v0] Error checking upload limits:", error)
          setCanUpload(true)
          return
        }

        const totalPacks = packs?.length || 0
        const planLimits = PLAN_FEATURES[plan]

        if (plan === "free" && totalPacks >= 3) {
          setCanUpload(false)
          setUploadBlockReason("Has alcanzado el límite de 3 packs para el plan gratuito.")
          return
        }

        if (planLimits.maxPacksPerMonth) {
          const now = new Date()
          const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

          const packsThisMonth = packs?.filter((p) => new Date(p.created_at) >= firstDayOfMonth).length || 0

          if (packsThisMonth >= planLimits.maxPacksPerMonth) {
            setCanUpload(false)
            setUploadBlockReason(`Has alcanzado el límite de ${planLimits.maxPacksPerMonth} packs por mes.`)
            return
          }
        }

        setCanUpload(true)
        setUploadBlockReason(null)
      } catch (error) {
        console.error("[v0] Error checking limits:", error)
        setCanUpload(true)
      }
    }

    fetchUserPlan()
  }, [user, authLoading, router, supabase])

  const toggleDawCompatibility = (daw: string) => {
    setDawCompatibility((prev) => (prev.includes(daw) ? prev.filter((d) => d !== daw) : [...prev, daw]))
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
          console.error("[v0] Bucket error:", error)
          throw new Error("Error de configuración de storage. Contacta al soporte.")
        }
        console.error(`[v0] Error uploading ${folder} file:`, error)
        throw error
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
      throw new Error(error.message || `Error uploading ${folder} file`)
    }
  }

  const handleGenreChange = (value: string) => {
    setGenre(value)
    setSubgenre("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setUploadError(null)
    setUploadProgress(0)

    // Validation
    if (!title || !genre || !price || !coverFile || !demoFile || !packFile || !ownershipConfirmed || !licenseAccepted) {
      setUploadError("Por favor completá todos los campos requeridos y aceptá la licencia")
      toast({
        title: "Campos incompletos",
        description: "Por favor completá todos los campos requeridos y aceptá la licencia",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    if (priceNumber > 0 && !mpConnected) {
      toast({
        title: "Mercado Pago no conectado",
        description: "Necesitás conectar tu cuenta de Mercado Pago para vender packs. Andá a tu perfil.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    if (packFile && packFile.size > MAX_FILE_SIZE_BYTES) {
      const fileSizeMB = (packFile.size / (1024 * 1024)).toFixed(2)
      toast({
        title: "Archivo demasiado grande",
        description: `El archivo (${fileSizeMB} MB) excede el límite de ${MAX_FILE_SIZE_MB} MB para tu plan.`,
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    if (hasDiscount && discountPercentNumber > MAX_DISCOUNT) {
      toast({
        title: "Descuento no permitido",
        description: `Tu plan permite máximo ${MAX_DISCOUNT}% de descuento`,
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      if (!user) throw new Error("No user found")

      console.log("[v0] Validating pack upload...")
      const validation = await validatePackUpload(user.id, userPlan, priceNumber)
      if (!validation.valid) {
        console.log("[v0] Validation failed:", validation.errors[0])
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
      console.error("[v0] Validation error:", error)
      setUploadError("Error validating pack upload")
      toast({
        title: "Error de validación",
        description: "Ocurrió un error al validar los datos del pack",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      if (!user) throw new Error("No user found")

      console.log("[v0] Starting file uploads...")
      setUploadProgress(20)
      let coverUrl = null
      try {
        if (coverFile) {
          console.log("[v0] Uploading cover...")
          coverUrl = await uploadFileToStorage(coverFile, "covers")
          console.log("[v0] Cover uploaded:", coverUrl)
        }
      } catch (error: any) {
        console.error("[v0] Cover upload error:", error)
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
        console.log("[v0] Uploading demo...")
        demoUrl = await uploadFileToStorage(demoFile, "demos")
        console.log("[v0] Demo uploaded:", demoUrl)
      } catch (error: any) {
        console.error("[v0] Demo upload error:", error)
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
        console.log("[v0] Uploading pack file...")
        fileUrl = await uploadFileToStorage(packFile, "packs")
        console.log("[v0] Pack file uploaded:", fileUrl)
      } catch (error: any) {
        console.error("[v0] Pack file upload error:", error)
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

      console.log("[v0] Calling /api/packs/upload with data:", {
        title,
        genre,
        subgenre,
        product_type: productType,
        daw_compatibility: dawCompatibility,
        plugin,
        price: Number.parseInt(price),
        has_discount: hasDiscount,
        discountPercent: Number.parseInt(discountPercent),
      })

      const response = await fetch("/api/packs/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          genre,
          subgenre,
          bpm: bpmRange || null,
          product_type: productType,
          daw_compatibility: dawCompatibility,
          plugin: productType === "preset" ? plugin : null,
          price: Number.parseInt(price),
          cover_image_url: coverUrl,
          demo_audio_url: demoUrl,
          file_url: fileUrl,
          tags: tags,
          has_discount: hasDiscount,
          discount_percent: hasDiscount ? Number.parseInt(discountPercent) : 0,
        }),
      })

      console.log("[v0] API response status:", response.status)
      const result = await response.json()
      console.log("[v0] API response data:", result)

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
        console.error("[v0] API error:", errorMsg)
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

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <Card className="p-8 rounded-3xl border-border animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mb-4" />
            <div className="h-4 bg-muted rounded w-96 mb-8" />
            <div className="space-y-6">
              <div className="h-12 bg-muted rounded" />
              <div className="h-12 bg-muted rounded" />
              <div className="h-12 bg-muted rounded" />
            </div>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  const visibleFields = PRODUCT_TYPES[productType].fields

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
          <h1 className="text-4xl md:text-5xl font-black text-foreground mb-3">Publicá tu Producto</h1>
          <p className="text-lg text-muted-foreground">Compartí tus sonidos con miles de productores</p>
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
          <div className="space-y-4">
            <Label htmlFor="productType" className="text-lg font-bold text-foreground">
              Tipo de Producto *
            </Label>
            <Select value={productType} onValueChange={(value: ProductTypeKey) => setProductType(value)}>
              <SelectTrigger className="h-12 rounded-xl bg-card border-border text-base">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRODUCT_TYPES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2">
                      <span>{value.icon}</span>
                      <span>{value.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">{PRODUCT_TYPES[productType].description}</p>
          </div>

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
              <Select value={genre} onValueChange={handleGenreChange} disabled={isLoading}>
                <SelectTrigger className="h-12 rounded-xl bg-card border-border text-base">
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
              <div className="space-y-4 md:col-span-2">
                <Label htmlFor="subgenre" className="text-lg font-bold text-foreground">
                  Subgénero
                </Label>
                <Select value={subgenre} onValueChange={setSubgenre} disabled={isLoading}>
                  <SelectTrigger className="h-12 rounded-xl bg-card border-border text-base">
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

            {visibleFields.includes("bpm") && (
              <div className="space-y-4 md:col-span-2">
                <Label htmlFor="bpmRange" className="text-lg font-bold text-foreground">
                  Rango de BPM {productType === "midi_pack" ? "(Opcional)" : ""}
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
            )}

            {visibleFields.includes("plugin") && (
              <div className="space-y-4 md:col-span-2">
                <Label htmlFor="plugin" className="text-lg font-bold text-foreground">
                  Plugin o Instrumento (Opcional)
                </Label>
                <Input
                  id="plugin"
                  placeholder="Ej: Serum, Omnisphere, Vital"
                  value={plugin}
                  onChange={(e) => setPlugin(e.target.value)}
                  className="text-base h-12 rounded-xl bg-card border-border"
                  disabled={isLoading}
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Label className="text-lg font-bold text-foreground">Compatibilidad con DAW</Label>
            <p className="text-sm text-muted-foreground">Seleccioná los DAWs compatibles con este pack</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {DAW_OPTIONS.map((daw) => (
                <div key={daw} className="flex items-center space-x-2">
                  <Checkbox
                    id={daw}
                    checked={dawCompatibility.includes(daw)}
                    onCheckedChange={() => toggleDawCompatibility(daw)}
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor={daw}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {daw}
                  </Label>
                </div>
              ))}
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
                  <p className="text-sm text-red-500">{fileSizeError}</p>
                </div>
              )}
            </div>
          </div>

          {/* Precio */}
          <div className="space-y-4">
            <Label htmlFor="price" className="text-lg font-bold flex items-center gap-2 text-foreground">
              <DollarSign className="h-5 w-5 text-primary" />
              Precio (ARS) *
            </Label>
            <Select value={price} onValueChange={setPrice} disabled={isLoading}>
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
            <p className="text-sm text-muted-foreground">Precio máximo permitido: ${MAX_PRICE.toLocaleString()} ARS</p>
          </div>

          {/* Replaced discount section */}
          {priceNumber > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="hasDiscount" className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Percent className="h-5 w-5 text-primary" />
                    Aplicar Descuento
                  </Label>
                  <p className="text-sm text-foreground">
                    Los descuentos se aplican automáticamente para todos los compradores
                  </p>
                </div>
                <Switch id="hasDiscount" checked={hasDiscount} onCheckedChange={setHasDiscount} disabled={isLoading} />
              </div>

              {hasDiscount && (
                <div className="space-y-4">
                  <Label htmlFor="discountPercent" className="text-base font-bold text-foreground">
                    Porcentaje de Descuento (máx. {MAX_DISCOUNT}%)
                  </Label>
                  <Select value={discountPercent} onValueChange={setDiscountPercent} disabled={isLoading}>
                    <SelectTrigger className="h-12 rounded-xl bg-card border-border">
                      <SelectValue placeholder="Seleccionar descuento" />
                    </SelectTrigger>
                    <SelectContent>
                      {DISCOUNT_OPTIONS.filter((d) => d > 0).map((discount) => (
                        <SelectItem key={discount} value={discount.toString()}>
                          {discount}% OFF
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Este descuento será visible y se aplicará automáticamente en todas las compras
                  </p>
                </div>
              )}
            </div>
          )}

          {priceNumber > 0 && (
            <Card className="p-8 rounded-3xl border-border bg-card">
              <h3 className="font-bold text-foreground mb-4 text-xl flex items-center gap-2">
                <Percent className="h-5 w-5 text-primary" />
                Descuentos y Ofertas
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Switch
                    id="hasDiscount"
                    checked={hasDiscount}
                    onCheckedChange={setHasDiscount}
                    disabled={isLoading}
                  />
                  <Label htmlFor="hasDiscount" className="font-semibold text-foreground cursor-pointer">
                    Activar descuento u oferta
                  </Label>
                </div>

                {hasDiscount && (
                  <div className="space-y-4 pl-1">
                    <div className="space-y-3">
                      <Label htmlFor="discountPercent" className="text-sm font-semibold text-foreground">
                        Porcentaje de descuento *
                      </Label>
                      <Select value={discountPercent} onValueChange={setDiscountPercent} disabled={isLoading}>
                        <SelectTrigger className="h-12 rounded-xl bg-card border-border">
                          <SelectValue placeholder="Seleccionar descuento" />
                        </SelectTrigger>
                        <SelectContent>
                          {DISCOUNT_OPTIONS.map((discount) => (
                            <SelectItem key={discount} value={discount.toString()}>
                              {discount}% OFF
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Descuento máximo para tu plan: {MAX_DISCOUNT}%</p>
                    </div>

                    {/* Removed discount code related fields as per update */}

                    {/* Removed discount type related fields as per update */}
                  </div>
                )}
              </div>
            </Card>
          )}

          {priceNumber > 0 && (
            <Card className="p-8 rounded-3xl border-border bg-card">
              <h3 className="font-bold text-foreground mb-4 text-xl">Resumen de Ganancia</h3>
              <div className="space-y-3 text-base">
                <div className="flex justify-between items-center">
                  <span className="text-foreground">Precio del pack:</span>
                  <span className="font-bold text-foreground text-lg">
                    ${new Intl.NumberFormat("es-AR").format(priceNumber)} ARS
                  </span>
                </div>
                {hasDiscount && discountPercentNumber > 0 && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-foreground">Descuento ({discountPercentNumber}%):</span>
                      <span className="font-bold text-orange-500 text-lg">
                        - ${new Intl.NumberFormat("es-AR").format(discountAmount)} ARS
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-foreground">Precio para el comprador:</span>
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

          {/* Tags */}
          <div className="space-y-4">
            <Label htmlFor="tags" className="text-lg font-bold flex items-center gap-2 text-foreground">
              <Tag className="h-5 w-5 text-primary" />
              Tags (máx. 5)
            </Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder="Ingresá un tag (máx. 12 caracteres)"
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyDown={handleTagKeyDown}
                className="flex-1 h-12 rounded-xl bg-card border-border text-base"
                disabled={isLoading || tags.length >= 5}
              />
              <Button
                type="button"
                onClick={addTag}
                disabled={!tagInput.trim() || tags.length >= 5 || isLoading}
                className="rounded-xl h-12 px-6"
              >
                Agregar
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="px-3 py-2 text-sm flex items-center gap-2">
                    {tag}
                    <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => removeTag(tag)} />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* License Agreements */}
          <Card className="p-8 rounded-3xl border-border bg-card">
            <h3 className="font-bold text-foreground mb-6 text-xl flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Acuerdos y Licencia
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-5 border-2 border-border rounded-xl">
                <Checkbox
                  id="ownership"
                  checked={ownershipConfirmed}
                  onCheckedChange={(checked) => setOwnershipConfirmed(checked as boolean)}
                  disabled={isLoading}
                  className="mt-1"
                />
                <Label
                  htmlFor="ownership"
                  className="text-sm text-foreground cursor-pointer leading-relaxed font-medium"
                >
                  Confirmo que soy el creador original de este contenido y tengo todos los derechos para venderlo *
                </Label>
              </div>

              <div className="flex items-start gap-4 p-5 border-2 border-border rounded-xl">
                <Checkbox
                  id="license"
                  checked={licenseAccepted}
                  onCheckedChange={(checked) => setLicenseAccepted(checked as boolean)}
                  disabled={isLoading}
                  className="mt-1"
                />
                <Label htmlFor="license" className="text-sm cursor-pointer leading-relaxed flex-1 font-medium">
                  <span className="text-foreground">
                    Acepto los{" "}
                    <Link href="/license" target="_blank" className="text-primary hover:underline font-semibold">
                      términos de la licencia de uso
                    </Link>{" "}
                    y autorizo que mis productos sean distribuidos bajo estos términos *
                  </span>
                </Label>
              </div>
            </div>
          </Card>

          <Button
            type="submit"
            disabled={isLoading || !canUpload}
            className="w-full h-16 text-lg font-bold rounded-full gap-3"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="h-6 w-6" />
                Publicar Pack
              </>
            )}
          </Button>
        </form>
      </main>

      <Footer />
    </div>
  )
}
