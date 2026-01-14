"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { PLAN_FEATURES, type PlanType } from "@/lib/plans"
import { formatPrice } from "@/lib/utils"

export default function CheckoutPage() {
  const params = useParams()
  const packId = params.id as string
  const router = useRouter()
  const supabase = createBrowserClient()

  const [pack, setPack] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<"summary" | "payment">("summary")
  const [isProcessing, setIsProcessing] = useState(false)
  const [creatorPlan, setCreatorPlan] = useState<PlanType>("free")
  const [platformCommission, setPlatformCommission] = useState<number>(0)
  const [priceBreakdown, setPriceBreakdown] = useState<{
    basePrice: number
    discountAmount: number
    totalToPay: number
  }>({
    basePrice: 0,
    discountAmount: 0,
    totalToPay: 0,
  })

  useEffect(() => {
    const fetchPack = async () => {
      try {
        console.log("[v0] Fetching pack with ID:", packId)

        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        if (!authUser) {
          console.log("[v0] No authenticated user, redirecting to login")
          router.push("/login")
          return
        }

        console.log("[v0] Authenticated user:", authUser.id)
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

        console.log("[v0] Pack query result:", { data, error })

        if (error) {
          console.error("[v0] Error fetching pack:", error)
          throw error
        }

        if (!data) {
          console.error("[v0] No pack data returned")
          return
        }

        console.log("[v0] Pack fetched successfully:", data.title)
        setPack(data)

        if (data.profiles?.plan) {
          setCreatorPlan(data.profiles.plan as PlanType)
          setPlatformCommission(PLAN_FEATURES[data.profiles.plan as PlanType].commission)
        }
      } catch (error) {
        console.error("[v0] Error in fetchPack:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPack()
  }, [packId, router, supabase])

  useEffect(() => {
    if (pack) {
      const basePrice = pack.price

      if (pack.has_discount && pack.discount_percent > 0) {
        const discountAmount = Math.floor(basePrice * (pack.discount_percent / 100))
        const totalToPay = basePrice - discountAmount
        setPriceBreakdown({
          basePrice: basePrice,
          discountAmount: discountAmount,
          totalToPay: totalToPay,
        })
      } else {
        setPriceBreakdown({
          basePrice: basePrice,
          discountAmount: 0,
          totalToPay: basePrice,
        })
      }
    }
  }, [pack])

  const handleConfirmPurchase = async () => {
    console.log("[v0] Starting purchase for packId:", packId)
    setIsProcessing(true)

    try {
      const { purchasePack } = await import("@/app/plans/actions")
      console.log("[v0] Calling purchasePack with packId:", packId)

      const result = await purchasePack(
        packId,
        undefined, // no discount code
      )

      console.log("[v0] purchasePack result:", result)

      if (result?.success && result.init_point) {
        console.log("[v0] Redirecting to payment:", result.init_point)
        window.location.href = result.init_point
      } else {
        console.error("[v0] Payment failed:", result?.message)
        alert(`Error: ${result?.message || "No se pudo procesar el pago"}`)
      }
    } catch (error) {
      console.error("[v0] Error in handleConfirmPurchase:", error)
      alert("Error al procesar el pago. Intentá de nuevo.")
    } finally {
      setIsProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    )
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
                        {priceBreakdown.discountAmount > 0 ? (
                          <>
                            <span className="text-2xl font-black text-primary">
                              ${formatPrice(priceBreakdown.totalToPay)}
                            </span>
                            <span className="text-lg text-muted-foreground line-through">
                              ${formatPrice(priceBreakdown.basePrice)}
                            </span>
                            <Badge className="bg-orange-500 hover:bg-orange-600 text-white">
                              {pack.discount_percent}% OFF
                            </Badge>
                          </>
                        ) : (
                          <span className="text-2xl font-black text-primary">
                            ${formatPrice(priceBreakdown.totalToPay)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

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
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
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
                {priceBreakdown.discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Descuento ({pack.discount_percent}%):</span>
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
