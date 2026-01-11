"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Check,
  Zap,
  Crown,
  Sparkles,
  RefreshCw,
  X,
  TrendingUp,
  FileArchive,
  DollarSign,
  Percent,
  Download,
  BarChart3,
  Star,
} from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { PlanType } from "@/lib/plans"
import { PLAN_FEATURES } from "@/lib/plans"
import { selectPlan } from "./actions"
import { toast } from "@/hooks/use-toast"

export default function PlansPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [currentPlan, setCurrentPlan] = useState<PlanType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    fetchCurrentPlan()
  }, [])

  const fetchCurrentPlan = async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.log("[v0] No user logged in")
        setCurrentPlan(null)
        return
      }

      const { data: profile, error } = await supabase.from("profiles").select("plan").eq("id", user.id).single()

      if (error) {
        console.error("[v0] Error fetching current plan:", error)
        return
      }

      const userPlan = (profile?.plan || "free") as PlanType
      console.log("[v0] Current user plan from database:", userPlan)
      setCurrentPlan(userPlan)
    } catch (error) {
      console.error("[v0] Error in fetchCurrentPlan:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const plans = [
    {
      id: "free",
      name: "FREE",
      icon: Sparkles,
      price: 0,
      priceLabel: "Gratis",
      subtitle: "Para comenzar",
      features: [
        { icon: FileArchive, text: "Hasta 3 packs activos", included: true },
        { icon: FileArchive, text: "Tamaño máximo por pack: 80 MB", included: true },
        { icon: DollarSign, text: `Comisión: ${(PLAN_FEATURES.free.commission * 100).toFixed(0)}%`, included: true },
        { icon: DollarSign, text: "Máximo precio por pack: $15.000 ARS", included: true },
        { icon: Percent, text: "Máximo descuento: 10%", included: true },
        { icon: Download, text: "Hasta 10 descargas gratuitas por mes", included: true },
        { icon: BarChart3, text: "Sin acceso a estadísticas avanzadas", included: false },
        { icon: Star, text: "Sin prioridad en destacados", included: false },
      ],
      buttonText: "Plan Actual",
      variant: "outline" as const,
      isPopular: false,
    },
    {
      id: "de_0_a_hit",
      name: "De 0 a Hit",
      icon: Zap,
      price: 100,
      priceLabel: "5.000 ARS",
      subtitle: "Para productores activos",
      features: [
        { icon: FileArchive, text: "Hasta 10 packs activos", included: true },
        { icon: FileArchive, text: "Tamaño máximo por pack: 250 MB", included: true },
        {
          icon: DollarSign,
          text: `Comisión: ${(PLAN_FEATURES.de_0_a_hit.commission * 100).toFixed(0)}%`,
          included: true,
        },
        { icon: DollarSign, text: "Máximo precio por pack: $65.000 ARS", included: true },
        { icon: Percent, text: "Máximo descuento: 50%", included: true },
        { icon: Download, text: "Descargas ilimitadas", included: true },
        { icon: BarChart3, text: "Acceso a estadísticas completas", included: true },
        { icon: Star, text: "Soporte prioritario", included: true },
      ],
      buttonText: "Elegir Plan",
      variant: "default" as const,
      isPopular: true,
    },
    {
      id: "studio_plus",
      name: "Studio Plus",
      icon: Crown,
      price: 15000,
      priceLabel: "15.000 ARS",
      subtitle: "Para profesionales",
      features: [
        { icon: FileArchive, text: "Packs ilimitados", included: true },
        { icon: FileArchive, text: "Tamaño máximo por pack: 500 MB", included: true },
        {
          icon: DollarSign,
          text: `Comisión: ${(PLAN_FEATURES.studio_plus.commission * 100).toFixed(0)}%`,
          included: true,
        },
        { icon: DollarSign, text: "Máximo precio por pack: ilimitado", included: true },
        { icon: Percent, text: "Máximo descuento: 100%", included: true },
        { icon: Download, text: "Descargas ilimitadas", included: true },
        { icon: BarChart3, text: "Acceso a estadísticas + gráficas detalladas", included: true },
        { icon: Star, text: "Soporte premium", included: true },
        { icon: TrendingUp, text: "Promoción destacada de packs", included: true },
      ],
      buttonText: "Elegir Plan",
      variant: "default" as const,
      isPopular: false,
    },
  ]

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId)
  }

  const handleProceedToPayment = async () => {
    if (!selectedPlan || selectedPlan === "free") return

    setIsProcessing(true)
    try {
      const result = await selectPlan(selectedPlan)

      if (result?.success && result.init_point) {
        // Redirect to Mercado Pago checkout
        window.location.href = result.init_point
      } else {
        toast({
          title: "Error",
          description: result?.message || "Error al procesar el pago",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error proceeding to payment:", error)
      toast({
        title: "Error",
        description: "Hubo un error al procesar el pago. Intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary border border-primary/20 mb-6">
              <Zap className="h-4 w-4" />
              PLANES Y PRECIOS
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4">Elegí tu plan ideal</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Vendé más y maximizá tus ganancias con los planes de ARSOUND
            </p>
            {currentPlan && (
              <div className="mt-6 flex items-center justify-center gap-3">
                <Badge variant="secondary" className="text-base px-4 py-2">
                  Tu plan actual:{" "}
                  <span className="font-bold ml-1">{plans.find((p) => p.id === currentPlan)?.name || currentPlan}</span>
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={fetchCurrentPlan}
                  disabled={isLoading}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            )}
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {plans.map((plan) => {
              const Icon = plan.icon
              const isCurrentPlan = currentPlan === plan.id

              return (
                <Card
                  key={plan.id}
                  className={`p-8 rounded-3xl border-2 relative transition-all hover:shadow-lg ${
                    plan.isPopular ? "border-primary shadow-lg scale-105" : "border-border"
                  } ${selectedPlan === plan.id ? "ring-2 ring-primary" : ""} ${
                    isCurrentPlan ? "ring-2 ring-green-500" : ""
                  }`}
                >
                  {plan.isPopular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                      Más Popular
                    </Badge>
                  )}
                  {isCurrentPlan && (
                    <Badge className="absolute -top-3 right-8 bg-green-500 text-white">Plan Actual</Badge>
                  )}

                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        plan.id === "free"
                          ? "bg-blue-500/10 text-blue-500"
                          : plan.id === "de_0_a_hit"
                            ? "bg-orange-500/10 text-orange-500"
                            : "bg-purple-500/10 text-purple-500"
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-foreground">{plan.name}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">{plan.subtitle}</p>

                  <div className="mb-8">
                    <div className="text-4xl font-black text-foreground mb-1">{plan.priceLabel}</div>
                    {plan.price > 0 && <div className="text-sm text-muted-foreground">por mes</div>}
                    {plan.price === 0 && <div className="text-sm text-muted-foreground">para siempre</div>}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => {
                      const FeatureIcon = feature.icon
                      return (
                        <li key={index} className="flex items-start gap-3">
                          {feature.included ? (
                            <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex items-center gap-2 flex-1">
                            <FeatureIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span
                              className={`text-sm ${feature.included ? "text-foreground" : "text-muted-foreground"}`}
                            >
                              {feature.text}
                            </span>
                          </div>
                        </li>
                      )
                    })}
                  </ul>

                  <Button
                    className="w-full h-12 rounded-full font-bold"
                    variant={plan.variant}
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan ? "Plan Actual" : plan.buttonText}
                  </Button>
                </Card>
              )
            })}
          </div>

          {/* Payment Section */}
          {selectedPlan && selectedPlan !== "free" && (
            <Card className="p-8 rounded-3xl border-2 border-primary bg-primary/5">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-2xl font-black text-foreground mb-6 text-center">Confirmar suscripción</h2>

                <div className="bg-background rounded-2xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-bold text-foreground">
                      Plan {plans.find((p) => p.id === selectedPlan)?.name}
                    </span>
                    <span className="text-2xl font-black text-primary">
                      {plans.find((p) => p.id === selectedPlan)?.priceLabel}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Renovación automática mensual. Cancelá cuando quieras.
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border-2 border-primary rounded-2xl bg-background cursor-pointer hover:bg-accent transition-colors">
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

                  <Button
                    className="w-full h-14 rounded-full font-bold text-lg bg-primary hover:bg-primary/90"
                    onClick={handleProceedToPayment}
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Procesando..." : "Pagar con Mercado Pago"}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Al continuar, aceptás los términos y condiciones de ARSOUND. La suscripción se renovará
                    automáticamente cada mes.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Detailed Comparison Table */}
          <div className="mt-16">
            <h2 className="text-3xl font-black text-foreground mb-8 text-center">Comparación detallada</h2>

            <Card className="p-6 rounded-3xl border-border overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-4 font-bold text-foreground">Característica</th>
                    <th className="text-center py-4 px-4 font-bold text-foreground">FREE</th>
                    <th className="text-center py-4 px-4 font-bold text-orange-500 bg-orange-500/10 rounded-t-xl">
                      De 0 a Hit
                    </th>
                    <th className="text-center py-4 px-4 font-bold text-purple-500">Studio Plus</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-border">
                    <td className="py-4 px-4 font-semibold text-foreground">Packs activos</td>
                    <td className="py-4 px-4 text-center text-muted-foreground">Hasta 3</td>
                    <td className="py-4 px-4 text-center bg-orange-500/5">Hasta 10</td>
                    <td className="py-4 px-4 text-center text-foreground">Ilimitados</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4 font-semibold text-foreground">Tamaño máximo por pack</td>
                    <td className="py-4 px-4 text-center text-muted-foreground">80 MB</td>
                    <td className="py-4 px-4 text-center bg-orange-500/5">250 MB</td>
                    <td className="py-4 px-4 text-center text-foreground">500 MB</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4 font-semibold text-foreground">Comisión por venta</td>
                    <td className="py-4 px-4 text-center text-muted-foreground">
                      {(PLAN_FEATURES.free.commission * 100).toFixed(0)}%
                    </td>
                    <td className="py-4 px-4 text-center bg-orange-500/5">
                      {(PLAN_FEATURES.de_0_a_hit.commission * 100).toFixed(0)}%
                    </td>
                    <td className="py-4 px-4 text-center text-green-500 font-bold">
                      {(PLAN_FEATURES.studio_plus.commission * 100).toFixed(0)}%
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4 font-semibold text-foreground">Precio máximo por pack</td>
                    <td className="py-4 px-4 text-center text-muted-foreground">$15.000</td>
                    <td className="py-4 px-4 text-center bg-orange-500/5">$65.000</td>
                    <td className="py-4 px-4 text-center text-foreground">$65.000</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4 font-semibold text-foreground">Descuento máximo</td>
                    <td className="py-4 px-4 text-center text-muted-foreground">10%</td>
                    <td className="py-4 px-4 text-center bg-orange-500/5">50%</td>
                    <td className="py-4 px-4 text-center text-foreground">100%</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4 font-semibold text-foreground">Descargas gratuitas por mes</td>
                    <td className="py-4 px-4 text-center text-muted-foreground">10</td>
                    <td className="py-4 px-4 text-center bg-orange-500/5">Ilimitadas</td>
                    <td className="py-4 px-4 text-center text-foreground">Ilimitadas</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4 font-semibold text-foreground">Estadísticas</td>
                    <td className="py-4 px-4 text-center text-muted-foreground">Básicas</td>
                    <td className="py-4 px-4 text-center bg-orange-500/5">Completas</td>
                    <td className="py-4 px-4 text-center text-foreground">Avanzadas + gráficas</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-semibold text-foreground">Soporte</td>
                    <td className="py-4 px-4 text-center text-muted-foreground">Estándar</td>
                    <td className="py-4 px-4 text-center bg-orange-500/5">Prioritario</td>
                    <td className="py-4 px-4 text-center text-foreground">Premium</td>
                  </tr>
                </tbody>
              </table>
            </Card>
          </div>

          {/* Benefits comparison */}
          <div className="mt-16 text-center">
            <h2 className="text-3xl font-black text-foreground mb-4">¿Por qué mejorar tu plan?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
              Accedé a más herramientas para hacer crecer tu negocio de samples y maximizar tus ventas
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 rounded-2xl border-border">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-2">Menos comisiones</h3>
                <p className="text-sm text-muted-foreground">
                  Reducí las comisiones del 15% al 10% o incluso al 3% con Studio Plus
                </p>
              </Card>

              <Card className="p-6 rounded-2xl border-border">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Crown className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-2">Más visibilidad</h3>
                <p className="text-sm text-muted-foreground">
                  Mayor prioridad en destacados para que más usuarios vean tus packs
                </p>
              </Card>

              <Card className="p-6 rounded-2xl border-border">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-2">Estadísticas completas</h3>
                <p className="text-sm text-muted-foreground">
                  Accedé a todas las métricas para entender mejor a tu audiencia
                </p>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
