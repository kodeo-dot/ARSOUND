"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Download, ChevronDown, Copy, Check, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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

export default function PurchasesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [packsMap, setPacksMap] = useState<Record<string, Pack>>({})
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        router.push("/login")
        return
      }

      setUser(user)

      const { data: purchasesData, error: purchasesError } = await supabase
        .from("purchases")
        .select("*")
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false })

      if (!purchasesError && purchasesData) {
        setPurchases(purchasesData as any)

        if (purchasesData.length > 0) {
          const packIds = [...new Set(purchasesData.map((p) => p.pack_id))]
          const { data: packs } = await supabase
            .from("packs")
            .select("id, title, cover_image_url, price, user_id")
            .in("id", packIds)

          if (packs) {
            const mapPacks: Record<string, Pack> = {}
            packs.forEach((pack) => {
              mapPacks[pack.id] = pack as Pack
            })
            setPacksMap(mapPacks)
          }
        }
      }
    } catch (error) {
      console.error("Error loading purchases:", error)
    } finally {
      setLoading(false)
    }
  }

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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="mb-8 animate-pulse">
            <div className="h-10 bg-muted rounded-lg w-48 mb-2" />
            <div className="h-6 bg-muted rounded-lg w-96" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 rounded-2xl border-border animate-pulse">
                <div className="flex gap-6">
                  <div className="w-24 h-24 bg-muted rounded-xl" />
                  <div className="flex-1 space-y-3">
                    <div className="h-6 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-10 bg-muted rounded w-1/3" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-black text-foreground">Mis Compras</h1>
          </div>
          <p className="text-muted-foreground">Todos tus packs comprados en un solo lugar</p>
        </div>

        {purchases.length === 0 ? (
          <Card className="p-12 text-center rounded-3xl border-2 border-dashed border-border">
            <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-bold text-foreground mb-2">No realizaste compras todavía</h3>
            <p className="text-muted-foreground mb-6">Explorá packs y realiza tu primer compra</p>
            <Link href="/">
              <Button className="gap-2 rounded-full h-12 px-8">
                <Package className="h-4 w-4" />
                Explorar Packs
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase) => {
              const pack = packsMap[purchase.pack_id]
              return (
                <Card
                  key={purchase.id}
                  className="p-6 rounded-2xl border-border hover:border-primary/40 transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedPurchase(purchase)
                    setDetailsModalOpen(true)
                  }}
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-shrink-0">
                      <img
                        src={pack?.cover_image_url || "/placeholder.svg?height=120&width=120"}
                        alt={pack?.title || "Pack"}
                        className="w-24 h-24 rounded-xl object-cover"
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-col gap-2 mb-3">
                        <div>
                          <Link href={`/pack/${purchase.pack_id}`} onClick={(e) => e.stopPropagation()}>
                            <h3 className="font-bold text-lg text-foreground hover:text-primary transition-colors line-clamp-2">
                              {pack?.title || "Pack deleted"}
                            </h3>
                          </Link>
                          <p className="text-sm text-muted-foreground mt-1">{formatDate(purchase.created_at)}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div>
                          <div className="text-2xl font-black text-foreground">
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
                          className={`text-xs font-bold ${
                            purchase.status === "completed"
                              ? "bg-green-500/10 text-green-600"
                              : "bg-yellow-500/10 text-yellow-600"
                          }`}
                        >
                          {purchase.status === "completed" ? "✓ Completado" : "⏳ Pendiente"}
                        </Badge>
                      </div>

                      <div className="flex gap-2">
                        <Link
                          href={`/pack/${purchase.pack_id}`}
                          className="flex-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button variant="outline" className="w-full rounded-full bg-transparent" size="sm">
                            Ver Pack
                          </Button>
                        </Link>
                        <a href={`/api/packs/${purchase.pack_id}/download`} download className="flex-1">
                          <Button className="w-full rounded-full gap-2" size="sm">
                            <Download className="h-4 w-4" />
                            Descargar
                          </Button>
                        </a>
                        <Button
                          variant="outline"
                          className="flex-1 rounded-full bg-transparent"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedPurchase(purchase)
                            setDetailsModalOpen(true)
                          }}
                        >
                          <ChevronDown className="h-4 w-4" />
                          Detalles
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
          <DialogContent className="sm:max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle>Detalles de la Compra</DialogTitle>
            </DialogHeader>
            {selectedPurchase && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-muted/30 border border-border">
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
                    <Badge
                      className={
                        selectedPurchase.status === "completed"
                          ? "bg-green-500/10 text-green-600"
                          : "bg-yellow-500/10 text-yellow-600"
                      }
                    >
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

                {selectedPurchase.platform_earnings !== null && (
                  <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border">
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Comisión de Plataforma</span>
                      <span className="text-xs font-medium text-foreground">
                        -${formatPrice(selectedPurchase.platform_earnings)} ARS
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Fecha</span>
                    <span className="text-sm font-medium">{formatDate(selectedPurchase.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Método de Pago</span>
                    <span className="text-sm font-medium capitalize">
                      {selectedPurchase.payment_method || "No especificado"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>

      <Footer />
    </div>
  )
}
