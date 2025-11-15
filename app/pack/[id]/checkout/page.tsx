"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Check, Loader2, Tag, AlertCircle } from 'lucide-react'
import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from "@/lib/supabase/client"
import type { DiscountCode, PriceBreakdown } from "@/types/discount"
import { validateDiscountCode as validateDiscountInput } from "@/types/offer"
import { PLAN_FEATURES, type PlanType } from "@/lib/plans"

export default function CheckoutPage() {
  const params = useParams()
  const packId = params.id as string
  const router = useRouter()
  const supabase = createBrowserClient()

  const [pack, setPack] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [discountCode, setDiscountCode] = useState("")
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null)
  const [isValidatingCode, setIsValidatingCode] = useState(false)
  const [step, setStep] = useState<"summary" | "payment" | "confirm">("summary")
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeOffer, setActiveOffer] = useState<any>(null)
  const [creatorPlan, setCreatorPlan] = useState<PlanType>("free")
  const [platformCommission, setPlatformCommission] = useState<number>(0)

  useEffect(() => {
    const fetchPack = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        if (!authUser) {
          router.push("/login")
          return
        }

        setUser(authUser)

        const { data, error } = await supabase
          .from("packs")
          .select(`
            *,
            profiles (
              username,
              avatar_url,
              id,
              plan
            )
          `)
          .eq("id", packId)
          .single()

        if (error) throw error
        setPack(data)

        if (data.profiles?.plan) {
          setCreatorPlan(data.profiles.plan as PlanType)
          setPlatformCommission(PLAN_FEATURES[data.profiles.plan as PlanType].commission)
        }

        const { data: offerData } = await supabase.rpc("get_active_offer", { p_pack_id: packId }).single()

        if (offerData) {
          setActiveOffer(offerData)
          setAppliedDiscount({
            code: "OFERTA ACTIVA",
            type: "general",
            percentage: offerData.discount_percent,
            isValid: true,
          })
        }
      } catch (error) {
        console.error("Error fetching pack:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPack()
  }, [packId, router, supabase])

  useEffect(() => {
    const checkIfFree = async () => {
      if (pack && pack.price === 0) {
        try {
          const response = await fetch(`/api/packs/${packId}/download`)
          if (response.ok) {
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `${pack.title.replace(/[^a-zA-Z0-9]/g, "_")}.zip`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
            router.push(`/pack/${packId}`)
          }
        } catch (error) {
          console.error("Error downloading free pack:", error)
          router.push(`/pack/${packId}`)
        }
      }
    }
    if (pack && loading === false) {
      checkIfFree()
    }
  }, [pack, loading, packId, router])

  // Calculate price breakdown
  const calculatePriceBreakdown = (): PriceBreakdown => {
    if (!pack) {
      return {
        basePrice: 0,
        discountAmount: 0,
        discountPercentage: 0,
        platformCommission: platformCommission,
        platformCommissionAmount: 0,
        totalToPay: 0,
        creatorEarnings: 0,
      }
    }

    const basePrice = pack.price
    const discountPercentage = appliedDiscount?.isValid ? appliedDiscount.percentage : 0
    const discountAmount = basePrice * (discountPercentage / 100)
    const totalToPay = basePrice - discountAmount
    const platformCommissionAmount = totalToPay * platformCommission
    const creatorEarnings = totalToPay - platformCommissionAmount

    return {
      basePrice,
      discountAmount,
      discountPercentage,
      platformCommission: platformCommission,
      platformCommissionAmount,
      totalToPay,
      creatorEarnings,
    }
  }

  const validateCode = async (code: string) => {
    if (!code.trim()) {
      setAppliedDiscount(null)
      return
    }

    setIsValidatingCode(true)

    try {
      const { data: discountData, error } = await supabase
        .from("discount_codes")
        .select("*")
        .eq("pack_id", packId)
        .eq("code", code.toUpperCase())
        .single()

      if (error || !discountData) {
        setAppliedDiscount({
          code: code.toUpperCase(),
          type: "general",
          percentage: 0,
          isValid: false,
          errorMessage: "Código de descuento inválido",
        })
        setIsValidatingCode(false)
        return
      }

      const validation = validateDiscountInput(code, discountData.discount_percent.toString())

      if (!validation.isValid) {
        setAppliedDiscount({
          code: code.toUpperCase(),
          type: "general",
          percentage: 0,
          isValid: false,
          errorMessage: validation.message,
        })
        setIsValidatingCode(false)
        return
      }

      // Check if expired
      if (discountData.expires_at && new Date(discountData.expires_at) < new Date()) {
        setAppliedDiscount({
          code: code.toUpperCase(),
          type: "general",
          percentage: 0,
          isValid: false,
          errorMessage: "Este código ha expirado",
        })
        setIsValidatingCode(false)
        return
      }

      // Check max uses
      if (discountData.max_uses && discountData.uses_count >= discountData.max_uses) {
        setAppliedDiscount({
          code: code.toUpperCase(),
          type: "general",
          percentage: 0,
          isValid: false,
          errorMessage: "Este código ya alcanzó el límite de usos",
        })
        setIsValidatingCode(false)
        return
      }

      if (discountData.for_followers) {
        const { data: followData } = await supabase
          .from("followers")
          .select("id")
          .eq("follower_id", user.id)
          .eq("following_id", pack.profiles.id)
          .single()

        if (!followData) {
          setAppliedDiscount({
            code: code.toUpperCase(),
            type: "follower",
            percentage: 0,
            isValid: false,
            errorMessage: "Este código es solo para seguidores del creador",
          })
          setIsValidatingCode(false)
          return
        }
      }

      if (discountData.for_first_purchase) {
        const { data: purchaseData } = await supabase
          .from("purchases")
          .select("id")
          .eq("buyer_id", user.id)
          .limit(1)
          .single()

        if (purchaseData) {
          setAppliedDiscount({
            code: code.toUpperCase(),
            type: "first_purchase",
            percentage: 0,
            isValid: false,
            errorMessage: "Este código es solo para tu primera compra",
          })
          setIsValidatingCode(false)
          return
        }
      }

      const discountType = discountData.for_followers
        ? "follower"
        : discountData.for_first_purchase
          ? "first_purchase"
          : "general"

      setAppliedDiscount({
        code: code.toUpperCase(),
        type: discountType,
        percentage: discountData.discount_percent,
        isValid: true,
      })
    } catch (error) {
      console.error("Error validating code:", error)
      setAppliedDiscount({
        code: code.toUpperCase(),
        type: "general",
        percentage: 0,
        isValid: false,
        errorMessage: "Error al validar el código",
      })
    } finally {
      setIsValidatingCode(false)
    }
  }

  const handleApplyCode = () => {
    validateCode(discountCode)
  }

  const handleRemoveDiscount = () => {
    if (activeOffer) {
      return
    }
    setAppliedDiscount(null)
    setDiscountCode("")
  }

  const handleConfirmPurchase = async () => {
    setIsProcessing(true)

    try {
      const { purchasePack } = await import("@/app/plans/actions")
      const result = await purchasePack(packId, appliedDiscount?.isValid ? discountCode : undefined)

      if (result?.success && result.init_point) {
        // Redirect to Mercado Pago checkout
        window.location.href = result.init_point
      } else {
        // Use toast if available, otherwise alert
        if (typeof window !== "undefined" && window.location) {
          console.error("[v0] Payment failed:", result?.message)
        }
      }
    } catch (error) {
      console.error("[v0] Error in handleConfirmPurchase:", error)
    } finally {
      setIsProcessing(false)
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

  const priceBreakdown = calculatePriceBreakdown()

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
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Link href={`/pack/${packId}`}>
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver al pack
          </Button>
        </Link>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step === "summary" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
                }`}
              >
                {step !== "summary" ? <Check className="h-5 w-5" /> : "1"}
              </div>
              <div className="text-xs font-medium mt-2 text-center">Resumen</div>
            </div>
            <div className={`flex-1 h-0.5 ${step !== "summary" ? "bg-primary" : "bg-border"}`} />
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step === "payment"
                    ? "bg-primary text-primary-foreground"
                    : step === "confirm"
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {step === "confirm" ? <Check className="h-5 w-5" /> : "2"}
              </div>
              <div className="text-xs font-medium mt-2 text-center">Pago</div>
            </div>
            <div className={`flex-1 h-0.5 ${step === "confirm" ? "bg-primary" : "bg-border"}`} />
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step === "confirm" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                3
              </div>
              <div className="text-xs font-medium mt-2 text-center">Confirmar</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Summary */}
            {step === "summary" && (
              <>
                <Card className="p-6 rounded-3xl border-border">
                  <h2 className="text-2xl font-black text-foreground mb-6">Resumen del pedido</h2>

                  <div className="flex gap-4 mb-6">
                    <img
                      src={pack.cover_image_url || "/placeholder.svg?height=120&width=120"}
                      alt={pack.title}
                      className="w-24 h-24 rounded-2xl object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-foreground mb-1">{pack.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">Por {pack.profiles?.username || "Usuario"}</p>
                      {pack.genre && (
                        <Badge variant="outline" className="text-xs">
                          {pack.genre}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-border pt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="h-4 w-4 text-primary" />
                      <h3 className="font-bold text-foreground">Código de descuento</h3>
                    </div>

                    {activeOffer && (
                      <div className="mb-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                        <div className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-bold text-red-500 text-sm">¡Oferta activa!</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {activeOffer.discount_percent}% de descuento aplicado automáticamente
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {!activeOffer && !appliedDiscount?.isValid && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Ingresá tu código"
                          value={discountCode}
                          onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === "Enter" && handleApplyCode()}
                          className="flex-1 rounded-xl"
                          disabled={isValidatingCode}
                        />
                        <Button
                          onClick={handleApplyCode}
                          disabled={!discountCode.trim() || isValidatingCode}
                          className="rounded-xl"
                        >
                          {isValidatingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
                        </Button>
                      </div>
                    )}

                    {!activeOffer && appliedDiscount && (
                      <div
                        className={`mt-3 p-4 rounded-xl flex items-start gap-3 ${
                          appliedDiscount.isValid
                            ? "bg-green-500/10 border border-green-500/20"
                            : "bg-destructive/10 border border-destructive/20"
                        }`}
                      >
                        {appliedDiscount.isValid ? (
                          <>
                            <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-bold text-green-500 text-sm">¡Código aplicado!</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Descuento del {appliedDiscount.percentage}% aplicado
                              </p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={handleRemoveDiscount} className="text-xs">
                              Quitar
                            </Button>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-bold text-destructive text-sm">{appliedDiscount.errorMessage}</p>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </Card>

                <Button className="w-full rounded-full h-14 text-base font-bold" onClick={() => setStep("payment")}>
                  Continuar al pago
                </Button>
              </>
            )}

            {/* Step 2: Payment Method */}
            {step === "payment" && (
              <>
                <Card className="p-6 rounded-3xl border-border">
                  <h2 className="text-2xl font-black text-foreground mb-6">Método de pago</h2>

                  {/* Mercado Pago UI */}
                  <div className="space-y-4">
                    <div className="p-4 border-2 border-primary rounded-2xl bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-[#009EE3] rounded-xl flex items-center justify-center">
                            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="white">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-bold text-foreground">Mercado Pago</div>
                            <div className="text-sm text-muted-foreground">Tarjetas, débito o efectivo</div>
                          </div>
                        </div>
                        <div className="w-5 h-5 rounded-full border-2 border-primary bg-primary flex items-center justify-center">
                          <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 text-sm text-muted-foreground bg-muted/50 rounded-xl">
                      <p className="font-semibold text-foreground mb-2">Pagá con Mercado Pago:</p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>Tarjetas de crédito y débito</li>
                        <li>Dinero en cuenta de Mercado Pago</li>
                        <li>Efectivo en puntos de pago</li>
                      </ul>
                    </div>
                  </div>
                </Card>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-full h-14 text-base font-bold bg-transparent"
                    onClick={() => setStep("summary")}
                  >
                    Volver
                  </Button>
                  <Button className="flex-1 rounded-full h-14 text-base font-bold" onClick={() => setStep("confirm")}>
                    Continuar
                  </Button>
                </div>
              </>
            )}

            {/* Step 3: Confirm Purchase */}
            {step === "confirm" && (
              <>
                <Card className="p-6 rounded-3xl border-border">
                  <h2 className="text-2xl font-black text-foreground mb-6">Confirmar compra</h2>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={pack.cover_image_url || "/placeholder.svg?height=80&width=80"}
                        alt={pack.title}
                        className="w-20 h-20 rounded-xl object-cover"
                      />
                      <div>
                        <h3 className="font-bold text-foreground">{pack.title}</h3>
                        <p className="text-sm text-muted-foreground">Por {pack.profiles?.username || "Usuario"}</p>
                      </div>
                    </div>

                    <div className="border-t border-border pt-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Método de pago:</span>
                        <span className="font-semibold text-foreground">Mercado Pago</span>
                      </div>
                      {appliedDiscount?.isValid && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Código aplicado:</span>
                          <span className="font-semibold text-green-500">{appliedDiscount.code}</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-muted/50 p-4 rounded-xl text-sm text-muted-foreground">
                      Al confirmar la compra, serás redirigido a Mercado Pago para completar el pago de forma segura.
                    </div>
                  </div>
                </Card>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-full h-14 text-base font-bold bg-transparent"
                    onClick={() => setStep("payment")}
                    disabled={isProcessing}
                  >
                    Volver
                  </Button>
                  <Button
                    className="flex-1 rounded-full h-14 text-base font-bold"
                    onClick={handleConfirmPurchase}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Procesando...
                      </>
                    ) : (
                      "Confirmar compra"
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Price Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 rounded-3xl border-border sticky top-4">
              <h3 className="text-lg font-black text-foreground mb-4">Resumen de precio</h3>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Precio base</span>
                  <span className="font-semibold text-foreground">${formatPrice(priceBreakdown.basePrice)}</span>
                </div>

                {appliedDiscount?.isValid && (
                  <div className="flex justify-between text-sm">
                    <span className={activeOffer ? "text-red-500" : "text-green-500"}>
                      Descuento ({appliedDiscount.percentage}%)
                    </span>
                    <span className={`font-semibold ${activeOffer ? "text-red-500" : "text-green-500"}`}>
                      -${formatPrice(priceBreakdown.discountAmount)}
                    </span>
                  </div>
                )}

                <div className="border-t border-border pt-3">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-lg font-bold text-foreground">Total a pagar</span>
                    <span className="text-2xl font-black text-primary">${formatPrice(priceBreakdown.totalToPay)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    {priceBreakdown.totalToPay === 0 ? "" : "ARS"}
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4 mt-4">
                <div className="bg-accent/50 p-4 rounded-xl space-y-2">
                  <h4 className="text-sm font-bold text-foreground">Desglose para el creador</h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Precio base</span>
                      <span className="text-foreground">${formatPrice(priceBreakdown.basePrice)}</span>
                    </div>
                    {appliedDiscount?.isValid && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Descuento aplicado</span>
                        <span className="text-foreground">-${formatPrice(priceBreakdown.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground">${formatPrice(priceBreakdown.totalToPay)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Comisión plataforma ({(platformCommission * 100).toFixed(0)}%)
                      </span>
                      <span className="text-foreground">-${formatPrice(priceBreakdown.platformCommissionAmount)}</span>
                    </div>
                    <div className="border-t border-border pt-1.5 flex justify-between font-bold">
                      <span className="text-foreground">Ganancia del creador</span>
                      <span className="text-primary">${formatPrice(priceBreakdown.creatorEarnings)}</span>
                    </div>
                  </div>
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
