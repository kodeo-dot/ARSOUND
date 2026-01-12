"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, TrendingUp, Loader2 } from 'lucide-react'
import Link from "next/link"

interface Pack {
  id: string
  title: string
  price: number
  cover_image_url: string | null
  genre: string | null
  downloads_count: number
  profiles: {
    username: string
    avatar_url: string | null
  } | null
}

export function TopMonthlyPacks() {
  const [packs, setPacks] = useState<Pack[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchTopPacks = async () => {
      try {
        setLoading(true)

        // Fetch top packs from the last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { data, error } = await supabase
          .from("packs")
          .select(`
            id,
            title,
            price,
            cover_image_url,
            genre,
            downloads_count,
            total_plays,
            created_at,
            profiles:user_id (
              username,
              avatar_url
            )
          `)
          .gte("created_at", thirtyDaysAgo.toISOString())
          .order("downloads_count", { ascending: false })
          .order("total_plays", { ascending: false })
          .limit(6)

        if (!error && data) {
          setPacks(data as any)
        }
      } catch (error) {
        console.error("[v0] Error fetching top packs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTopPacks()
  }, [supabase])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  if (loading) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        </div>
      </section>
    )
  }

  if (packs.length === 0) {
    return null
  }

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            <h2 className="text-4xl md:text-5xl font-black text-foreground">Mejores Packs del Mes</h2>
          </div>
          <p className="text-lg text-muted-foreground">Los packs más vendidos de este mes</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {packs.map((pack, index) => (
            <Link key={pack.id} href={`/pack/${pack.id}`}>
              <Card className="overflow-hidden border-border rounded-2xl hover:border-primary/40 transition-all group h-full cursor-pointer">
                {/* Ranking Badge */}
                <div className="relative aspect-square bg-muted overflow-hidden">
                  <img
                    src={pack.cover_image_url || "/placeholder.svg?height=400&width=400&query=music pack cover"}
                    alt={pack.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground font-black text-base h-10 w-10 flex items-center justify-center rounded-full">
                    #{index + 1}
                  </Badge>
                  {pack.genre && (
                    <Badge className="absolute top-3 right-3 bg-secondary text-secondary-foreground font-bold">
                      {pack.genre}
                    </Badge>
                  )}
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-lg text-foreground line-clamp-2 mb-2">{pack.title}</h3>
                    <div className="flex items-center gap-2">
                      {pack.profiles?.avatar_url && (
                        <img
                          src={pack.profiles.avatar_url || "/placeholder.svg"}
                          alt={pack.profiles.username}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      )}
                      <span className="text-sm text-muted-foreground">{pack.profiles?.username || "Productor"}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="text-2xl font-black text-foreground">
                          ${formatPrice(pack.price)}
                        </div>
                        <div className="text-xs text-muted-foreground">ARS</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-primary">{pack.downloads_count} ventas</div>
                      <div className="text-xs text-muted-foreground">{pack.total_plays || 0} plays</div>
                    </div>
                  </div>

                  <Button className="w-full rounded-full h-11 font-bold">
                    Ver Pack
                  </Button>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
