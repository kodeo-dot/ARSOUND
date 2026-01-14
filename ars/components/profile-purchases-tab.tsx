"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Download, ChevronDown, Copy, Check } from 'lucide-react'
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Profile } from "@/types/profile"

interface Purchase {
  id: string
  pack_id: string
  amount: number
  amount_paid: number
  discount_amount: number | null
  discount_percent: number | null
  platform_earnings: number | null
  commission_percent: number | null
  status: string
  created_at: string
  payment_method: string | null
}

interface Pack {
  id: string
  title: string
  cover_image_url: string | null
  price: number
  user_id: string
}

interface ProfilePurchasesTabProps {
  profile: Profile | null
}

export function ProfilePurchasesTab({ profile }: ProfilePurchasesTabProps) {
  const supabase = createClient()
  const [purchasesLoading, setPurchasesLoading] = useState(false)
  const [purchasesData, setPurchasesData] = useState<Purchase[]>([])
  const [packsMap, setPacksMap] = useState<Record<string, Pack>>({})
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    const loadPurchases = async () => {
      try {
        setPurchasesLoading(true)
        console.log("[v0] Loading purchases for user:", profile?.id)

        const { data: purchases, error: purchasesError } = await supabase
          .from('purchases')
          .select('*')
          .eq('buyer_id', profile?.id)
          .order('created_at', { ascending: false })

        console.log("[v0] Purchases response:", { 
          success: !purchasesError, 
          count: purchases?.length, 
          error: purchasesError?.message 
        })

        if (!purchasesError && purchases) {
          setPurchasesData(purchases as any)

          if (purchases.length > 0) {
            const packIds = [...new Set(purchases.map(p => p.pack_id))]
            const { data: packs } = await supabase
              .from('packs')
              .select('id, title, cover_image_url, price, user_id')
              .in('id', packIds)

            if (packs) {
              const mapPacks: Record<string, Pack> = {}
              packs.forEach(pack => {
                mapPacks[pack.id] = pack as Pack
              })
              setPacksMap(mapPacks)
            }
          }
        } else {
          setPurchasesData([])
        }
      } catch (err) {
        console.error("[v0] Error loading purchases:", err)
        setPurchasesData([])
      } finally {
        setPurchasesLoading(false)
      }
    }

    if (profile?.id) {
      loadPurchases()
    }
  }, [profile?.id, supabase])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  if (purchasesLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden border-border rounded-2xl animate-pulse">
            <div className="aspect-square bg-muted" />
            <div className="p-4 md:p-5 space-y-3">
              <div className="h-6 bg-muted rounded" />
              <div className="h-10 bg-muted rounded" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (purchasesData.length === 0) {
    return (
      <Card className="p-8 md:p-12 text-center rounded-3xl border-2 border-dashed border-border">
        <Package className="h-12 md:h-16 w-12 md:w-16 mx-auto mb-3 md:mb-4 text-muted-foreground" />
        <h3 className="text-lg md:text-xl font-bold text-foreground mb-2">No realizaste compras todavía</h3>
        <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
          Explorá packs y realiza tu primer compra
        </p>
        <Link href="/">
          <Button className="gap-2 rounded-full h-10 md:h-12 px-6 md:px-8 text-sm md:text-base">
            <Package className="h-4 w-4" />
            Explorar Packs
          </Button>
        </Link>
      </Card>
    )
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {purchasesData.map((purchase) => {
        const pack = packsMap[purchase.pack_id]
        return (
          <div key={purchase.id}>
            <Card
              className="p-3 md:p-6 rounded-2xl border-border hover:border-primary/40 transition-all cursor-pointer"
              onClick={() => {
                setSelectedPurchase(purchase)
                setDetailsModalOpen(true)
              }}
            >
              <div className="flex flex-col md:flex-row gap-3 md:gap-6">
                <div className="flex-shrink-0">
                  <img
                    src={pack?.cover_image_url || "/placeholder.svg?height=120&width=120"}
                    alt={pack?.title || "Pack"}
                    className="w-20 h-20 md:w-24 md:h-24 rounded-xl object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col gap-2 mb-3">
                    <div>
                      <Link href={`/pack/${purchase.pack_id}`} onClick={(e) => e.stopPropagation()}>
                        <h3 className="font-bold text-base md:text-lg text-foreground hover:text-primary transition-colors line-clamp-2">
                          {pack?.title || "Pack deleted"}
                        </h3>
                      </Link>
                      <p className="text-xs md:text-sm text-muted-foreground mt-1">
                        {formatDate(purchase.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                    <div>
                      <div className="text-xl md:text-2xl font-black text-foreground">
                        ${formatPrice(purchase.amount_paid || purchase.amount)}
                      </div>
                      {purchase.discount_amount && purchase.discount_amount > 0 && (
                        <div className="text-xs text-green-600 font-semibold">
                          -${formatPrice(purchase.discount_amount)}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">ARS</div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-xs font-bold flex-shrink-0 ${
                        purchase.status === "completed"
                          ? "bg-green-500/10 text-green-600"
                          : "bg-yellow-500/10 text-yellow-600"
                      }`}
                    >
                      {purchase.status === "completed" ? "✓ Completado" : "⏳ Pendiente"}
                    </Badge>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link href={`/pack/${purchase.pack_id}`} className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        className="w-full rounded-full bg-transparent text-xs md:text-sm h-9 md:h-10"
                        size="sm"
                      >
                        Ver Pack
                      </Button>
                    </Link>
                    <a href={`/api/packs/${purchase.pack_id}/download`} download className="flex-1 min-w-0">
                      <Button
                        className="w-full rounded-full text-xs md:text-sm h-9 md:h-10 gap-1 md:gap-2"
                        size="sm"
                      >
                        <Download className="h-3 w-3 md:h-4 md:w-4" />
                        <span className="hidden sm:inline">Descargar</span>
                        <span className="sm:hidden">DL</span>
                      </Button>
                    </a>
                    <Button
                      variant="outline"
                      className="flex-1 rounded-full bg-transparent text-xs md:text-sm h-9 md:h-10"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedPurchase(purchase)
                        setDetailsModalOpen(true)
                      }}
                    >
                      <ChevronDown className="h-3 w-3 md:h-4 md:w-4" />
                      Detalles
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )
      })}

      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Compra</DialogTitle>
          </DialogHeader>
          {selectedPurchase && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-accent">
                <div className="text-sm text-muted-foreground mb-1">Código de Compra</div>
                <div className="flex items-center gap-2">
                  <code className="text-lg font-bold text-foreground font-mono">
                    {selectedPurchase.id.slice(0, 8).toUpperCase()}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopyCode(selectedPurchase.id.slice(0, 8).toUpperCase())}
                    className="h-7 w-7 p-0"
                  >
                    {copiedCode === selectedPurchase.id.slice(0, 8).toUpperCase() ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Precio Final</div>
                  <div className="text-lg font-bold text-foreground">
                    ${formatPrice(selectedPurchase.amount_paid || selectedPurchase.amount)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Estado</div>
                  <Badge className={selectedPurchase.status === "completed" ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600"}>
                    {selectedPurchase.status === "completed" ? "Completado" : "Pendiente"}
                  </Badge>
                </div>
              </div>

              {selectedPurchase.discount_amount && selectedPurchase.discount_amount > 0 && (
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                  <div className="text-xs text-muted-foreground mb-1">Descuento Aplicado</div>
                  <div className="text-sm font-bold text-green-600">
                    -${formatPrice(selectedPurchase.discount_amount)}
                  </div>
                </div>
              )}

              <div className="space-y-2 p-3 rounded-xl bg-accent/50 border border-border">
                {selectedPurchase.platform_earnings !== null && (
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Comisión de Plataforma</span>
                    <span className="text-xs font-medium">-${formatPrice(selectedPurchase.platform_earnings)} ARS</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Fecha</span>
                  <span className="text-sm font-medium">{formatDate(selectedPurchase.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Método de Pago</span>
                  <span className="text-sm font-medium capitalize">{selectedPurchase.payment_method || "No especificado"}</span>
                </div>
                {selectedPurchase.pack_id && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">ID del vendedor</span>
                    <span className="text-sm font-medium">{packsMap[selectedPurchase.pack_id]?.user_id || "No especificado"}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
