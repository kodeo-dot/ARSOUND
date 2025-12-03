"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, Package } from "lucide-react"
import Link from "next/link"

interface LikedPack {
  pack_id: string
  pack: {
    id: string
    title: string
    price: number
    cover_image_url: string | null
    genre: string | null
    is_deleted: boolean
  } | null
}

export default function SavedPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [likedPacks, setLikedPacks] = useState<LikedPack[]>([])

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

      const { data: likes, error } = await supabase
        .from("pack_likes")
        .select(`
          pack_id,
          packs:pack_id (
            id,
            title,
            price,
            cover_image_url,
            genre,
            is_deleted
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (!error && likes) {
        const validLikes = likes.filter((like: any) => like.packs && !like.packs.is_deleted)
        setLikedPacks(validLikes as any)
      }
    } catch (error) {
      console.error("Error loading saved packs:", error)
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="mb-8 animate-pulse">
            <div className="h-10 bg-muted rounded-lg w-48 mb-2" />
            <div className="h-6 bg-muted rounded-lg w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden border-border rounded-2xl animate-pulse">
                <div className="aspect-square bg-muted" />
                <div className="p-5 space-y-3">
                  <div className="h-6 bg-muted rounded" />
                  <div className="h-10 bg-muted rounded" />
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
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-black text-foreground">Packs Guardados</h1>
          </div>
          <p className="text-muted-foreground">Tus packs favoritos marcados con Me gusta</p>
        </div>

        {likedPacks.length === 0 ? (
          <Card className="p-12 text-center rounded-3xl border-2 border-dashed border-border">
            <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-bold text-foreground mb-2">Aún no tenés packs guardados en Me gusta</h3>
            <p className="text-muted-foreground mb-6">Explorá packs y guardá tus favoritos para verlos acá</p>
            <Link href="/">
              <Button className="gap-2 rounded-full h-12 px-8">
                <Package className="h-4 w-4" />
                Explorar Packs
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {likedPacks.map((like) => {
              const pack = like.pack
              if (!pack) return null

              return (
                <Card
                  key={pack.id}
                  className="overflow-hidden border-border rounded-2xl hover:border-primary/40 transition-all group"
                >
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
                          <Package className="h-16 w-16 text-muted-foreground" />
                        </div>
                      )}
                      {pack.genre && (
                        <Badge className="absolute top-3 right-3 bg-secondary text-secondary-foreground font-bold">
                          {pack.genre}
                        </Badge>
                      )}
                    </div>
                    <div className="p-5 space-y-3">
                      <h3 className="font-bold text-lg text-foreground line-clamp-2">{pack.title}</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          {pack.price === 0 ? (
                            <div className="text-2xl font-black text-green-600">GRATIS</div>
                          ) : (
                            <>
                              <div className="text-2xl font-black text-foreground">${formatPrice(pack.price)}</div>
                              <div className="text-xs text-muted-foreground">ARS</div>
                            </>
                          )}
                        </div>
                        <Button variant="outline" className="rounded-full bg-transparent">
                          Ver Pack
                        </Button>
                      </div>
                    </div>
                  </Link>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
