"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MessageCircle, Loader2, Send, Reply, Trash2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { createBrowserClient } from "@/lib/supabase/client"

interface Comment {
  id: string
  comment: string
  created_at: string
  updated_at: string
  parent_id: string | null
  user: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
  replies: Comment[]
}

interface PackCommentsProps {
  packId: string
  packOwnerId: string
  isAuthenticated: boolean
  currentUserId?: string
}

export function PackComments({ packId, packOwnerId, isAuthenticated, currentUserId }: PackCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const supabase = createBrowserClient()

  useEffect(() => {
    fetchComments()
  }, [packId])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/packs/${packId}/comments`)
      const data = await response.json()
      if (data.success) {
        setComments(data.comments)
      }
    } catch (error) {
      console.error("Error fetching comments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      toast({
        title: "Error",
        description: "El comentario no puede estar vacío",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/packs/${packId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: newComment }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Comentario publicado",
        })
        setNewComment("")
        fetchComments()
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
        description: "No se pudo publicar el comentario",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!replyText.trim()) {
      toast({
        title: "Error",
        description: "La respuesta no puede estar vacía",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/packs/${packId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: replyText, parentId }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Respuesta publicada",
        })
        setReplyText("")
        setReplyingTo(null)
        fetchComments()
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
        description: "No se pudo publicar la respuesta",
        variant: "destructive",
      })
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("¿Estás seguro de eliminar este comentario?")) return

    try {
      const response = await fetch(`/api/packs/${packId}/comments?commentId=${commentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Comentario eliminado",
        })
        fetchComments()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el comentario",
        variant: "destructive",
      })
    }
  }

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? "ml-12 mt-4" : ""}`}>
      <Card className={`p-5 rounded-2xl border-border ${isReply ? "bg-muted/30" : "bg-card"}`}>
        <div className="flex items-start gap-4">
          {comment.user.avatar_url ? (
            <img
              src={comment.user.avatar_url || "/placeholder.svg"}
              alt={comment.user.username}
              className="h-11 w-11 rounded-xl object-cover flex-shrink-0"
            />
          ) : (
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {comment.user.username[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <div className="font-black text-foreground text-sm">{comment.user.username}</div>
              {comment.user.id === packOwnerId && (
                <span className="text-xs bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full font-bold">
                  Creador
                </span>
              )}
              <div className="text-xs text-muted-foreground">
                {new Date(comment.created_at).toLocaleDateString("es-AR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words mb-3">
              {comment.comment}
            </p>

            <div className="flex items-center gap-2">
              {isAuthenticated && !isReply && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setReplyingTo(comment.id)}
                  className="h-8 text-xs gap-1.5 px-3 rounded-xl hover:bg-primary/10"
                >
                  <Reply className="h-3.5 w-3.5" />
                  Responder
                </Button>
              )}
              {currentUserId === comment.user.id && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteComment(comment.id)}
                  className="h-8 text-xs gap-1.5 px-3 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar
                </Button>
              )}
            </div>
          </div>
        </div>

        {replyingTo === comment.id && (
          <div className="ml-15 mt-4 space-y-3">
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Escribí tu respuesta..."
              className="min-h-[100px] text-sm rounded-xl resize-none"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleSubmitReply(comment.id)}
                className="rounded-xl h-9 text-xs gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                Responder
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setReplyingTo(null)
                  setReplyText("")
                }}
                className="rounded-xl h-9 text-xs"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Render replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-4 mt-4">{comment.replies.map((reply) => renderComment(reply, true))}</div>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
          <MessageCircle className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-foreground">Comentarios</h2>
          <p className="text-sm text-muted-foreground">
            {comments.length === 0
              ? "No hay comentarios todavía"
              : `${comments.length} ${comments.length === 1 ? "comentario" : "comentarios"}`}
          </p>
        </div>
      </div>

      {isAuthenticated && (
        <Card className="p-6 rounded-2xl border-border bg-card">
          <div className="space-y-4">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Dejá tu comentario sobre este pack..."
              className="min-h-[120px] resize-none rounded-xl"
            />
            <Button onClick={handleSubmitComment} disabled={isSubmitting} className="rounded-xl gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publicando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Publicar Comentario
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-4">{comments.map((comment) => renderComment(comment))}</div>

      {comments.length === 0 && (
        <Card className="p-12 rounded-2xl border-border border-dashed text-center bg-muted/20">
          <div className="inline-flex items-center justify-center p-4 bg-muted rounded-2xl mb-4">
            <MessageCircle className="h-10 w-10 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">
            {isAuthenticated ? "Sé el primero en comentar este pack" : "Iniciá sesión para dejar un comentario"}
          </p>
        </Card>
      )}
    </div>
  )
}
