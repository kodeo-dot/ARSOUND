"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Check,
  X,
  Zap,
  Crown,
  Music,
  Download,
  CreditCard,
  FileText,
} from "lucide-react"

type PlanId = "credits" | "unlimited"

interface Plan {
  id: PlanId
  name: string
  subtitle: string
  icon: typeof Zap
  priceARS: number
  priceLabel: string
  period: string
  isPopular: boolean
  features: {
    text: string
    included: boolean
  }[]
  cta: string
}

const plans: Plan[] = [
  {
    id: "credits",
    name: "Monthly Credits",
    subtitle: "Creditos Mensuales",
    icon: Zap,
    priceARS: 4990,
    priceLabel: "4.990",
    period: "/mes",
    isPopular: false,
    features: [
      { text: "100 samples descargables por mes", included: true },
      { text: "Licencia Royalty-free incluida", included: true },
      { text: "Acceso a packs exclusivos", included: true },
      { text: "Formato WAV 24bit / 44.1kHz", included: true },
      { text: "Soporte prioritario", included: true },
      { text: "Descargas ilimitadas", included: false },
      { text: "Acceso anticipado a lanzamientos", included: false },
    ],
    cta: "Comenzar con Credits",
  },
  {
    id: "unlimited",
    name: "Unlimited Access",
    subtitle: "Acceso Ilimitado",
    icon: Crown,
    priceARS: 14990,
    priceLabel: "14.990",
    period: "/mes",
    isPopular: true,
    features: [
      { text: "Descargas ilimitadas de samples", included: true },
      { text: "Licencia Royalty-free incluida", included: true },
      { text: "Acceso total al catalogo completo", included: true },
      { text: "Formatos WAV + MIDI + Stems", included: true },
      { text: "Soporte premium 24/7", included: true },
      { text: "Acceso anticipado a lanzamientos", included: true },
      { text: "Descuentos exclusivos en packs premium", included: true },
    ],
    cta: "Obtener Acceso Ilimitado",
  },
]

interface SubscriptionPlansProps {
  onSelectPlan?: (planId: PlanId) => void
}

export function SubscriptionPlans({ onSelectPlan }: SubscriptionPlansProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null)

  const handleSelect = (planId: PlanId) => {
    setSelectedPlan(planId)
    onSelectPlan?.(planId)
  }

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <Badge className="mb-4 bg-primary/15 text-primary border-primary/25 px-4 py-1.5 text-xs font-bold rounded-full">
            <Zap className="h-3.5 w-3.5 mr-1.5" />
            PLANES DE SUSCRIPCION
          </Badge>
          <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4 text-balance">
            Elegi tu plan ideal
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Accede a miles de samples profesionales con licencia royalty-free.
            Cancela cuando quieras, sin compromisos.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon
            const isSelected = selectedPlan === plan.id

            return (
              <Card
                key={plan.id}
                className={`relative p-8 rounded-2xl border-2 transition-all hover:shadow-xl ${
                  plan.isPopular
                    ? "border-primary shadow-lg shadow-primary/10"
                    : "border-border"
                } ${isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
              >
                {plan.isPopular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground font-bold px-4 py-1 text-xs shadow-lg shadow-primary/30">
                    Mas Popular
                  </Badge>
                )}

                <div className="flex items-center gap-3 mb-2">
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${
                    plan.isPopular
                      ? "bg-primary/15 text-primary"
                      : "bg-accent/15 text-accent"
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-foreground">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground">{plan.subtitle}</p>
                  </div>
                </div>

                <div className="my-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-foreground">
                      ${plan.priceLabel}
                    </span>
                    <span className="text-base text-muted-foreground font-medium">
                      ARS{plan.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      {feature.included ? (
                        <div className="h-5 w-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                      ) : (
                        <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                          <X className="h-3 w-3 text-muted-foreground" />
                        </div>
                      )}
                      <span className={`text-sm ${feature.included ? "text-foreground" : "text-muted-foreground"}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full rounded-full h-12 font-bold text-sm ${
                    plan.isPopular
                      ? "shadow-lg shadow-primary/25"
                      : ""
                  }`}
                  variant={plan.isPopular ? "default" : "outline"}
                  onClick={() => handleSelect(plan.id)}
                >
                  {plan.cta}
                </Button>

                {/* Benefit tags */}
                <div className="flex flex-wrap gap-2 mt-5">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-secondary rounded-full px-2.5 py-1">
                    <Music className="h-3 w-3" />
                    Royalty-free
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-secondary rounded-full px-2.5 py-1">
                    <Download className="h-3 w-3" />
                    {plan.id === "unlimited" ? "Ilimitado" : "100/mes"}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-secondary rounded-full px-2.5 py-1">
                    <FileText className="h-3 w-3" />
                    Licencia incluida
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Trust signals */}
        <div className="flex items-center justify-center gap-8 mt-12 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <span>Pago seguro via Mercado Pago</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span>Factura disponible</span>
          </div>
        </div>
      </div>
    </section>
  )
}
