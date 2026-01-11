"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { createBrowserClient } from "@/lib/supabase/client"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function AdminAppealsPage() {
  const [appeals, setAppeals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [selectedAppeal, setSelectedAppeal] = useState<any>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const supabase = createBrowserClient()

  useEffect(() => {
    fetchAppeals()
  }, [])

  const fetchAppeals = async () => {
    try {
      const { data, error } = await supabase
        .from("appeals")
        .select(
          `
          *,
          profiles (
            username,
            avatar_url,
            blocked_reason
          )
        `,
        )
        .order("created_at", { ascending: false })

      if (error) throw error
      setAppeals(data || [])
    } catch (error) {
      console.error("Error fetching appeals:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las apelaciones",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApproveAppeal = async () => {
    if (!selectedAppeal) return

    setProcessing(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("No authenticated")

      await supabase
        .from("appeals")
        .update({
          status: "approved",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes,
        })
        .eq("id", selectedAppeal.id)

      await supabase
        .from("profiles")
        .update({
          is_blocked: false,
          blocked_reason: null,
          blocked_at: null,
        })
        .eq("id", selectedAppeal.user_id)

      await supabase.from("admin_actions").insert({
        admin_id: user.id,
        action_type: "approve_appeal",
        target_type: "appeal",
        target_id: selectedAppeal.id,
        details: { notes: adminNotes },
      })

      setAppeals(
        appeals.map((a) =>
          a.id === selectedAppeal.id
            ? {
                ...a,
                status: "approved",
                reviewed_by: user.id,
                reviewed_at: new Date().toISOString(),
                admin_notes: adminNotes,
              }
            : a,
        ),
      )

      toast({
        title: "Apelación aprobada",
        description: "El usuario ha sido desbloqueado",
      })

      setSelectedAppeal(null)
      setAdminNotes("")
    } catch (error) {
      console.error("Error approving appeal:", error)
      toast({
        title: "Error",
        description: "No se pudo aprobar la apelación",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleRejectAppeal = async () => {
    if (!selectedAppeal) return

    setProcessing(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("No authenticated")

      await supabase
        .from("appeals")
        .update({
          status: "rejected",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes,
        })
        .eq("id", selectedAppeal.id)

      await supabase.from("admin_actions").insert({
        admin_id: user.id,
        action_type: "reject_appeal",
        target_type: "appeal",
        target_id: selectedAppeal.id,
        details: { notes: adminNotes },
      })

      setAppeals(
        appeals.map((a) =>
          a.id === selectedAppeal.id
            ? {
                ...a,
                status: "rejected",
                reviewed_by: user.id,
                reviewed_at: new Date().toISOString(),
                admin_notes: adminNotes,
              }
            : a,
        ),
      )

      toast({
        title: "Apelación rechazada",
        description: "La apelación ha sido rechazada",
      })

      setSelectedAppeal(null)
      setAdminNotes("")
    } catch (error) {
      console.error("Error rejecting appeal:", error)
      toast({
        title: "Error",
        description: "No se pudo rechazar la apelación",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

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
        <h1 className="text-4xl font-black text-foreground mb-2">Gestión de Apelaciones</h1>
        <p className="text-lg text-muted-foreground">Revisá las apelaciones de usuarios bloqueados</p>
      </div>

      <div className="space-y-3">
        {appeals.length === 0 ? (
          <Card className="p-12 rounded-2xl border-border text-center">
            <p className="text-muted-foreground">No hay apelaciones pendientes</p>
          </Card>
        ) : (
          appeals.map((appeal) => (
            <Card key={appeal.id} className="p-6 rounded-2xl border-border">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={appeal.profiles?.avatar_url || "/placeholder.svg"}
                      alt={appeal.profiles?.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-foreground">@{appeal.profiles?.username}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(appeal.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      appeal.status === "pending"
                        ? "secondary"
                        : appeal.status === "approved"
                          ? "default"
                          : "destructive"
                    }
                  >
                    {appeal.status === "pending"
                      ? "Pendiente"
                      : appeal.status === "approved"
                        ? "Aprobada"
                        : "Rechazada"}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div>
                    <Label className="text-sm font-semibold text-foreground">Razón del bloqueo:</Label>
                    <p className="text-sm text-muted-foreground">{appeal.profiles?.blocked_reason || "N/A"}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-foreground">Mensaje del usuario:</Label>
                    <p className="text-sm text-foreground">{appeal.message}</p>
                  </div>

                  {appeal.admin_notes && (
                    <div>
                      <Label className="text-sm font-semibold text-foreground">Notas del admin:</Label>
                      <p className="text-sm text-muted-foreground">{appeal.admin_notes}</p>
                    </div>
                  )}
                </div>

                {appeal.status === "pending" && (
                  <div className="flex gap-3">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex-1 gap-2 bg-transparent"
                          onClick={() => setSelectedAppeal(appeal)}
                        >
                          <CheckCircle className="h-4 w-4" />
                          Aprobar
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Aprobar Apelación</DialogTitle>
                          <DialogDescription>
                            Estás a punto de aprobar la apelación de @{appeal.profiles?.username} y desbloquear su
                            cuenta.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="notes">Notas (Opcional)</Label>
                            <Textarea
                              id="notes"
                              placeholder="Agregar notas sobre esta decisión..."
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                              className="min-h-24"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedAppeal(null)
                              setAdminNotes("")
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button onClick={handleApproveAppeal} disabled={processing}>
                            {processing ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Procesando...
                              </>
                            ) : (
                              "Aprobar Apelación"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="destructive"
                          className="flex-1 gap-2"
                          onClick={() => setSelectedAppeal(appeal)}
                        >
                          <XCircle className="h-4 w-4" />
                          Rechazar
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Rechazar Apelación</DialogTitle>
                          <DialogDescription>
                            Estás a punto de rechazar la apelación de @{appeal.profiles?.username}. El usuario seguirá
                            bloqueado.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="reject-notes">Razón del rechazo *</Label>
                            <Textarea
                              id="reject-notes"
                              placeholder="Explicar por qué se rechaza la apelación..."
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                              className="min-h-24"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedAppeal(null)
                              setAdminNotes("")
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button variant="destructive" onClick={handleRejectAppeal} disabled={processing}>
                            {processing ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Procesando...
                              </>
                            ) : (
                              "Rechazar Apelación"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
