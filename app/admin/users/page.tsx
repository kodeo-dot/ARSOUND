"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { createBrowserClient } from "@/lib/supabase/client"
import { Search, Ban, CheckCircle, Loader2, Shield } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [banReason, setBanReason] = useState("")
  const [processing, setProcessing] = useState(false)
  const supabase = createBrowserClient()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100)

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBanUser = async () => {
    if (!selectedUser || !banReason.trim()) {
      toast({
        title: "Error",
        description: "Ingresá una razón para el bloqueo",
        variant: "destructive",
      })
      return
    }

    setProcessing(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("No authenticated")

      const { error } = await supabase
        .from("profiles")
        .update({
          is_blocked: true,
          blocked_reason: banReason,
          blocked_at: new Date().toISOString(),
        })
        .eq("id", selectedUser.id)

      if (error) throw error

      await supabase.from("admin_actions").insert({
        admin_id: user.id,
        action_type: "ban_user",
        target_type: "user",
        target_id: selectedUser.id,
        details: { reason: banReason },
      })

      setUsers(
        users.map((u) =>
          u.id === selectedUser.id
            ? { ...u, is_blocked: true, blocked_reason: banReason, blocked_at: new Date().toISOString() }
            : u,
        ),
      )

      toast({
        title: "Usuario bloqueado",
        description: `@${selectedUser.username} fue bloqueado correctamente`,
      })

      setSelectedUser(null)
      setBanReason("")
    } catch (error) {
      console.error("Error banning user:", error)
      toast({
        title: "Error",
        description: "No se pudo bloquear el usuario",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleUnbanUser = async (userId: string, username: string) => {
    setProcessing(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("No authenticated")

      const { error } = await supabase
        .from("profiles")
        .update({
          is_blocked: false,
          blocked_reason: null,
          blocked_at: null,
        })
        .eq("id", userId)

      if (error) throw error

      await supabase.from("admin_actions").insert({
        admin_id: user.id,
        action_type: "unban_user",
        target_type: "user",
        target_id: userId,
        details: { reason: "Unblocked from admin panel" },
      })

      setUsers(users.map((u) => (u.id === userId ? { ...u, is_blocked: false, blocked_reason: null } : u)))

      toast({
        title: "Usuario desbloqueado",
        description: `@${username} fue desbloqueado correctamente`,
      })
    } catch (error) {
      console.error("Error unbanning user:", error)
      toast({
        title: "Error",
        description: "No se pudo desbloquear el usuario",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()),
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
        <h1 className="text-4xl font-black text-foreground mb-2">Gestión de Usuarios</h1>
        <p className="text-lg text-muted-foreground">Administrá usuarios y permisos</p>
      </div>

      <Card className="p-6 rounded-2xl border-border">
        <div className="flex items-center gap-3 mb-6">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por username o nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 h-12 rounded-xl bg-background border-border"
          />
        </div>

        <div className="space-y-3">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No se encontraron usuarios</p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <Card key={user.id} className="p-4 rounded-xl border-border">
                <div className="flex items-center gap-4">
                  <img
                    src={user.avatar_url || "/placeholder.svg"}
                    alt={user.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-foreground">@{user.username}</h3>
                      {user.role === "admin" && (
                        <Badge variant="destructive" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                      {user.role === "moderator" && (
                        <Badge variant="secondary" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Mod
                        </Badge>
                      )}
                      {user.is_blocked && (
                        <Badge variant="destructive" className="text-xs">
                          Bloqueado
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">Plan: {user.plan}</p>
                    {user.is_blocked && user.blocked_reason && (
                      <p className="text-xs text-destructive mt-1">Razón: {user.blocked_reason}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {user.is_blocked ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 bg-transparent"
                        onClick={() => handleUnbanUser(user.id, user.username)}
                        disabled={processing}
                      >
                        {processing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Desbloquear
                          </>
                        )}
                      </Button>
                    ) : (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="gap-2"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Ban className="h-4 w-4" />
                            Bloquear
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Bloquear Usuario</DialogTitle>
                            <DialogDescription>
                              Estás a punto de bloquear a @{selectedUser?.username}. Ingresá una razón para el bloqueo.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="reason">Razón del bloqueo *</Label>
                              <Textarea
                                id="reason"
                                placeholder="Ej: Contenido inapropiado, spam, violación de términos..."
                                value={banReason}
                                onChange={(e) => setBanReason(e.target.value)}
                                className="min-h-24"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedUser(null)
                                setBanReason("")
                              }}
                            >
                              Cancelar
                            </Button>
                            <Button variant="destructive" onClick={handleBanUser} disabled={processing}>
                              {processing ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Bloqueando...
                                </>
                              ) : (
                                "Bloquear Usuario"
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
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
