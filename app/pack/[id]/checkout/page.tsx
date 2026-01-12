"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import type { DiscountCode, PriceBreakdown } from "@/types/discount"
import { PLAN_FEATURES, type PlanType } from "@/lib/plans"
import { formatPrice } from "@/lib/utils" // Import formatPrice function

const ALLOWED_PRICES = [
  1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500, 8000, 8500, 9000, 9500, 10000,
  11000, 12000, 13000, 14000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000, 55000, 60000, 65000,
]

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
  const [customPrice, setCustomPrice] = useState<number | null>(null)
  const [availablePrices, setAvailablePrices] = useState<number[]>([])
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown>({
    basePrice: 0,
    discountAmount: 0,
    discountPercentage: 0,
    platformCommission: 0,
    platformCommissionAmount: 0,
    totalToPay: 0,
    creatorEarnings: 0,
  })

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

          const maxPrice = PLAN_FEATURES[data.profiles.plan as PlanType].maxPrice
          const filtered = maxPrice ? ALLOWED_PRICES.filter((p) => p <= maxPrice) : ALLOWED_PRICES
          setAvailablePrices(filtered)
        }

        const { data: offerData } = await supabase.rpc("get_active_offer", { p_pack_id: packId }).maybeSingle()

        if (offerData) {
          setActiveOffer(offerData)
          setAppliedDiscount({
            code: "OFERTA ACTIVA",
            type: "general",
            percentage: offerData.discount_percent,
            isValid: true,
          })
        } else if (data.has_discount && data.discount_percent > 0) {
          setAppliedDiscount({
            code: "DESCUENTO",
            type: "general",
            percentage: data.discount_percent,
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

  const checkDiscounts = () => {
    if (!pack) return

    const basePrice = customPrice || pack.price

    // Check if pack has automatic discount
    if (pack.has_discount && pack.discount_percent > 0) {
      console.log("[v0] Automatic discount detected:", pack.discount_percent)
      const discountAmount = Math.floor(basePrice * (pack.discount_percent / 100))
      const totalToPay = basePrice - discountAmount
      setPriceBreakdown({
        basePrice: basePrice,
        discountAmount: discountAmount,
        discountPercentage: pack.discount_percent,
        platformCommission: platformCommission,
        platformCommissionAmount: Math.floor(totalToPay * platformCommission),
        totalToPay: totalToPay,
        creatorEarnings: Math.floor(totalToPay * (1 - platformCommission)),
      })
      return
    }

    // No discount
    console.log("[v0] No discount available")
    setPriceBreakdown({
      basePrice: basePrice,
      discountAmount: 0,
      discountPercentage: 0,
      platformCommission: platformCommission,
      platformCommissionAmount: Math.floor(basePrice * platformCommission),
      totalToPay: basePrice,
      creatorEarnings: Math.floor(basePrice * (1 - platformCommission)),
    })
  }

  useEffect(() => {
    if (pack) {
      checkDiscounts()
    }
  }, [pack, platformCommission, customPrice])

  const handleConfirmPurchase = async () => {
    setIsProcessing(true)

    try {
      const { purchasePack } = await import("@/app/plans/actions")
      const result = await purchasePack(
        packId,
        appliedDiscount?.isValid ? discountCode : undefined,
        customPrice || undefined,
      )

      if (result?.success && result.init_point) {
        window.location.href = result.init_point
      } else {
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <Link href={`/pack/${packId}`}>
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver al pack
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {step === "summary" && (
              <>
                <Card className="p-6 rounded-3xl border-border">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-muted">
                      <img
                        src={pack.cover_image_url || "/placeholder.svg"}
                        alt={pack.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground text-lg mb-1 truncate">{pack.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{pack.genre}</p>
                      <div className="flex items-baseline gap-2">
                        {priceBreakdown.discountPercentage > 0 ? (
                          <>
                            <span className="text-2xl font-black text-primary">
                              ${formatPrice(priceBreakdown.totalToPay)}
                            </span>
                            <span className="text-lg text-muted-foreground line-through">
                              ${formatPrice(priceBreakdown.basePrice)}
                            </span>
                            <Badge className="bg-orange-500 hover:bg-orange-600 text-white">
                              {priceBreakdown.discountPercentage}% OFF
                            </Badge>
                          </>
                        ) : (
                          <span className="text-2xl font-black text-primary">
                            ${formatPrice(customPrice || pack.price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                {availablePrices.length > 0 && (
                  <Card className="p-6 rounded-3xl border-border">
                    <h3 className="font-bold text-foreground mb-4 text-lg">Precio personalizado (opcional)</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Seleccioná un precio personalizado para esta compra. Respeta el máximo de tu plan actual.
                    </p>
                    <div className="space-y-3">
                      <Label htmlFor="custom-price" className="text-sm font-semibold">
                        Elegí un precio
                      </Label>
                      <select
                        id="custom-price"
                        className="w-full h-12 px-4 rounded-xl border border-input bg-background text-foreground"
                        value={customPrice || pack.price}
                        onChange={(e) => {
                          const value = Number.parseInt(e.target.value)
                          setCustomPrice(value === pack.price ? null : value)
                        }}
                      >
                        <option value={pack.price}>Precio base (${formatPrice(pack.price)})</option>
                        {availablePrices
                          .filter((p) => p !== pack.price)
                          .map((price) => (
                            <option key={price} value={price}>
                              ${formatPrice(price)} ARS
                            </option>
                          ))}
                      </select>
                    </div>
                  </Card>
                )}

                <Button className="w-full rounded-full h-14 text-base font-bold" onClick={() => setStep("payment")}>
                  Continuar al pago
                </Button>
              </>
            )}

            {step === "payment" && (
              <>
                <Card className="p-6 rounded-3xl border-border">
                  <h2 className="text-2xl font-black text-foreground mb-6">Método de pago</h2>

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
                      Serás redirigido a Mercado Pago para completar tu pago de forma segura.
                    </div>
                  </div>
                </Card>

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-full h-12 bg-transparent"
                    onClick={() => setStep("summary")}
                  >
                    Volver
                  </Button>
                  <Button className="flex-1 rounded-full h-12" onClick={handleConfirmPurchase} disabled={isProcessing}>
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Procesando...
                      </>
                    ) : (
                      "Confirmar y Pagar"
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6 rounded-3xl border-border sticky top-24">
              <h3 className="font-bold text-foreground mb-4 text-lg">Resumen de compra</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Precio base:</span>
                  <span className="font-semibold text-foreground">${formatPrice(priceBreakdown.basePrice)}</span>
                </div>
                {priceBreakdown.discountPercentage > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Descuento ({priceBreakdown.discountPercentage}%):</span>
                    <span className="font-semibold text-green-600">-${formatPrice(priceBreakdown.discountAmount)}</span>
                  </div>
                )}
                <div className="border-t border-border pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-foreground text-base">Total:</span>
                    <span className="font-black text-primary text-2xl">${formatPrice(priceBreakdown.totalToPay)}</span>
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
