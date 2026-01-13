"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Tag, AlertCircle, Save, RotateCcw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"

interface PlanPricing {
  plan_id: string
  base_price: number
  current_price: number
  is_discounted: boolean
  discount_label: string | null
}

export default function AdminPricingPage() {
  const [pricing, setPricing] = useState<PlanPricing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({})
  const [priceErrors, setPriceErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchPricing()
  }, [])

  const fetchPricing = async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase.from("plan_pricing").select("*").order("base_price", { ascending: true })

      if (error) throw error

      setPricing(data || [])

      // Initialize edited prices
      const initialPrices: Record<string, number> = {}
      data?.forEach((plan) => {
        initialPrices[plan.plan_id] = plan.current_price
      })
      setEditedPrices(initialPrices)
    } catch (error) {
      console.error("[v0] Error fetching pricing:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar la información de precios",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePriceChange = (planId: string, value: string) => {
    // Remove non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, "")
    const price = numericValue ? Number.parseInt(numericValue) : 0

    setEditedPrices((prev) => ({
      ...prev,
      [planId]: price,
    }))

    // Validate price
    const plan = pricing.find((p) => p.plan_id === planId)
    if (!plan) return

    if (price < 0) {
      setPriceErrors((prev) => ({
        ...prev,
        [planId]: "El precio no puede ser negativo",
      }))
    } else if (price > plan.base_price) {
      setPriceErrors((prev) => ({
        ...prev,
        [planId]: `El precio no puede superar el precio base ($${plan.base_price})`,
      }))
    } else if (price > 0 && price < 500) {
      setPriceErrors((prev) => ({
        ...prev,
        [planId]: "El precio mínimo es $500",
      }))
    } else {
      setPriceErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[planId]
        return newErrors
      })
    }
  }

  const handleResetPrice = (planId: string) => {
    const plan = pricing.find((p) => p.plan_id === planId)
    if (plan) {
      setEditedPrices((prev) => ({
        ...prev,
        [planId]: plan.base_price,
      }))
      setPriceErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[planId]
        return newErrors
      })
    }
  }

  const handleSave = async (planId: string) => {
    if (priceErrors[planId]) {
      toast({
        title: "Error",
        description: priceErrors[planId],
        variant: "destructive",
      })
      return
    }

    const newPrice = editedPrices[planId]
    if (!newPrice && newPrice !== 0) return

    try {
      console.log("[v0] Saving price for plan:", planId, "New price:", newPrice)
      setIsSaving(true)
      const supabase = createClient()

      // Get the base price first
      const plan = pricing.find((p) => p.plan_id === planId)
      if (!plan) {
        throw new Error("Plan not found")
      }

      const isDiscounted = newPrice < plan.base_price
      const discountLabel = isDiscounted
        ? `${Math.round(((plan.base_price - newPrice) / plan.base_price) * 100)}% OFF`
        : null

      console.log("[v0] Update data:", { newPrice, isDiscounted, discountLabel })

      const { data, error } = await supabase
        .from("plan_pricing")
        .update({
          current_price: newPrice,
          is_discounted: isDiscounted,
          discount_label: discountLabel,
          updated_at: new Date().toISOString(),
        })
        .eq("plan_id", planId)
        .select()

      console.log("[v0] Update result:", { data, error })

      if (error) throw error

      toast({
        title: "Precio actualizado",
        description: "El precio del plan se actualizó correctamente",
      })

      // Refresh pricing
      await fetchPricing()
    } catch (error) {
      console.error("[v0] Error updating pricing:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo actualizar el precio",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getPlanName = (planId: string) => {
    const names: Record<string, string> = {
      de_0_a_hit: "De 0 a Hit",
      studio_plus: "Studio Plus",
    }
    return names[planId] || planId
  }

  const calculateDiscount = (basePrice: number, currentPrice: number) => {
    if (currentPrice >= basePrice) return 0
    return Math.round(((basePrice - currentPrice) / basePrice) * 100)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando precios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-foreground mb-2">Gestión de Precios</h1>
        <p className="text-muted-foreground">
          Administra los precios de los planes. Los cambios se reflejarán en toda la plataforma.
        </p>
      </div>

      <Card className="p-6 rounded-2xl border-border bg-amber-500/10 border-amber-500/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-foreground mb-1">Importante</h3>
            <p className="text-sm text-muted-foreground">
              Los precios base son fijos ($5.000 y $15.000). Solo puedes reducir el precio para crear ofertas. Si el
              precio actual es menor al base, se mostrará automáticamente como "OFERTA" en toda la plataforma.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6">
        {pricing.map((plan) => {
          const hasChanges = editedPrices[plan.plan_id] !== plan.current_price
          const hasError = !!priceErrors[plan.plan_id]
          const discount = calculateDiscount(plan.base_price, editedPrices[plan.plan_id] || 0)

          return (
            <Card key={plan.plan_id} className="p-6 rounded-2xl border-border">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-black text-foreground">{getPlanName(plan.plan_id)}</h2>
                    {plan.is_discounted && (
                      <Badge className="bg-green-500 text-white">
                        <Tag className="h-3 w-3 mr-1" />
                        {plan.discount_label}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Precio base: ${plan.base_price.toLocaleString("es-AR")} ARS
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor={`price-${plan.plan_id}`} className="text-sm font-semibold text-foreground mb-2 block">
                    Precio Actual
                  </Label>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          id={`price-${plan.plan_id}`}
                          type="text"
                          value={editedPrices[plan.plan_id] || ""}
                          onChange={(e) => handlePriceChange(plan.plan_id, e.target.value)}
                          className={`pl-7 h-12 text-lg font-bold ${hasError ? "border-red-500" : ""}`}
                          placeholder="0"
                        />
                      </div>
                      {hasError && <p className="text-sm text-red-500 mt-1">{priceErrors[plan.plan_id]}</p>}
                      {!hasError && discount > 0 && (
                        <p className="text-sm text-green-600 mt-1 font-semibold">
                          Descuento del {discount}% - Se mostrará como OFERTA
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 bg-transparent"
                      onClick={() => handleResetPrice(plan.plan_id)}
                      disabled={editedPrices[plan.plan_id] === plan.base_price}
                      title="Restaurar precio base"
                    >
                      <RotateCcw className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                <Button
                  className="w-full h-12 font-bold"
                  onClick={() => handleSave(plan.plan_id)}
                  disabled={!hasChanges || hasError || isSaving}
                >
                  <Save className="h-5 w-5 mr-2" />
                  {isSaving ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
