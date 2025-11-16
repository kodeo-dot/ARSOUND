"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Download } from 'lucide-react'
import Link from "next/link"
import type { Profile } from "@/types/profile"

interface Purchase {
  id: string
  pack_id: string
  amount_paid: number
  status: string
  created_at: string
  packs: {
    id: string
    title: string
    cover_image_url: string | null
    price: number
    user_id: string
  } | null
}

interface ProfilePurchasesTabProps {
  profile: Profile | null
}

export function ProfilePurchasesTab({ profile }: ProfilePurchasesTabProps) {
  const [purchasesLoading, setPurchasesLoading] = useState(false)
  const [purchasesData, setPurchasesData] = useState<Purchase[]>([])
  const supabase = createClient()

  useEffect(() => {
    const loadPurchases = async () => {
      try {
        setPurchasesLoading(true)
        console.log("[v0] Loading purchases for user:", profile?.id)

        const { data: purchases, error } = await supabase
          .from("purchases")
          .select(
            `
            id,
            pack_id,
            amount_paid,
            status,
            created_at,
            packs (
              id,
              title,
              cover_image_url,
              price,
              user_id
            )
          `
          )
          .eq("buyer_id", profile?.id)
          .order("created_at", { ascending: false })

        console.log("[v0] Purchases response:", { 
          success: !error, 
          count: purchases?.length, 
          error: error?.message || error?.details 
        })

        if (error) {
          console.error("[v0] Error details:", error)
        }

        if (!error && purchases) {
          setPurchasesData(purchases as any)
        } else {
          console.warn("[v0] No purchases found or error occurred")
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
      {purchasesData.map((purchase) => (
        <Card
          key={purchase.id}
          className="p-3 md:p-6 rounded-2xl border-border hover:border-primary/40 transition-all"
        >
          <div className="flex flex-col md:flex-row gap-3 md:gap-6">
            <div className="flex-shrink-0">
              <img
                src={purchase.packs?.cover_image_url || "/placeholder.svg?height=120&width=120"}
                alt={purchase.packs?.title || "Pack"}
                className="w-20 h-20 md:w-24 md:h-24 rounded-xl object-cover"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col gap-2 mb-3">
                <div>
                  <Link href={`/pack/${purchase.pack_id}`}>
                    <h3 className="font-bold text-base md:text-lg text-foreground hover:text-primary transition-colors line-clamp-2">
                      {purchase.packs?.title || "Pack deleted"}
                    </h3>
                  </Link>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">
                    Comprado el{" "}
                    {new Date(purchase.created_at).toLocaleDateString("es-AR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <div className="text-xl md:text-2xl font-black text-foreground">
                    ${formatPrice(purchase.amount_paid)}
                  </div>
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
                <Link href={`/pack/${purchase.pack_id}`} className="flex-1 min-w-0">
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
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
