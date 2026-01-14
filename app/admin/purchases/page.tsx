"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createBrowserClient } from "@/lib/supabase/client"
import {
  ShoppingCart,
  Eye,
  Search,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  CreditCard,
  DollarSign,
  Package,
  User,
  FileText,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Purchase {
  id: string
  buyer_id: string
  pack_id: string
  amount: number
  discount_amount: number
  platform_commission: number
  creator_earnings: number
  status: string
  payment_method: string | null
  mercado_pago_payment_id: string | null
  created_at: string
}

interface Pack {
  id: string
  title: string
  cover_image_url: string | null
  user_id: string
  file_url: string
}

interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

export default function AdminPurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [packsMap, setPacksMap] = useState<Record<string, Pack>>({})
  const [buyersMap, setBuyersMap] = useState<Record<string, Profile>>({})
  const [sellersMap, setSellersMap] = useState<Record<string, Profile>>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const supabase = createBrowserClient()

  useEffect(() => {
    loadPurchases()
  }, [])

  const loadPurchases = async () => {
    try {
      setLoading(true)

      const { data: purchasesData, error: purchasesError } = await supabase
        .from("purchases")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100)

      if (purchasesError || !purchasesData) {
        console.error("Error loading purchases:", purchasesError)
        return
      }

      setPurchases(purchasesData)

      const packIds = [...new Set(purchasesData.map((p) => p.pack_id))]
      const { data: packs } = await supabase
        .from("packs")
        .select("id, title, cover_image_url, user_id, file_url")
        .in("id", packIds)

      if (packs) {
        const mapPacks: Record<string, Pack> = {}
        packs.forEach((pack) => {
          mapPacks[pack.id] = pack as Pack
        })
        setPacksMap(mapPacks)
      }

      const buyerIds = [...new Set(purchasesData.map((p) => p.buyer_id))]
      const { data: buyers } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", buyerIds)

      if (buyers) {
        const mapBuyers: Record<string, Profile> = {}
        buyers.forEach((buyer) => {
          mapBuyers[buyer.id] = buyer as Profile
        })
        setBuyersMap(mapBuyers)
      }

      if (packs) {
        const sellerIds = [...new Set(packs.map((p) => p.user_id))]
        const { data: sellers } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", sellerIds)

        if (sellers) {
          const mapSellers: Record<string, Profile> = {}
          sellers.forEach((seller) => {
            mapSellers[seller.id] = seller as Profile
          })
          setSellersMap(mapSellers)
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

  const filteredPurchases = purchases.filter((purchase) => {
    const pack = packsMap[purchase.pack_id]
    const buyer = buyersMap[purchase.buyer_id]
    const seller = pack ? sellersMap[pack.user_id] : null

    const matchesSearch =
      !searchTerm ||
      purchase.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pack?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      buyer?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller?.username.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || purchase.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const totalRevenue = purchases.reduce((sum, p) => sum + p.amount, 0)
  const totalCommission = purchases.reduce((sum, p) => sum + (p.platform_commission || 0), 0)
  const completedPurchases = purchases.filter((p) => p.status === "completed").length

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black text-foreground mb-2">Compras</h1>
        <p className="text-lg text-muted-foreground">Administración completa de todas las transacciones</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 rounded-2xl border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-green-500/10">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Ingresos Totales</p>
            <p className="text-3xl font-black text-foreground">${formatPrice(totalRevenue)}</p>
          </div>
        </Card>

        <Card className="p-6 rounded-2xl border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Compras Completadas</p>
            <p className="text-3xl font-black text-foreground">{completedPurchases}</p>
          </div>
        </Card>

        <Card className="p-6 rounded-2xl border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-purple-500/10">
              <CreditCard className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Comisiones Plataforma</p>
            <p className="text-3xl font-black text-foreground">${formatPrice(totalCommission)}</p>
          </div>
        </Card>
      </div>

      <Card className="p-6 rounded-2xl border-border">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código, pack, comprador o vendedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[200px] rounded-xl">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="completed">Completado</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="failed">Fallido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          {filteredPurchases.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No se encontraron compras</p>
            </div>
          ) : (
            filteredPurchases.map((purchase) => {
              const pack = packsMap[purchase.pack_id]
              const buyer = buyersMap[purchase.buyer_id]
              const seller = pack ? sellersMap[pack.user_id] : null

              return (
                <div
                  key={purchase.id}
                  className="p-5 rounded-xl border border-border hover:border-primary/40 transition-all cursor-pointer bg-card"
                  onClick={() => {
                    setSelectedPurchase(purchase)
                    setDetailsOpen(true)
                  }}
                >
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-shrink-0">
                      <img
                        src={pack?.cover_image_url || "/placeholder.svg?height=80&width=80"}
                        alt={pack?.title || "Pack"}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-foreground mb-1 line-clamp-1">
                            {pack?.title || "Pack eliminado"}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>Comprador: {buyer?.username || "Desconocido"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              <span>Vendedor: {seller?.username || "Desconocido"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(purchase.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className={
                            purchase.status === "completed"
                              ? "bg-green-500/10 text-green-600"
                              : purchase.status === "pending"
                                ? "bg-yellow-500/10 text-yellow-600"
                                : "bg-red-500/10 text-red-600"
                          }
                        >
                          {purchase.status === "completed"
                            ? "Completado"
                            : purchase.status === "pending"
                              ? "Pendiente"
                              : "Fallido"}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mt-3">
                        <div>
                          <div className="text-lg font-black text-foreground">${formatPrice(purchase.amount)}</div>
                          <div className="text-xs text-muted-foreground">ARS</div>
                        </div>
                        {purchase.discount_amount > 0 && (
                          <div>
                            <div className="text-sm font-bold text-green-600">
                              -${formatPrice(purchase.discount_amount)}
                            </div>
                            <div className="text-xs text-muted-foreground">Descuento</div>
                          </div>
                        )}
                        {purchase.platform_commission > 0 && (
                          <div>
                            <div className="text-sm font-bold text-purple-600">
                              ${formatPrice(purchase.platform_commission)}
                            </div>
                            <div className="text-xs text-muted-foreground">Comisión</div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full text-xs bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedPurchase(purchase)
                            setDetailsOpen(true)
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Ver Detalles
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full text-xs bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(`/pack/${purchase.pack_id}`, "_blank")
                          }}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Ver Pack
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle>Detalles Completos de la Compra</DialogTitle>
          </DialogHeader>
          {selectedPurchase && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-muted/30 border border-border">
                <div className="text-sm text-muted-foreground mb-2">Código de Compra</div>
                <div className="flex items-center gap-2">
                  <code className="text-xl font-black text-foreground font-mono">
                    {selectedPurchase.id.slice(0, 8).toUpperCase()}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopyCode(selectedPurchase.id)}
                    className="h-8 w-8 p-0"
                  >
                    {copiedCode === selectedPurchase.id ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground mt-1 font-mono">{selectedPurchase.id}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-card border border-border">
                  <div className="text-xs text-muted-foreground mb-2">Pack</div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-foreground" />
                    <Link
                      href={`/pack/${selectedPurchase.pack_id}`}
                      className="text-sm font-bold text-foreground hover:text-primary line-clamp-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {packsMap[selectedPurchase.pack_id]?.title || "Pack eliminado"}
                    </Link>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-card border border-border">
                  <div className="text-xs text-muted-foreground mb-2">Comprador</div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-foreground" />
                    <Link
                      href={`/profile/${buyersMap[selectedPurchase.buyer_id]?.username}`}
                      className="text-sm font-bold text-foreground hover:text-primary"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {buyersMap[selectedPurchase.buyer_id]?.username || "Desconocido"}
                    </Link>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-card border border-border">
                  <div className="text-xs text-muted-foreground mb-2">Vendedor</div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-foreground" />
                    {packsMap[selectedPurchase.pack_id] && (
                      <Link
                        href={`/profile/${sellersMap[packsMap[selectedPurchase.pack_id].user_id]?.username}`}
                        className="text-sm font-bold text-foreground hover:text-primary"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {sellersMap[packsMap[selectedPurchase.pack_id].user_id]?.username || "Desconocido"}
                      </Link>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-card border border-border">
                  <div className="text-xs text-muted-foreground mb-2">Fecha y Hora</div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-foreground" />
                    <span className="text-sm font-bold text-foreground">{formatDate(selectedPurchase.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-4 rounded-xl bg-card border border-border">
                  <span className="text-sm text-muted-foreground">Monto Total</span>
                  <span className="text-xl font-black text-foreground">
                    ${formatPrice(selectedPurchase.amount)} ARS
                  </span>
                </div>

                {selectedPurchase.discount_amount > 0 && (
                  <div className="flex justify-between items-center p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                    <span className="text-sm text-green-600">Descuento Aplicado</span>
                    <span className="text-lg font-black text-green-600">
                      -${formatPrice(selectedPurchase.discount_amount)} ARS
                    </span>
                  </div>
                )}

                {selectedPurchase.platform_commission > 0 && (
                  <div className="flex justify-between items-center p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <span className="text-sm text-purple-600">Comisión Plataforma</span>
                    <span className="text-lg font-black text-purple-600">
                      ${formatPrice(selectedPurchase.platform_commission)} ARS
                    </span>
                  </div>
                )}

                {selectedPurchase.creator_earnings > 0 && (
                  <div className="flex justify-between items-center p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <span className="text-sm text-blue-600">Ganancia Creador</span>
                    <span className="text-lg font-black text-blue-600">
                      ${formatPrice(selectedPurchase.creator_earnings)} ARS
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between p-3 rounded-xl bg-muted/20">
                  <span className="text-sm text-muted-foreground">Estado</span>
                  <Badge
                    className={
                      selectedPurchase.status === "completed"
                        ? "bg-green-500/10 text-green-600"
                        : selectedPurchase.status === "pending"
                          ? "bg-yellow-500/10 text-yellow-600"
                          : "bg-red-500/10 text-red-600"
                    }
                  >
                    {selectedPurchase.status === "completed"
                      ? "Completado"
                      : selectedPurchase.status === "pending"
                        ? "Pendiente"
                        : "Fallido"}
                  </Badge>
                </div>

                {selectedPurchase.payment_method && (
                  <div className="flex justify-between p-3 rounded-xl bg-muted/20">
                    <span className="text-sm text-muted-foreground">Método de Pago</span>
                    <span className="text-sm font-bold text-foreground capitalize">
                      {selectedPurchase.payment_method}
                    </span>
                  </div>
                )}

                {selectedPurchase.mercado_pago_payment_id && (
                  <div className="p-3 rounded-xl bg-muted/20">
                    <div className="text-sm text-muted-foreground mb-1">ID de Pago MercadoPago</div>
                    <code className="text-xs font-mono text-foreground">
                      {selectedPurchase.mercado_pago_payment_id}
                    </code>
                  </div>
                )}

                {packsMap[selectedPurchase.pack_id]?.file_url && (
                  <div className="p-3 rounded-xl bg-muted/20">
                    <div className="text-sm text-muted-foreground mb-2">Archivo</div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-foreground" />
                      <a
                        href={packsMap[selectedPurchase.pack_id].file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-primary hover:underline line-clamp-1"
                      >
                        {packsMap[selectedPurchase.pack_id].file_url}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl bg-transparent"
                  onClick={() => window.open(`/pack/${selectedPurchase.pack_id}`, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver Pack
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl bg-transparent"
                  onClick={() => window.open(`/profile/${buyersMap[selectedPurchase.buyer_id]?.username}`, "_blank")}
                >
                  <User className="h-4 w-4 mr-2" />
                  Ver Comprador
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
