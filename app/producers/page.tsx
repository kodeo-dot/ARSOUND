"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, Package, Users, Search, Loader2 } from "lucide-react"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase/client"
import { PlanBadge } from "@/components/plan-badge"

interface ProducerWithPlan {
  id: string
  username: string
  bio: string | null
  avatar_url: string | null
  followers_count: number
  packs_count: number
  total_sales: number
  created_at: string
  plan_type: string | null
}

export default function ProducersPage() {
  const [producers, setProducers] = useState<ProducerWithPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("ventas")

  const supabase = createBrowserClient()

  useEffect(() => {
    const fetchProducers = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase.from("profiles").select("*").order("total_sales", { ascending: false })

        if (error) {
          console.error("[v0] Error fetching producers:", error)
          return
        }

        const producersWithPlans = (data || []).map((producer: any) => ({
          id: producer.id,
          username: producer.username,
          bio: producer.bio,
          avatar_url: producer.avatar_url,
          followers_count: producer.followers_count || 0,
          packs_count: producer.packs_count || 0,
          total_sales: producer.total_sales || 0,
          created_at: producer.created_at,
          plan_type: producer.plan || "free",
        }))

        // Sort producers
        const sorted = producersWithPlans.sort((a: any, b: any) => {
          // Sort Studio Plus first (priority 2), then De 0 a Hit (priority 1)
          const priorityOrder: Record<string, number> = {
            studio_plus: 2,
            de_0_a_hit: 1,
            free: 0,
          }
          const priorityA = priorityOrder[a.plan_type || ""] || 0
          const priorityB = priorityOrder[b.plan_type || ""] || 0

          if (priorityA !== priorityB) {
            return priorityB - priorityA
          }

          // Within same tier, apply secondary sort
          if (sortBy === "ventas") {
            return b.total_sales - a.total_sales
          } else if (sortBy === "seguidores") {
            return b.followers_count - a.followers_count
          } else if (sortBy === "packs") {
            return b.packs_count - a.packs_count
          } else if (sortBy === "reciente") {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          }
          return 0
        })

        setProducers(sorted)
      } catch (error) {
        console.error("[v0] Error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducers()
  }, [sortBy, supabase])

  const filteredProducers = producers.filter((producer) => {
    if (searchQuery === "") return true

    const query = searchQuery.toLowerCase()
    return producer.username?.toLowerCase().includes(query) || producer.bio?.toLowerCase().includes(query)
  })

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary mb-3">
              <Star className="h-4 w-4" />
              PRODUCTORES
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-foreground mb-3">Comunidad de Productores</h1>
            <p className="text-lg text-muted-foreground">Explorá y conectá con los mejores productores de Argentina</p>
          </div>

          {/* Search and Filters */}
          <Card className="p-6 rounded-3xl border-border mb-8 bg-card">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por nombre o usuario..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-base rounded-xl border-border bg-background"
                />
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-12 rounded-xl bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ventas">Más Ventas</SelectItem>
                    <SelectItem value="seguidores">Más Seguidores</SelectItem>
                    <SelectItem value="packs">Más Packs</SelectItem>
                    <SelectItem value="reciente">Más Recientes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              Mostrando <span className="font-bold text-foreground">{filteredProducers.length}</span> productores
            </p>
          </div>

          {/* Producers Grid */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducers.length > 0 ? (
                filteredProducers.map((producer) => {
                  return (
                    <Link key={producer.id} href={`/profile/${producer.username}`}>
                      <Card className="p-6 rounded-3xl border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 bg-card cursor-pointer group h-full">
                        <div className="flex flex-col h-full">
                          <div className="flex items-start gap-4 mb-4">
                            <Avatar className="h-16 w-16 ring-2 ring-border group-hover:ring-primary transition-all">
                              <AvatarImage src={producer.avatar_url || "/placeholder.svg"} alt={producer.username} />
                              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-bold text-lg">
                                {producer.username?.[0]?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-black text-lg text-foreground truncate group-hover:text-primary transition-colors">
                                  {producer.username}
                                </h3>
                                <PlanBadge plan={producer.plan_type} size="sm" />
                              </div>
                              <p className="text-sm text-muted-foreground">@{producer.username}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs pt-4 border-t border-border">
                            <div className="flex items-center gap-1.5">
                              <Package className="h-3.5 w-3.5 text-primary" />
                              <span className="font-semibold text-foreground">{producer.packs_count || 0}</span>
                              <span className="text-muted-foreground">packs</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5 text-primary" />
                              <span className="font-semibold text-foreground">{producer.followers_count || 0}</span>
                              <span className="text-muted-foreground">seguidores</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  )
                })
              ) : (
                <div className="col-span-full py-20 text-center">
                  <p className="text-xl text-muted-foreground mb-4">No se encontraron productores</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
