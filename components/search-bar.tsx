"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Loader2, Package, User, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PRODUCT_TYPES } from "@/lib/constants/product-types"
import { PlanBadge } from "@/components/plan-badge"

interface SearchResult {
  packs: Array<{
    id: string
    title: string
    genre: string
    subgenre?: string
    product_type: string
    price: number
    cover_image_url: string | null
    profiles: {
      username: string
    }
  }>
  users: Array<{
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
    packs_count: number
    plan?: string | null
  }>
  query: string
  totalResults: number
}

export function SearchBar() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsSearching(true)
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
          if (response.ok) {
            const data = await response.json()
            setResults(data.data)
            setShowResults(true)
          }
        } catch (error) {
          console.error("Search error:", error)
        } finally {
          setIsSearching(false)
        }
      } else {
        setResults(null)
        setShowResults(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [query])

  const formatPrice = (price: number) => {
    if (price === 0) return "GRATIS"
    return `$${new Intl.NumberFormat("es-AR").format(price)}`
  }

  const clearSearch = () => {
    setQuery("")
    setResults(null)
    setShowResults(false)
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar packs o creadores..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          className="pl-12 pr-12 h-11 rounded-full text-base bg-card border-border"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        {isSearching && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-primary" />
        )}
      </div>

      {showResults && results && (
        <Card className="absolute top-full mt-2 w-full max-h-[500px] overflow-y-auto z-50 p-4 rounded-2xl border-border shadow-xl bg-card">
          {results.totalResults === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No se encontraron resultados para "{query}"</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Packs */}
              {results.packs.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="h-4 w-4 text-primary" />
                    <h3 className="font-bold text-foreground">Packs ({results.packs.length})</h3>
                  </div>
                  <div className="space-y-2">
                    {results.packs.map((pack) => (
                      <Link
                        key={pack.id}
                        href={`/pack/${pack.id}`}
                        onClick={() => setShowResults(false)}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                      >
                        <img
                          src={pack.cover_image_url || "/placeholder.svg?height=48&width=48"}
                          alt={pack.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">{pack.title}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs text-muted-foreground">{pack.profiles.username}</p>
                            {pack.genre && (
                              <Badge variant="outline" className="text-xs">
                                {pack.genre}
                              </Badge>
                            )}
                            {pack.product_type && pack.product_type !== "sample_pack" && (
                              <Badge variant="outline" className="text-xs">
                                {PRODUCT_TYPES[pack.product_type as keyof typeof PRODUCT_TYPES]?.label}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-foreground text-sm">{formatPrice(pack.price)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Users */}
              {results.users.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-4 w-4 text-primary" />
                    <h3 className="font-bold text-foreground">Creadores ({results.users.length})</h3>
                  </div>
                  <div className="space-y-2">
                    {results.users.map((user) => (
                      <Link
                        key={user.id}
                        href={`/profile/${user.username}`}
                        onClick={() => setShowResults(false)}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                      >
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url || "/placeholder.svg"}
                            alt={user.username}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                            {user.username[0].toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground text-sm">{user.username}</p>
                            <PlanBadge plan={user.plan} size="xs" />
                          </div>
                          <p className="text-xs text-muted-foreground">{user.packs_count} packs</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
