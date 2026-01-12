"use client"

import { PackCard } from "@/components/pack-card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { GENRES } from "@/lib/genres"
import Link from "next/link"

export function PackGrid() {
  const [packs, setPacks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedGenre, setSelectedGenre] = useState("Todos")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("recientes")
  const [priceRange, setPriceRange] = useState("todos")
  const [bpmRange, setBpmRange] = useState("todos")
  const [showFilters, setShowFilters] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const fetchPacks = async () => {
      setIsLoading(true)
      try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          console.error("[ARSOUND] Supabase not configured")
          setPacks([])
          setIsLoading(false)
          return
        }

        let query = supabase
          .from("packs")
          .select(`
            *,
            profiles:user_id (
              username,
              display_name,
              avatar_url
            )
          `)
          .eq("is_deleted", false)

        if (sortBy === "recientes") {
          query = query.order("created_at", { ascending: false })
        } else if (sortBy === "populares") {
          query = query.order("downloads_count", { ascending: false })
        } else if (sortBy === "precio-bajo") {
          query = query.order("price", { ascending: true })
        } else if (sortBy === "precio-alto") {
          query = query.order("price", { ascending: false })
        }

        const { data, error } = await query

        if (error) {
          console.error("[ARSOUND] Error fetching packs:", error)
          setPacks([])
          return
        }

        const validPacks = (data || []).filter((pack) => pack.profiles !== null)
        setPacks(validPacks)
      } catch (error) {
        console.error("[ARSOUND] Unexpected error:", error)
        setPacks([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPacks()
  }, [sortBy, supabase])

  const filteredPacks = packs.filter((pack) => {
    const matchesGenre = selectedGenre === "Todos" || pack.genre === selectedGenre
    const matchesSearch =
      searchQuery === "" ||
      pack.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pack.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pack.genre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pack.subgenre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pack.profiles?.username?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesPrice =
      priceRange === "todos" ||
      (priceRange === "0-2000" && pack.price <= 2000) ||
      (priceRange === "2000-4000" && pack.price > 2000 && pack.price <= 4000) ||
      (priceRange === "4000+" && pack.price > 4000)

    const matchesBpm =
      bpmRange === "todos" ||
      !pack.bpm ||
      (bpmRange === "80-100" && pack.bpm >= 80 && pack.bpm <= 100) ||
      (bpmRange === "100-120" && pack.bpm > 100 && pack.bpm <= 120) ||
      (bpmRange === "120-140" && pack.bpm > 120 && pack.bpm <= 140) ||
      (bpmRange === "140+" && pack.bpm > 140)

    return matchesGenre && matchesSearch && matchesPrice && matchesBpm
  })

  return (
    <section id="packs" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h2 className="text-4xl md:text-5xl font-black text-foreground mb-3">Explorar Packs</h2>
          <p className="text-lg text-muted-foreground">Encuentra el sonido perfecto para tu próximo hit</p>
        </div>

        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {GENRES.slice(0, 6).map((genre) => (
              <Button
                key={genre}
                variant={selectedGenre === genre ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedGenre(genre)}
                className="rounded-full font-semibold"
              >
                {genre}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPacks.length > 0 ? (
                filteredPacks.slice(0, 8).map((pack) => <PackCard key={pack.id} pack={pack} />)
              ) : (
                <div className="col-span-full py-16 text-center">
                  <p className="text-lg text-muted-foreground mb-4">No se encontraron packs</p>
                </div>
              )}
            </div>

            {filteredPacks.length > 8 && (
              <div className="flex justify-center mt-12">
                <Link href="/marketplace">
                  <Button size="lg" variant="outline" className="rounded-full font-semibold bg-transparent">
                    Ver Todos los Packs
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
