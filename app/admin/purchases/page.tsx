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
  Crown,
} from "lucide-react"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type PurchaseType = "pack" | "plan"

interface UnifiedPurchase {
  id: string
  type: PurchaseType
  buyer_id: string
  seller_id?: string
  amount_paid: number
  discount_percent: number
  platform_earnings: number
  seller_earnings: number
  commission_percent: number
  status: string
  payment_method: string | null
  mercado_pago_payment_id: string | null
  seller_mp_user_id: string | null
  created_at: string
  // Pack-specific
  pack_id?: string
  // Plan-specific
  plan_type?: string
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
  const [purchases, setPurchases] = useState<UnifiedPurchase[]>([])
  const [packsMap, setPacksMap] = useState<Record<string, Pack>>({})
  const [buyersMap, setBuyersMap] = useState<Record<string, Profile>>({})
  const [sellersMap, setSellersMap] = useState<Record<string, Profile>>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [selectedPurchase, setSelectedPurchase] = useState<UnifiedPurchase | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const supabase = createBrowserClient()

  useEffect(() => {
    loadPurchases()
  }, [])

  const loadPurchases = async () => {
    try {
      setLoading(true)

      // Load pack purchases
      const { data: packPurchasesData, error: packPurchasesError } = await supabase
        .from("purchases")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500)

      if (packPurchasesError) {
        console.error("[v0] Error loading pack purchases:", packPurchasesError)
      }

      const { data: planPurchasesData, error: planPurchasesError } = await supabase
        .from("user_plans")
        .select("*")
        .neq("plan_type", "free")
        .order("created_at", { ascending: false })
        .limit(500)

      if (planPurchasesError) {
        console.error("[v0] Error loading plan purchases:", planPurchasesError)
      }

      console.log("[v0] Pack purchases:", packPurchasesData?.length)
      console.log("[v0] Plan purchases (paid only):", planPurchasesData?.length)

      // Combine and normalize both types of purchases
      const allPurchases: UnifiedPurchase[] = []

      if (packPurchasesData) {
        packPurchasesData.forEach((p) => {
          console.log("[v0] Pack purchase:", p)
          allPurchases.push({
            id: p.id,
            type: "pack" as PurchaseType,
            buyer_id: p.buyer_id,
            seller_id: p.seller_id,
            pack_id: p.pack_id,
            amount_paid: Number(p.amount_paid) || 0,
            discount_percent: Number(p.discount_percent) || 0,
            platform_earnings: Number(p.platform_earnings) || 0,
            seller_earnings: Number(p.seller_earnings) || 0,
            commission_percent: Number(p.commission_percent) || 0,
            status: p.status || "completed",
            payment_method: p.payment_method,
            mercado_pago_payment_id: p.mercado_pago_payment_id,
            seller_mp_user_id: p.seller_mp_user_id,
            created_at: p.created_at,
          })
        })
      }

      // Add plan purchases - normalize to match purchase format
      if (planPurchasesData) {
        planPurchasesData.forEach((p) => {
          console.log("[v0] Plan purchase:", p)
          // Get plan price from type (in centavos)
          const planPrices: Record<string, number> = {
            de_0_a_hit: 4900,
            studio_plus: 8900,
          }
          const amountPaid = planPrices[p.plan_type] || 0
          const platformEarnings = Math.round(amountPaid * 0.1)

          allPurchases.push({
            id: p.id,
            type: "plan" as PurchaseType,
            buyer_id: p.user_id,
            amount_paid: amountPaid,
            discount_percent: 0,
            platform_earnings: platformEarnings,
            seller_earnings: 0,
            commission_percent: 10,
            status: p.is_active ? "completed" : "expired",
            payment_method: null,
            mercado_pago_payment_id: null,
            seller_mp_user_id: null,
            created_at: p.created_at,
            plan_type: p.plan_type,
          })
        })
      }

      // Sort by date
      allPurchases.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      console.log("[v0] Total unified purchases:", allPurchases.length)
      console.log("[v0] Sample purchase:", allPurchases[0])

      setPurchases(allPurchases)

      // Load packs info for pack purchases
      const packIds = allPurchases.filter((p) => p.type === "pack" && p.pack_id).map((p) => p.pack_id!)
      if (packIds.length > 0) {
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
      }

      // Load buyer profiles
      const buyerIds = [...new Set(allPurchases.map((p) => p.buyer_id))]
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

      const sellerIds = [...new Set(allPurchases.filter((p) => p.seller_id).map((p) => p.seller_id!))]
      if (sellerIds.length > 0) {
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
      console.error("[v0] Error loading purchases:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    const valueInPesos = price / 100
    return new Intl.NumberFormat("es-AR", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valueInPesos)
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

  const getPlanName = (planType: string) => {
    const names: Record<string, string> = {
      de_0_a_hit: "De 0 a Hit",
      studio_plus: "Studio Plus",
    }
    return names[planType] || planType
  }

  const filteredPurchases = purchases.filter((purchase) => {
    const pack = purchase.pack_id ? packsMap[purchase.pack_id] : null
    const buyer = buyersMap[purchase.buyer_id]
    const seller = purchase.seller_id ? sellersMap[purchase.seller_id] : null

    const matchesSearch =
      !searchTerm ||
      purchase.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pack?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      buyer?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (purchase.plan_type && getPlanName(purchase.plan_type).toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = statusFilter === "all" || purchase.status === statusFilter
    const matchesType = typeFilter === "all" || purchase.type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const totalRevenue = purchases.reduce((sum, p) => sum + (p.amount_paid || 0), 0)
  const totalCommission = purchases.reduce((sum, p) => sum + (p.platform_earnings || 0), 0)
  const completedPurchases = purchases.filter((p) => p.status === "completed").length

  console.log("[v0] Total purchases:", purchases.length)
  console.log("[v0] Total revenue:", totalRevenue)
  console.log("[v0] Total commission:", totalCommission)

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
        <p className="text-lg text-muted-foreground">
          Administración completa de todas las transacciones (Packs y Planes)
        </p>
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
              placeholder="Buscar por código, pack, plan, comprador o vendedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-[180px] rounded-xl">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="pack">Packs</SelectItem>
              <SelectItem value="plan">Planes</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px] rounded-xl">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="completed">Completado</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="failed">Fallido</SelectItem>
              <SelectItem value="expired">Expirado</SelectItem>
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
              const pack = purchase.pack_id ? packsMap[purchase.pack_id] : null
              const buyer = buyersMap[purchase.buyer_id]
              const seller = purchase.seller_id ? sellersMap[purchase.seller_id] : null

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
                      {purchase.type === "plan" ? (
                        <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                          <Crown className="h-10 w-10 text-white" />
                        </div>
                      ) : (
                        <img
                          src={pack?.cover_image_url || "/placeholder.svg?height=80&width=80"}
                          alt={pack?.title || "Pack"}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-foreground line-clamp-1">
                              {purchase.type === "plan"
                                ? `Plan: ${getPlanName(purchase.plan_type!)}`
                                : pack?.title || "Pack eliminado"}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {purchase.type === "plan" ? "Plan" : "Pack"}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>Comprador: {buyer?.username || "Desconocido"}</span>
                            </div>
                            {purchase.type === "pack" && seller && (
                              <div className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                <span>Vendedor: {seller?.username || "Desconocido"}</span>
                              </div>
                            )}
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
                                : purchase.status === "expired"
                                  ? "bg-gray-500/10 text-gray-600"
                                  : "bg-red-500/10 text-red-600"
                          }
                        >
                          {purchase.status === "completed"
                            ? "Completado"
                            : purchase.status === "pending"
                              ? "Pendiente"
                              : purchase.status === "expired"
                                ? "Expirado"
                                : "Fallido"}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mt-3">
                        <div>
                          <div className="text-lg font-black text-foreground">${formatPrice(purchase.amount_paid)}</div>
                          <div className="text-xs text-muted-foreground">ARS</div>
                        </div>
                        {purchase.discount_percent > 0 && (
                          <div>
                            <div className="text-sm font-bold text-green-600">{purchase.discount_percent}% OFF</div>
                            <div className="text-xs text-muted-foreground">Descuento</div>
                          </div>
                        )}
                        {purchase.platform_earnings > 0 && (
                          <div>
                            <div className="text-sm font-bold text-purple-600">
                              ${formatPrice(purchase.platform_earnings)}
                            </div>
                            <div className="text-xs text-muted-foreground">Comisión</div>
                          </div>
                        )}
                        {purchase.seller_earnings > 0 && (
                          <div>
                            <div className="text-sm font-bold text-blue-600">
                              ${formatPrice(purchase.seller_earnings)}
                            </div>
                            <div className="text-xs text-muted-foreground">Vendedor</div>
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
                          Ver detalles
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
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de la Compra</DialogTitle>
          </DialogHeader>

          {selectedPurchase && (
            <div className="space-y-6">
              <div className="flex gap-4">
                {selectedPurchase.type === "plan" ? (
                  <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center flex-shrink-0">
                    <Crown className="h-12 w-12 text-white" />
                  </div>
                ) : (
                  <img
                    src={
                      packsMap[selectedPurchase.pack_id!]?.cover_image_url ||
                      "/placeholder.svg?height=96&width=96" ||
                      "/placeholder.svg"
                    }
                    alt="Cover"
                    className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-foreground mb-1">
                    {selectedPurchase.type === "plan"
                      ? `Plan: ${getPlanName(selectedPurchase.plan_type!)}`
                      : packsMap[selectedPurchase.pack_id!]?.title || "Pack eliminado"}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{selectedPurchase.type === "plan" ? "Plan" : "Pack"}</Badge>
                    <Badge
                      variant="secondary"
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
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="font-mono text-xs">{selectedPurchase.id}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleCopyCode(selectedPurchase.id)}
                      >
                        {copiedCode === selectedPurchase.id ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Comprador</p>
                      <p className="font-bold text-sm">
                        {buyersMap[selectedPurchase.buyer_id]?.username || "Desconocido"}
                      </p>
                    </div>
                  </div>
                </Card>

                {selectedPurchase.type === "pack" && selectedPurchase.seller_id && (
                  <Card className="p-4 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <Package className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Vendedor</p>
                        <p className="font-bold text-sm">
                          {sellersMap[selectedPurchase.seller_id]?.username || "Desconocido"}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                <Card className="p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Monto Total</p>
                      <p className="font-bold text-lg">${formatPrice(selectedPurchase.amount_paid)} ARS</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <CreditCard className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Comisión Plataforma</p>
                      <p className="font-bold text-lg">
                        ${formatPrice(selectedPurchase.platform_earnings)} ({selectedPurchase.commission_percent}%)
                      </p>
                    </div>
                  </div>
                </Card>

                {selectedPurchase.seller_earnings > 0 && (
                  <Card className="p-4 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <DollarSign className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Ganancia Vendedor</p>
                        <p className="font-bold text-lg">${formatPrice(selectedPurchase.seller_earnings)} ARS</p>
                      </div>
                    </div>
                  </Card>
                )}

                <Card className="p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-orange-500/10">
                      <Calendar className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Fecha de Compra</p>
                      <p className="font-bold text-sm">{formatDate(selectedPurchase.created_at)}</p>
                    </div>
                  </div>
                </Card>
              </div>

              {selectedPurchase.discount_percent > 0 && (
                <Card className="p-4 rounded-xl bg-green-500/5">
                  <p className="text-sm font-bold text-green-600 mb-1">
                    Descuento aplicado: {selectedPurchase.discount_percent}%
                  </p>
                </Card>
              )}

              {selectedPurchase.payment_method && (
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-foreground">Información de Pago</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Método</p>
                      <p className="font-mono text-xs">{selectedPurchase.payment_method}</p>
                    </div>
                    {selectedPurchase.mercado_pago_payment_id && (
                      <div>
                        <p className="text-muted-foreground text-xs">ID Mercado Pago</p>
                        <p className="font-mono text-xs">{selectedPurchase.mercado_pago_payment_id}</p>
                      </div>
                    )}
                    {selectedPurchase.seller_mp_user_id && (
                      <div>
                        <p className="text-muted-foreground text-xs">MP User ID Vendedor</p>
                        <p className="font-mono text-xs">{selectedPurchase.seller_mp_user_id}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedPurchase.type === "pack" && selectedPurchase.pack_id && (
                <div className="flex gap-2">
                  <Link href={`/pack/${selectedPurchase.pack_id}`} target="_blank">
                    <Button variant="outline" size="sm" className="rounded-full bg-transparent">
                      <ExternalLink className="h-3 w-3 mr-2" />
                      Ver Pack
                    </Button>
                  </Link>
                  {packsMap[selectedPurchase.pack_id]?.file_url && (
                    <a href={packsMap[selectedPurchase.pack_id].file_url} download target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm" className="rounded-full bg-transparent">
                        <Package className="h-3 w-3 mr-2" />
                        Descargar Archivo
                      </Button>
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
