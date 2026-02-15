"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Download,
  Music,
  CreditCard,
  ChevronDown,
  Tag,
  Play,
  Heart,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Currency = "ARS" | "USD" | "CLP" | "MXN"

const EXCHANGE_RATES: Record<Currency, number> = {
  ARS: 1,
  USD: 0.00085,
  CLP: 0.76,
  MXN: 0.0145,
}

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  ARS: "$",
  USD: "US$",
  CLP: "CL$",
  MXN: "MX$",
}

const CURRENCY_FLAGS: Record<Currency, string> = {
  ARS: "AR",
  USD: "US",
  CLP: "CL",
  MXN: "MX",
}

interface DynamicPricingCardProps {
  title?: string
  producer?: string
  priceARS?: number
  genre?: string
  bpm?: number
  format?: string
  coverUrl?: string
  tracksCount?: number
}

export function DynamicPricingCard({
  title = "Neon Cumbia Vol. 3",
  producer = "mixflp",
  priceARS = 4500,
  genre = "Cumbia Digital",
  bpm = 98,
  format = "WAV 24bit",
  coverUrl,
  tracksCount = 47,
}: DynamicPricingCardProps) {
  const [currency, setCurrency] = useState<Currency>("ARS")
  const [isLiked, setIsLiked] = useState(false)

  const convertedPrice = currency === "ARS"
    ? priceARS
    : Math.round(priceARS * EXCHANGE_RATES[currency] * 100) / 100

  const formattedPrice = currency === "ARS"
    ? convertedPrice.toLocaleString("es-AR", { maximumFractionDigits: 0 })
    : convertedPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <Card className="overflow-hidden rounded-2xl border-border bg-card relative group">
      {/* Cover Image */}
      <div className="relative aspect-[4/3] bg-secondary overflow-hidden">
        {coverUrl ? (
          <img src={coverUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[oklch(0.3_0.1_285)] to-[oklch(0.2_0.08_200)]">
            <Music className="h-16 w-16 text-primary/40" />
          </div>
        )}

        {/* Latam Discount Badge */}
        <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground font-bold text-xs px-3 py-1.5 rounded-full gap-1.5 shadow-lg shadow-primary/30">
          <Tag className="h-3 w-3" />
          Descuento LATAM
        </Badge>

        {/* Genre badge */}
        <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground font-bold text-xs px-3 py-1.5 rounded-full">
          {genre}
        </Badge>

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/30 backdrop-blur-sm">
          <button className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/40 hover:scale-105 transition-transform">
            <Play className="h-7 w-7 ml-1" fill="currentColor" />
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-black text-foreground truncate">{title}</h3>
            <p className="text-sm text-muted-foreground font-medium">{producer}</p>
          </div>
          <button
            onClick={() => setIsLiked(!isLiked)}
            className="flex-shrink-0 mt-0.5"
          >
            <Heart
              className={`h-5 w-5 transition-all ${isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-foreground"}`}
            />
          </button>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Music className="h-3.5 w-3.5" />
            {tracksCount} samples
          </span>
          <span>{bpm} BPM</span>
          <span>{format}</span>
        </div>

        {/* Price + Currency Switcher */}
        <div className="flex items-end justify-between gap-3 mb-4">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-foreground">
                {CURRENCY_SYMBOLS[currency]}{formattedPrice}
              </span>
            </div>
            {currency !== "ARS" && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {"~ $"}{priceARS.toLocaleString("es-AR")} ARS
              </p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 rounded-full text-xs font-semibold bg-secondary border-border h-8 px-3">
                <span className="font-mono">{currency}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px]">
              {(Object.keys(EXCHANGE_RATES) as Currency[]).map((cur) => (
                <DropdownMenuItem
                  key={cur}
                  onClick={() => setCurrency(cur)}
                  className="gap-2 text-sm font-medium"
                >
                  <span className="text-xs text-muted-foreground w-5">{CURRENCY_FLAGS[cur]}</span>
                  <span>{cur}</span>
                  {cur === currency && (
                    <span className="ml-auto text-primary text-xs">&#10003;</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button className="flex-1 rounded-full font-bold gap-2 h-11 shadow-lg shadow-primary/20">
            <CreditCard className="h-4 w-4" />
            Comprar
          </Button>
          <Button variant="outline" size="icon" className="rounded-full h-11 w-11 bg-secondary border-border">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
