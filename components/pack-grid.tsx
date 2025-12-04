"use client"

import { PackCard } from "@/components/pack-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { Filter, Search, SlidersHorizontal, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const GENRES = [
  "Todos",
  "RKT",
  "TRAP",
  "REGGAETON",
  "CUMBIA",
  "CUMBIA VILLERA",
  "DRILL",
  "CUARTETO",
  "DANCEHALL",
  "LATIN URBANO",
  "AFROTRAP",
  "HIP HOP",
  "DEMBOW",
]

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

        // Apply sorting
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
    <section id="packs" className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <h2 className="text-3xl md:text-4xl font-black text-foreground mb-2">Explorar Packs</h2>
          <p className="text-base text-muted-foreground">Encontrá el sonido perfecto para tu próximo hit</p>
        </div>

        <Card className="p-4 rounded-2xl border mb-6">
          <div className="space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nombre, productor o género..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 text-sm rounded-xl border"
              />
            </div>

            {/* Filter Toggle Button - Mobile */}
            <Button
              variant="outline"
              size="sm"
              className="w-full lg:hidden gap-2 rounded-xl h-10 bg-transparent"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
            </Button>

            {/* Filters Row */}
            <div className={`grid grid-cols-1 lg:grid-cols-4 gap-3 ${showFilters ? "block" : "hidden lg:grid"}`}>
              {/* Sort By */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                  Ordenar por
                </label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-10 rounded-xl text-sm">
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

              {/* Price Range */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                  Rango de Precio
                </label>
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger className="h-10 rounded-xl text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los Precios</SelectItem>
                    <SelectItem value="0-2000">$0 - $2,000</SelectItem>
                    <SelectItem value="2000-4000">$2,000 - $4,000</SelectItem>
                    <SelectItem value="4000+">Más de $4,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* BPM Range */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">BPM</label>
                <Select value={bpmRange} onValueChange={setBpmRange}>
                  <SelectTrigger className="h-10 rounded-xl text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los BPM</SelectItem>
                    <SelectItem value="80-100">80-100 BPM</SelectItem>
                    <SelectItem value="100-120">100-120 BPM</SelectItem>
                    <SelectItem value="120-140">120-140 BPM</SelectItem>
                    <SelectItem value="140+">140+ BPM</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide opacity-0 pointer-events-none">
                  Acción
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-10 rounded-xl text-sm bg-transparent"
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedGenre("Todos")
                    setPriceRange("todos")
                    setBpmRange("todos")
                    setSortBy("recientes")
                  }}
                >
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Géneros</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((genre) => (
              <Button
                key={genre}
                variant={selectedGenre === genre ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedGenre(genre)}
                className="rounded-full font-semibold text-xs h-8 px-3"
              >
                {genre}
              </Button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs text-muted-foreground">
            Mostrando <span className="font-bold text-foreground">{filteredPacks.length}</span> packs
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPacks.length > 0 ? (
              filteredPacks.map((pack) => <PackCard key={pack.id} pack={pack} />)
            ) : (
              <div className="col-span-full py-16 text-center">
                <p className="text-lg text-muted-foreground mb-4">
                  {packs.length === 0
                    ? "Todavía no hay packs subidos. ¡Sé el primero en subir uno!"
                    : "No se encontraron packs con estos filtros"}
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedGenre("Todos")
                    setPriceRange("todos")
                    setBpmRange("todos")
                  }}
                  className="rounded-xl"
                >
                  {packs.length === 0 ? "Subir mi Pack" : "Limpiar Filtros"}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Load More */}
        {filteredPacks.length > 0 && (
          <div className="flex justify-center mt-12">
            <Button variant="outline" size="sm" className="rounded-xl px-6 h-10 font-semibold bg-transparent">
              Cargar más packs
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
