"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Heart } from "lucide-react"
import { useState } from "react"
import { useAudioPlayer } from "@/hooks/use-audio-player"
import Link from "next/link"
import { getPlanBadge } from "@/lib/plans"
import { formatGenreDisplay } from "@/lib/genres"

interface Pack {
  id: string
  title: string
  user_id: string
  price: number
  cover_image_url: string | null
  samples_count: number | null
  genre: string | null
  subgenre: string | null
  bpm: string | null
  tags: string[] | null
  demo_audio_url: string | null
  has_discount?: boolean
  discount_percent?: number
  producer_plan?: string | null
  profiles?: {
    username: string | null
  }
}

interface PackCardProps {
  pack: Pack
}

export function PackCard({ pack }: PackCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const { playPack } = useAudioPlayer()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const handlePlay = () => {
    if (pack.demo_audio_url) {
      playPack({
        id: pack.id,
        title: pack.title,
        producer: pack.profiles?.username || "Usuario",
        image: pack.cover_image_url || "/placeholder.svg",
        audioUrl: pack.demo_audio_url,
      })
    }
  }

  const handlePurchase = async (e: React.MouseEvent) => {
    e.preventDefault()
    setIsPurchasing(true)

    // TODO: Implement direct purchase flow with payment
    setTimeout(() => {
      setIsPurchasing(false)
    }, 1000)
  }

  const isFreepack = pack.price === 0
  const shouldShowDiscount = !isFreepack && pack.has_discount && pack.discount_percent && pack.discount_percent > 0
  const finalPrice = shouldShowDiscount ? Math.floor(pack.price * (1 - pack.discount_percent / 100)) : pack.price

  const planBadge = pack.producer_plan ? getPlanBadge(pack.producer_plan as any) : null

  return (
    <Card className="group overflow-hidden border border-border hover:border-primary/40 transition-all duration-300 hover:shadow-xl rounded-2xl bg-card">
      <Link href={`/pack/${pack.id}`}>
        <div className="relative aspect-square overflow-hidden bg-muted cursor-pointer">
          <img
            src={pack.cover_image_url || "/placeholder.svg?height=400&width=400"}
            alt={pack.title}
            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
            crossOrigin="anonymous"
          />

          {/* Play Button Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Button
              size="lg"
              className="rounded-full h-20 w-20 p-0 bg-primary text-primary-foreground shadow-2xl hover:scale-110 transition-transform"
              onClick={(e) => {
                e.preventDefault()
                handlePlay()
              }}
              disabled={!pack.demo_audio_url}
            >
              <Play className="h-8 w-8 ml-1" fill="currentColor" />
            </Button>
          </div>

          {/* Like Button */}
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm hover:bg-background rounded-full h-10 w-10"
            onClick={(e) => {
              e.preventDefault()
              setIsLiked(!isLiked)
            }}
          >
            <Heart className={`h-5 w-5 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
          </Button>

          {/* Genre Badge */}
          {pack.genre && (
            <Badge className="absolute top-4 left-4 bg-primary/90 backdrop-blur-sm text-primary-foreground font-bold px-3 py-1 rounded-full text-xs">
              {formatGenreDisplay(pack.genre, pack.subgenre)}
            </Badge>
          )}

          {/* Discount Badge */}
          {shouldShowDiscount && (
            <Badge className="absolute bottom-4 left-4 bg-orange-500/90 backdrop-blur-sm text-white font-bold px-3 py-1 rounded-full">
              {pack.discount_percent}% OFF
            </Badge>
          )}
        </div>
      </Link>

      <div className="p-5 space-y-3">
        <div>
          <Link href={`/pack/${pack.id}`}>
            <h3 className="font-bold text-xl mb-1 text-foreground text-balance line-clamp-1 hover:text-primary transition-colors cursor-pointer">
              {pack.title}
            </h3>
          </Link>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground font-medium">{pack.profiles?.username || "Usuario"}</p>
            {planBadge && <span className="text-base">{planBadge.icon}</span>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-medium">
          {pack.bpm && <span className="bg-accent px-3 py-1 rounded-full">{pack.bpm} BPM</span>}
          {pack.tags && pack.tags.length > 0 && (
            <>
              {pack.tags.slice(0, 2).map((tag: string, index: number) => (
                <span key={index} className="bg-accent px-3 py-1 rounded-full">
                  {tag}
                </span>
              ))}
              {pack.tags.length > 2 && (
                <span className="bg-accent px-3 py-1 rounded-full">+{pack.tags.length - 2}</span>
              )}
            </>
          )}
        </div>

        {/* Price section */}
        <div className="flex items-center justify-between pt-2">
          {isFreepack ? (
            <div className="text-3xl font-black text-green-600">GRATIS</div>
          ) : shouldShowDiscount ? (
            <div>
              <div className="text-xl font-bold text-muted-foreground line-through">${formatPrice(pack.price)}</div>
              <div className="text-3xl font-black text-primary">${formatPrice(finalPrice)}</div>
            </div>
          ) : (
            <div className="text-3xl font-black text-foreground">${formatPrice(pack.price)}</div>
          )}
          {!isFreepack && <div className="text-xs font-medium text-muted-foreground">ARS</div>}
        </div>
      </div>
    </Card>
  )
}
