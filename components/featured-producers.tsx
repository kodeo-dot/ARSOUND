"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, Package, Users } from "lucide-react"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import { hasPlanBadge, getPlanBadge } from "@/lib/plans"

interface ProducerWithPlan {
  id: string
  username: string
  bio: string | null
  avatar_url: string | null
  followers_count: number
  packs_count: number
  plan_type: string | null
}

export function FeaturedProducers() {
  const [producers, setProducers] = useState<ProducerWithPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createBrowserClient()

  useEffect(() => {
    const fetchFeaturedProducers = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .order("followers_count", { ascending: false })

        if (error) {
          console.error("[v0] Error fetching producers:", error)
          return
        }

        // Map the profiles result to component format
        const producersWithPlans = (data || []).map((producer: any) => ({
          id: producer.id,
          username: producer.username,
          bio: producer.bio,
          avatar_url: producer.avatar_url,
          followers_count: producer.followers_count || 0,
          packs_count: producer.packs_count || 0,
          plan_type: producer.plan || "free", // Use profiles.plan directly
        }))

        // Filter to only show producers with active badges (De 0 a Hit or Studio Plus)
        const featuredProducers = producersWithPlans
          .filter((p: any) => hasPlanBadge(p.plan_type))
          .sort((a: any, b: any) => {
            // Sort Studio Plus first (featured_priority 2), then De 0 a Hit (featured_priority 1)
            const priorityOrder: Record<string, number> = {
              studio_plus: 2,
              de_0_a_hit: 1,
            }
            const priorityA = priorityOrder[a.plan_type || ""] || 0
            const priorityB = priorityOrder[b.plan_type || ""] || 0

            if (priorityA !== priorityB) {
              return priorityB - priorityA
            }

            // Within same tier, sort by followers
            return b.followers_count - a.followers_count
          })
          .slice(0, 6)

        setProducers(featuredProducers)
      } catch (error) {
        console.error("[v0] Error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeaturedProducers()
  }, [supabase])

  if (isLoading) {
    return (
      <section className="py-20 bg-accent/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        </div>
      </section>
    )
  }

  if (producers.length === 0) {
    return null
  }

  return (
    <section className="py-20 bg-accent/30">
      <div className="container mx-auto px-4">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <Star className="h-6 w-6 text-primary" />
            <h2 className="text-4xl md:text-5xl font-black text-foreground">Productores Destacados</h2>
          </div>
          <p className="text-lg text-muted-foreground">Conocé a los mejores creadores de sonidos de ARSOUND</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {producers.map((producer) => {
            const badge = getPlanBadge(producer.plan_type as any)
            return (
              <Link key={producer.id} href={`/profile/${producer.username}`}>
                <Card className="p-6 rounded-3xl border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 bg-card cursor-pointer group">
                  <div className="flex items-start gap-4">
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
                        {badge && <span className="text-xl flex-shrink-0">{badge.icon}</span>}
                      </div>
                      <p className="text-sm text-muted-foreground">@{producer.username}</p>

                      <div className="flex items-center gap-4 text-xs mt-3">
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
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>

        <div className="flex justify-center mt-12">
          <Link href="/producers">
            <button className="px-8 py-3 rounded-full font-bold text-base bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              Ver Todos los Productores
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}
