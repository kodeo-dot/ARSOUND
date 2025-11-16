"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy, TrendingUp, Play, Loader2 } from 'lucide-react'
import Link from "next/link"
import { PackCard } from "@/components/pack-card"

interface TopPack {
  id: string
  title: string
  price: number
  cover_image_url: string | null
  total_plays: number
  downloads_count: number
  monthly_sales: number
  profiles: {
    username: string
    avatar_url: string | null
  }
}

export function TopMonthlyPacks() {
  const [loading, setLoading] = useState(true)
  const [packs, setPacks] = useState<TopPack[]>([])

  useEffect(() => {
    async function fetchTopPacks() {
      try {
        const response = await fetch("/api/packs/top-month")
        const data = await response.json()
        
        if (data.packs) {
          setPacks(data.packs)
        }
      } catch (error) {
        console.error("[v0] Error fetching top monthly packs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTopPacks()
  }, [])

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    )
  }

  if (packs.length === 0) {
    return null
  }

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-3 mb-4 px-6 py-3 bg-primary/10 rounded-full">
            <Trophy className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold text-primary uppercase tracking-wide">
              Trending Este Mes
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4">
            Mejores Packs del Mes
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Los packs más vendidos de los últimos 30 días. Descubrí lo que está sonando.
          </p>
        </div>

        {/* Top 3 Featured */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {packs.slice(0, 3).map((pack, index) => (
            <Card
              key={pack.id}
              className="relative overflow-hidden rounded-3xl border-2 border-border hover:border-primary/40 transition-all group"
            >
              {/* Rank Badge */}
              <div className="absolute top-4 left-4 z-10">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl shadow-lg ${
                  index === 0 ? 'bg-yellow-500 text-white' :
                  index === 1 ? 'bg-gray-400 text-white' :
                  'bg-orange-500 text-white'
                }`}>
                  {index + 1}
                </div>
              </div>

              {/* Sales Badge */}
              <div className="absolute top-4 right-4 z-10">
                <Badge className="bg-green-500 text-white font-bold shadow-lg">
                  {pack.monthly_sales} ventas
                </Badge>
              </div>

              <Link href={`/pack/${pack.id}`}>
                <div className="relative aspect-square bg-muted overflow-hidden">
                  {pack.cover_image_url ? (
                    <img
                      src={pack.cover_image_url || "/placeholder.svg"}
                      alt={pack.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                      <Trophy className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="font-black text-xl text-foreground line-clamp-2 mb-2">
                      {pack.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <img
                        src={pack.profiles.avatar_url || "/placeholder.svg?height=24&width=24"}
                        alt={pack.profiles.username}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="text-sm text-muted-foreground">
                        {pack.profiles.username}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Play className="h-4 w-4" />
                      <span>{pack.total_plays || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>{pack.downloads_count || 0} ventas</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div>
                      <div className="text-2xl font-black text-foreground">
                        ${new Intl.NumberFormat("es-AR").format(pack.price)}
                      </div>
                      <div className="text-xs text-muted-foreground">ARS</div>
                    </div>
                    <Button className="rounded-full">
                      Ver Pack
                    </Button>
                  </div>
                </div>
              </Link>
            </Card>
          ))}
        </div>

        {/* Remaining Packs */}
        {packs.length > 3 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packs.slice(3).map((pack, index) => (
              <div key={pack.id} className="relative">
                <div className="absolute -top-3 -left-3 z-10">
                  <div className="w-10 h-10 rounded-full bg-muted-foreground/20 flex items-center justify-center font-bold text-sm text-foreground">
                    {index + 4}
                  </div>
                </div>
                <PackCard pack={pack} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
