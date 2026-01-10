"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { createBrowserClient } from "@/lib/supabase/client"

interface Review {
  id: string
  rating: number
  comment: string
  created_at: string
  updated_at: string
  user: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

interface PackReviewsProps {
  packId: string
  canReview: boolean
  userReview?: Review
}

export function PackReviews({ packId, canReview, userReview: initialUserReview }: PackReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(initialUserReview?.rating || 0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState(initialUserReview?.comment || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userReview, setUserReview] = useState<Review | undefined>(initialUserReview)
  const [isEditing, setIsEditing] = useState(false)
  const supabase = createBrowserClient()

  useEffect(() => {
    fetchReviews()
  }, [packId])

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/packs/${packId}/reviews`)
      const data = await response.json()
      if (data.success) {
        setReviews(data.reviews)
      }
    } catch (error) {
      console.error("Error fetching reviews:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Error",
        description: "Debes seleccionar una calificación",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const method = userReview ? "PUT" : "POST"
      const response = await fetch(`/api/packs/${packId}/reviews`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: userReview ? "Review actualizada" : "Review publicada",
          description: "Gracias por tu opinión",
        })
        setUserReview(data.review)
        setIsEditing(false)
        fetchReviews()
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo publicar la review",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de eliminar tu review?")) return

    try {
      const response = await fetch(`/api/packs/${packId}/reviews`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Review eliminada",
        })
        setUserReview(undefined)
        setRating(0)
        setComment("")
        fetchReviews()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la review",
        variant: "destructive",
      })
    }
  }

  const renderStars = (value: number, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${interactive ? "cursor-pointer" : ""} transition-all ${
              star <= (interactive ? hoverRating || rating : value)
                ? "fill-yellow-500 text-yellow-500"
                : "text-muted-foreground"
            }`}
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-foreground">Reviews</h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
            <span className="text-lg font-bold text-foreground">
              {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">({reviews.length})</span>
          </div>
        )}
      </div>

      {canReview && (!userReview || isEditing) && (
        <Card className="p-6 rounded-2xl border-border">
          <h3 className="text-lg font-bold text-foreground mb-4">
            {userReview ? "Editar tu review" : "Dejá tu review"}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Calificación</label>
              {renderStars(rating, true)}
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Comentario (opcional)</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Contanos tu experiencia con este pack..."
                className="min-h-[100px]"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={isSubmitting} className="rounded-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Publicando...
                  </>
                ) : userReview ? (
                  "Actualizar Review"
                ) : (
                  "Publicar Review"
                )}
              </Button>
              {userReview && (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-full">
                    Cancelar
                  </Button>
                  <Button variant="destructive" onClick={handleDelete} className="rounded-full">
                    Eliminar
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      )}

      {userReview && !isEditing && (
        <Card className="p-6 rounded-2xl border-border bg-accent/50">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                Tu
              </div>
              <div>
                <div className="font-bold text-foreground">Tu review</div>
                {renderStars(userReview.rating)}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="rounded-full">
              Editar
            </Button>
          </div>
          {userReview.comment && <p className="text-sm text-muted-foreground leading-relaxed">{userReview.comment}</p>}
        </Card>
      )}

      <div className="space-y-4">
        {reviews
          .filter((review) => review.user.id !== userReview?.user.id)
          .map((review) => (
            <Card key={review.id} className="p-6 rounded-2xl border-border">
              <div className="flex items-start gap-3">
                {review.user.avatar_url ? (
                  <img
                    src={review.user.avatar_url || "/placeholder.svg"}
                    alt={review.user.username}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
                    {review.user.username[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-bold text-foreground">{review.user.username}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString("es-AR")}
                      </div>
                    </div>
                    {renderStars(review.rating)}
                  </div>
                  {review.comment && <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>}
                </div>
              </div>
            </Card>
          ))}
      </div>

      {reviews.length === 0 && !canReview && (
        <Card className="p-8 rounded-2xl border-border text-center">
          <p className="text-muted-foreground">No hay reviews todavía. Sé el primero en descargar y opinar.</p>
        </Card>
      )}
    </div>
  )
}
