"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createBrowserClient } from "@/lib/supabase/client"
import { Search, Trash2, Eye, Loader2 } from "lucide-react"
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

export default function AdminPacksPage() {
  const [packs, setPacks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const supabase = createBrowserClient()

  useEffect(() => {
    fetchPacks()
  }, [])

  const fetchPacks = async () => {
    try {
      const { data, error } = await supabase
        .from("packs")
        .select(
          `
          *,
          profiles (
            username,
            avatar_url
          )
        `,
        )
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error
      setPacks(data || [])
    } catch (error) {
      console.error("Error fetching packs:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los packs",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePack = async (packId: string) => {
    setDeletingId(packId)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("No authenticated")

      const { error } = await supabase.from("packs").delete().eq("id", packId)

      if (error) throw error

      await supabase.from("admin_actions").insert({
        admin_id: user.id,
        action_type: "delete_pack",
        target_type: "pack",
        target_id: packId,
        details: { reason: "Deleted from admin panel" },
      })

      setPacks(packs.filter((p) => p.id !== packId))

      toast({
        title: "Pack eliminado",
        description: "El pack se eliminó correctamente",
      })
    } catch (error) {
      console.error("Error deleting pack:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el pack",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const filteredPacks = packs.filter(
    (pack) =>
      pack.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pack.profiles?.username.toLowerCase().includes(searchQuery.toLowerCase()),
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
        <h1 className="text-4xl font-black text-foreground mb-2">Gestión de Packs</h1>
        <p className="text-lg text-muted-foreground">Administrá todos los packs de la plataforma</p>
      </div>

      <Card className="p-6 rounded-2xl border-border">
        <div className="flex items-center gap-3 mb-6">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por título o creador..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 h-12 rounded-xl bg-background border-border"
          />
        </div>

        <div className="space-y-3">
          {filteredPacks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No se encontraron packs</p>
            </div>
          ) : (
            filteredPacks.map((pack) => (
              <Card key={pack.id} className="p-4 rounded-xl border-border">
                <div className="flex items-center gap-4">
                  <img
                    src={pack.cover_image_url || "/placeholder.svg"}
                    alt={pack.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground truncate">{pack.title}</h3>
                    <p className="text-sm text-muted-foreground">por @{pack.profiles?.username}</p>
                    <p className="text-xs text-muted-foreground">{pack.genre}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/pack/${pack.id}`} target="_blank">
                      <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                        <Eye className="h-4 w-4" />
                        Ver
                      </Button>
                    </Link>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="gap-2" disabled={deletingId === pack.id}>
                          {deletingId === pack.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Eliminar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Eliminar Pack</AlertDialogTitle>
                          <AlertDialogDescription>
                            Estás seguro de que querés eliminar "{pack.title}"? Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeletePack(pack.id)}
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
