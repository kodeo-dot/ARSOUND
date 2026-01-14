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
  base_amount: number
  paid_price: number
  discount_amount: number
  platform_commission: number
  creator_earnings: number
  commission_percent: number
  status: string
  payment_method: string | null
  mercado_pago_payment_id: string | null
  seller_mp_user_id: string | null
  created_at: string
  pack_id?: string
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

function BuyerEmail({ buyerId }: { buyerId: string }) {
  const [email, setEmail] = useState<string | null>(null)
  const supabase = createBrowserClient()

  useEffect(() => {
    const fetchEmail = async () => {
      const { data } = await supabase.auth.admin.getUserById(buyerId)
      if (data?.user?.email) {
        setEmail(data.user.email)
      }
    }
    fetchEmail()
  }, [buyerId])

  if (!email) return null

  return <p className="text-xs text-muted-foreground">{email}</p>
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

      const { data: allPurchasesData, error: purchasesError } = await supabase
        .from("purchases")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500)

      if (purchasesError) {
        console.error("[v0] Error loading purchases:", purchasesError)
      }

      console.log("[v0] All purchases from DB:", allPurchasesData?.length)

      // Normalize purchases
      const allPurchases: UnifiedPurchase[] = []

      if (allPurchasesData) {
        allPurchasesData.forEach((p) => {
          console.log("[v0] Purchase from DB:", p)

          // Determine type based on whether it has pack_id or plan_type
          const type = p.pack_id ? "pack" : "plan"

          allPurchases.push({
            id: p.id,
            type: type as PurchaseType,
            buyer_id: p.buyer_id,
            seller_id: p.seller_id,
            pack_id: p.pack_id,
            plan_type: p.plan_type,
            amount_paid: Number(p.paid_price || p.amount) || 0,
            paid_price: Number(p.paid_price || p.amount) || 0,
            base_amount: Number(p.base_amount || p.amount) || 0,
            discount_amount: Number(p.discount_amount) || 0,
            platform_commission: Number(p.platform_commission) || 0,
            creator_earnings: Number(p.creator_earnings) || 0,
            commission_percent: Number(p.commission_percent) || 0,
            status: p.status || "completed",
            payment_method: p.payment_method,
            mercado_pago_payment_id: p.mercado_pago_payment_id,
            seller_mp_user_id: p.seller_mp_user_id,
            created_at: p.created_at,
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
    return new Intl.NumberFormat("es-AR", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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

  const totalRevenue = purchases.reduce((sum, p) => sum + (p.paid_price || 0), 0)
  const totalPlatformEarnings = purchases.reduce((sum, p) => sum + (p.platform_commission || 0), 0)
  const completedPurchases = purchases.filter((p) => p.status === "completed").length

  console.log("[v0] Total purchases:", purchases.length)
  console.log("[v0] Total revenue:", totalRevenue)
  console.log("[v0] Total platform earnings (NET):", totalPlatformEarnings)

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
            <p className="text-sm text-muted-foreground mb-1">Ganancias Netas Plataforma</p>
            <p className="text-3xl font-black text-foreground">${formatPrice(totalPlatformEarnings)}</p>
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
                        {purchase.discount_amount > 0 && (
                          <div>
                            <div className="text-sm font-bold text-green-600">
                              ${formatPrice(purchase.discount_amount)} OFF
                            </div>
                            <div className="text-xs text-muted-foreground">Descuento</div>
                          </div>
                        )}
                        {purchase.type === "plan" && (
                          <div>
                            <div className="text-sm font-bold text-purple-600">${formatPrice(purchase.paid_price)}</div>
                            <div className="text-xs text-muted-foreground">Ganancia Neta</div>
                          </div>
                        )}
                        {purchase.type === "pack" && (
                          <>
                            {purchase.platform_commission > 0 && (
                              <div>
                                <div className="text-sm font-bold text-purple-600">
                                  ${formatPrice(purchase.platform_commission)}
                                </div>
                                <div className="text-xs text-muted-foreground">Comisión</div>
                              </div>
                            )}
                            {purchase.creator_earnings > 0 && (
                              <div>
                                <div className="text-sm font-bold text-blue-600">
                                  ${formatPrice(purchase.creator_earnings)}
                                </div>
                                <div className="text-xs text-muted-foreground">Vendedor</div>
                              </div>
                            )}
                          </>
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
            <DialogTitle className="text-2xl font-black">Detalles de la Compra</DialogTitle>
          </DialogHeader>

          {selectedPurchase && (
            <div className="space-y-6">
              {/* Purchase Type Badge */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  {selectedPurchase.type === "plan" ? "Compra de Plan" : "Compra de Pack"}
                </Badge>
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

              {/* Item Info */}
              {selectedPurchase.type === "plan" ? (
                <Card className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center flex-shrink-0">
                      <Crown className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{getPlanName(selectedPurchase.plan_type!)}</h3>
                      <p className="text-sm text-muted-foreground">Plan de suscripción mensual</p>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="p-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={
                        selectedPurchase.pack_id && packsMap[selectedPurchase.pack_id]?.cover_image_url
                          ? packsMap[selectedPurchase.pack_id].cover_image_url!
                          : "/placeholder.svg?height=64&width=64"
                      }
                      alt="Pack"
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">
                        {selectedPurchase.pack_id && packsMap[selectedPurchase.pack_id]
                          ? packsMap[selectedPurchase.pack_id].title
                          : "Pack eliminado"}
                      </h3>
                      {selectedPurchase.pack_id && packsMap[selectedPurchase.pack_id] && (
                        <Link
                          href={`/pack/${selectedPurchase.pack_id}`}
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          Ver pack <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {/* Purchase Code */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Código de Compra</label>
                <div className="flex gap-2">
                  <code className="flex-1 px-4 py-3 bg-muted rounded-xl font-mono text-sm">
                    {selectedPurchase.id.substring(0, 8).toUpperCase()}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl bg-transparent"
                    onClick={() => handleCopyCode(selectedPurchase.id.substring(0, 8).toUpperCase())}
                  >
                    {copiedCode === selectedPurchase.id.substring(0, 8).toUpperCase() ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">ID completo: {selectedPurchase.id}</p>
              </div>

              {/* Buyer Info */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Comprador</label>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    {buyersMap[selectedPurchase.buyer_id]?.avatar_url ? (
                      <img
                        src={buyersMap[selectedPurchase.buyer_id].avatar_url! || "/placeholder.svg"}
                        alt="Avatar"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold">
                        {buyersMap[selectedPurchase.buyer_id]?.display_name ||
                          buyersMap[selectedPurchase.buyer_id]?.username ||
                          "Desconocido"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        @{buyersMap[selectedPurchase.buyer_id]?.username || "unknown"}
                      </p>
                      {/* Buyer Email */}
                      <BuyerEmail buyerId={selectedPurchase.buyer_id} />
                    </div>
                    <Link href={`/profile/${buyersMap[selectedPurchase.buyer_id]?.username || ""}`}>
                      <Button variant="outline" size="sm" className="rounded-full bg-transparent">
                        Ver perfil
                      </Button>
                    </Link>
                  </div>
                </Card>
              </div>

              {/* Seller Info (only for pack purchases) */}
              {selectedPurchase.type === "pack" && selectedPurchase.seller_id && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Vendedor</label>
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      {sellersMap[selectedPurchase.seller_id]?.avatar_url ? (
                        <img
                          src={sellersMap[selectedPurchase.seller_id].avatar_url! || "/placeholder.svg"}
                          alt="Avatar"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-semibold">
                          {sellersMap[selectedPurchase.seller_id]?.display_name ||
                            sellersMap[selectedPurchase.seller_id]?.username ||
                            "Desconocido"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          @{sellersMap[selectedPurchase.seller_id]?.username || "unknown"}
                        </p>
                      </div>
                      <Link href={`/profile/${sellersMap[selectedPurchase.seller_id]?.username || ""}`}>
                        <Button variant="outline" size="sm" className="rounded-full bg-transparent">
                          Ver perfil
                        </Button>
                      </Link>
                    </div>
                  </Card>
                </div>
              )}

              {/* Additional Purchase Details */}
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

                {selectedPurchase.discount_amount > 0 && (
                  <Card className="p-4 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-gray-500/10">
                        <DollarSign className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Precio Base</p>
                        <p className="font-bold text-lg line-through text-muted-foreground">
                          ${formatPrice(selectedPurchase.base_amount)} ARS
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
                      <p className="text-xs text-muted-foreground">Precio Pagado</p>
                      <p className="font-bold text-lg">${formatPrice(selectedPurchase.paid_price)} ARS</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <CreditCard className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Ganancia Neta Plataforma</p>
                      <p className="font-bold text-lg">
                        ${formatPrice(selectedPurchase.platform_commission)} ({selectedPurchase.commission_percent}%)
                      </p>
                    </div>
                  </div>
                </Card>

                {selectedPurchase.creator_earnings > 0 && (
                  <Card className="p-4 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <DollarSign className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Ganancia Vendedor</p>
                        <p className="font-bold text-lg">${formatPrice(selectedPurchase.creator_earnings)} ARS</p>
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

              {selectedPurchase.discount_amount > 0 && (
                <Card className="p-4 rounded-xl bg-green-500/5">
                  <p className="text-sm font-bold text-green-600 mb-1">
                    Descuento aplicado: ${formatPrice(selectedPurchase.discount_amount)} (-
                    {Math.round((selectedPurchase.discount_amount / selectedPurchase.base_amount) * 100)}%)
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
