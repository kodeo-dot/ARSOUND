"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createBrowserClient } from "@/lib/supabase/client"
import { Search, Trash2, Loader2, Eye } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const supabase = createBrowserClient()

  useEffect(() => {
    fetchComments()
  }, [])

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("pack_comments")
        .select(
          `
          *,
          profiles (
            username,
            avatar_url
          ),
          packs (
            title
          )
        `,
        )
        .order("created_at", { ascending: false })
        .limit(100)

      if (error) throw error
      console.log("[v0] Fetched comments:", data)
      setComments(data || [])
    } catch (error) {
      console.error("Error fetching comments:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los comentarios",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    setDeletingId(commentId)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("No authenticated")

      const { error } = await supabase.from("pack_comments").delete().eq("id", commentId)

      if (error) throw error

      await supabase.from("admin_actions").insert({
        admin_id: user.id,
        action_type: "delete_comment",
        target_type: "comment",
        target_id: commentId,
        details: { reason: "Deleted from admin panel" },
      })

      setComments(comments.filter((c) => c.id !== commentId))

      toast({
        title: "Comentario eliminado",
        description: "El comentario se eliminó correctamente",
      })
    } catch (error) {
      console.error("Error deleting comment:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el comentario",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const filteredComments = comments.filter(
    (comment) =>
      comment.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comment.profiles?.username.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black text-foreground mb-2">Gestión de Comentarios</h1>
        <p className="text-lg text-muted-foreground">Moderá los comentarios de la plataforma</p>
      </div>

      <Card className="p-6 rounded-2xl border-border">
        <div className="flex items-center gap-3 mb-6">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por contenido o usuario..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 h-12 rounded-xl bg-background border-border"
          />
        </div>

        <div className="space-y-3">
          {filteredComments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No se encontraron comentarios</p>
            </div>
          ) : (
            filteredComments.map((comment) => (
              <Card key={comment.id} className="p-4 rounded-xl border-border">
                <div className="flex items-start gap-4">
                  <img
                    src={comment.profiles?.avatar_url || "/placeholder.svg"}
                    alt={comment.profiles?.username}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground text-sm">@{comment.profiles?.username}</span>
                      <span className="text-xs text-muted-foreground">
                        en {comment.packs?.title || "Pack eliminado"}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{comment.comment}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {comment.pack_id && (
                      <Link href={`/pack/${comment.pack_id}`} target="_blank">
                        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                          <Eye className="h-4 w-4" />
                          Ver
                        </Button>
                      </Link>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="gap-2" disabled={deletingId === comment.id}>
                          {deletingId === comment.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Eliminar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Eliminar Comentario</AlertDialogTitle>
                          <AlertDialogDescription>
                            Estás seguro de que querés eliminar este comentario? Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteComment(comment.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
