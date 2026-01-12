"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PackCard } from "@/components/pack-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { Search, SlidersHorizontal, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { GENRES } from "@/lib/genres"

export default function MarketplacePage() {
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
        let query = supabase
          .from("packs")
          .select(
            `
            *,
            profiles:user_id (
              username,
              display_name,
              avatar_url
            )
          `,
          )
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
    <div className="min-h-screen bg-background">
      <Header />

      <section className="py-12 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-black text-foreground mb-4">Marketplace</h1>
            <p className="text-lg text-muted-foreground">
              Explora miles de sample packs profesionales creados por productores de LATAM
            </p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <Card className="p-6 rounded-xl border mb-8">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por nombre, productor o género..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-12 text-base rounded-lg"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full md:hidden gap-2 rounded-lg h-10 bg-transparent"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
              </Button>

              <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 ${showFilters ? "block" : "hidden md:grid"}`}>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Ordenar por</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-10 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recientes">Más Recientes</SelectItem>
                      <SelectItem value="populares">Más Populares</SelectItem>
                      <SelectItem value="precio-bajo">Precio: Menor a Mayor</SelectItem>
                      <SelectItem value="precio-alto">Precio: Mayor a Menor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Precio</label>
                  <Select value={priceRange} onValueChange={setPriceRange}>
                    <SelectTrigger className="h-10 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="0-2000">$0 - $2,000</SelectItem>
                      <SelectItem value="2000-4000">$2,000 - $4,000</SelectItem>
                      <SelectItem value="4000+">Más de $4,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">BPM</label>
                  <Select value={bpmRange} onValueChange={setBpmRange}>
                    <SelectTrigger className="h-10 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="80-100">80-100</SelectItem>
                      <SelectItem value="100-120">100-120</SelectItem>
                      <SelectItem value="120-140">120-140</SelectItem>
                      <SelectItem value="140+">140+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase opacity-0">Acción</label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-10 rounded-lg bg-transparent"
                    onClick={() => {
                      setSearchQuery("")
                      setSelectedGenre("Todos")
                      setPriceRange("todos")
                      setBpmRange("todos")
                      setSortBy("recientes")
                    }}
                  >
                    Limpiar
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <div className="mb-8">
            <div className="mb-4">
              <span className="text-xs font-bold text-muted-foreground uppercase">Géneros</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((genre) => (
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

          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              <span className="font-bold text-foreground">{filteredPacks.length}</span> sample packs encontrados
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPacks.length > 0 ? (
                filteredPacks.map((pack) => <PackCard key={pack.id} pack={pack} />)
              ) : (
                <div className="col-span-full py-20 text-center">
                  <p className="text-lg text-muted-foreground mb-4">No se encontraron packs con estos filtros</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("")
                      setSelectedGenre("Todos")
                      setPriceRange("todos")
                      setBpmRange("todos")
                    }}
                    className="rounded-full"
                  >
                    Limpiar Filtros
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
