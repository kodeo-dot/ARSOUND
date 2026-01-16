"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { formatGenreDisplay } from "@/lib/genres"
import { createBrowserClient } from "@/lib/supabase/client"
import { PRODUCT_TYPES } from "@/lib/constants/product-types"
import { PlanBadge } from "@/components/plan-badge"

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
  product_type?: string
  daw_compatibility?: string[]
  tags: string[] | null
  demo_audio_url: string | null
  has_discount?: boolean
  discount_percent?: number
  discount_requires_code?: boolean
  producer_plan?: string | null
  likes_count?: number
  profiles?: {
    username: string | null
  }
}

interface PackCardProps {
  pack: Pack
}

export function PackCard({ pack }: PackCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(pack.likes_count || 0)
  const [isLiking, setIsLiking] = useState(false)
  const [user, setUser] = useState<any>(null)
  const supabase = createBrowserClient()

  useEffect(() => {
    const checkUserAndLike = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      setUser(authUser)

      if (authUser && pack.id) {
        const { data } = await supabase
          .from("pack_likes")
          .select("id")
          .eq("user_id", authUser.id)
          .eq("pack_id", pack.id)
          .maybeSingle()

        setIsLiked(!!data)
      }
    }

    checkUserAndLike()
  }, [pack.id, supabase])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()

    if (!user) {
      alert("Iniciá sesión para dar like a este pack")
      return
    }

    console.log("[v0] PackCard handleLike - pack:", pack.id, "isLiked:", isLiked, "count:", likesCount)
    setIsLiking(true)

    try {
      if (isLiked) {
        console.log("[v0] Removing like from pack card...")
        const { error } = await supabase.from("pack_likes").delete().eq("user_id", user.id).eq("pack_id", pack.id)

        if (!error) {
          console.log("[v0] Like removed from pack card")
          setIsLiked(false)
          setLikesCount((prev) => {
            const newCount = Math.max(0, prev - 1)
            console.log("[v0] PackCard count:", prev, "->", newCount)
            return newCount
          })
        } else {
          console.error("[v0] Error removing like from pack card:", error)
        }
      } else {
        console.log("[v0] Adding like from pack card...")
        const { error } = await supabase.from("pack_likes").insert({
          user_id: user.id,
          pack_id: pack.id,
        })

        if (!error) {
          console.log("[v0] Like added from pack card")
          setIsLiked(true)
          setLikesCount((prev) => {
            const newCount = prev + 1
            console.log("[v0] PackCard count:", prev, "->", newCount)
            return newCount
          })
        } else {
          console.error("[v0] Error adding like from pack card:", error)
        }
      }
    } catch (error) {
      console.error("[v0] Error toggling like in pack card:", error)
    } finally {
      setIsLiking(false)
    }
  }

  const isFreepack = pack.price === 0
  const shouldShowDiscount =
    pack.has_discount && pack.discount_percent && pack.discount_percent > 0 && !pack.discount_requires_code
  const discountAmount = shouldShowDiscount ? (pack.price * (pack.discount_percent || 0)) / 100 : 0
  const finalPrice = shouldShowDiscount ? pack.price - discountAmount : pack.price

  const productTypeLabel =
    pack.product_type && pack.product_type !== "sample_pack"
      ? PRODUCT_TYPES[pack.product_type as keyof typeof PRODUCT_TYPES]?.label
      : null

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

          {/* Like Button */}
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm hover:bg-background rounded-full h-10 w-10"
            onClick={handleLike}
            disabled={isLiking}
          >
            <Heart
              className={`h-5 w-5 transition-all ${isLiked ? "fill-red-500 text-red-500 scale-110" : ""} ${isLiking ? "animate-pulse" : ""}`}
            />
          </Button>

          {shouldShowDiscount && (
            <Badge className="absolute top-4 left-4 bg-orange-500 text-white font-black px-4 py-2 rounded-full text-sm shadow-lg">
              {pack.discount_percent}% OFF
            </Badge>
          )}

          {/* Genre Badge */}
          {pack.genre && (
            <Badge
              className={`absolute ${shouldShowDiscount ? "top-16" : "top-4"} left-4 bg-primary/90 backdrop-blur-sm text-primary-foreground font-bold px-3 py-1 rounded-full text-xs`}
            >
              {formatGenreDisplay(pack.genre, pack.subgenre)}
            </Badge>
          )}

          {productTypeLabel && (
            <Badge className="absolute bottom-4 left-4 bg-accent/90 backdrop-blur-sm text-white font-bold px-3 py-1 rounded-full text-xs">
              {productTypeLabel}
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
            <PlanBadge plan={pack.producer_plan} size="xs" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          {pack.bpm && <span className="bg-accent text-white px-3 py-1 rounded-full">{pack.bpm} BPM</span>}
          {pack.tags && pack.tags.length > 0 && (
            <>
              {pack.tags.slice(0, 2).map((tag: string, index: number) => (
                <span key={index} className="bg-accent text-white px-3 py-1 rounded-full">
                  {tag}
                </span>
              ))}
              {pack.tags.length > 2 && (
                <span className="bg-accent text-white px-3 py-1 rounded-full">+{pack.tags.length - 2}</span>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          {isFreepack ? (
            <div className="text-3xl font-black text-green-600">GRATIS</div>
          ) : shouldShowDiscount ? (
            <div>
              <div className="text-lg font-bold text-muted-foreground line-through">${formatPrice(pack.price)}</div>
              <div className="text-3xl font-black text-foreground">${formatPrice(finalPrice)}</div>
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
