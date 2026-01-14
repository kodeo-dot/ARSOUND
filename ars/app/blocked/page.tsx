"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AlertCircle, ShieldAlert, LogOut, Send, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface BlockInfo {
  blocked_reason: string | null
  blocked_at: string | null
}

export default function BlockedPage() {
  const [loading, setLoading] = useState(true)
  const [blockInfo, setBlockInfo] = useState<BlockInfo | null>(null)
  const [appealMessage, setAppealMessage] = useState("")
  const [submittingAppeal, setSubmittingAppeal] = useState(false)
  const [appealSubmitted, setAppealSubmitted] = useState(false)
  const router = useRouter()
  const supabase = createBrowserClient()

  useEffect(() => {
    checkBlockStatus()
  }, [])

  async function checkBlockStatus() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("is_blocked, blocked_reason, blocked_at")
        .eq("id", user.id)
        .single()

      if (error) {
        console.error("Error checking block status:", error)
        setLoading(false)
        return
      }

      if (!profile?.is_blocked) {
        // User is not blocked, redirect to home
        router.push("/")
        return
      }

      setBlockInfo({
        blocked_reason: profile.blocked_reason,
        blocked_at: profile.blocked_at,
      })
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  async function handleAppealSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!appealMessage.trim()) {
      toast({
        title: "Mensaje requerido",
        description: "Por favor escribí tu apelación",
        variant: "destructive",
      })
      return
    }

    setSubmittingAppeal(true)

    try {
      const response = await fetch("/api/appeal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: appealMessage,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setAppealSubmitted(true)
        toast({
          title: "Apelación enviada",
          description: "Tu solicitud será revisada por el equipo de ARSOUND",
        })
        setAppealMessage("")
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo enviar la apelación",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error submitting appeal:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al enviar la apelación",
        variant: "destructive",
      })
    } finally {
      setSubmittingAppeal(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Fecha desconocida"
    return new Date(dateString).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <Card className="p-8 md:p-12 rounded-3xl border-2 border-destructive/20 bg-destructive/5">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground mb-3">Cuenta Bloqueada</h1>
            <p className="text-muted-foreground text-lg">Tu cuenta ha sido suspendida temporalmente</p>
          </div>

          <div className="space-y-6 mb-8">
            <Card className="p-6 bg-background border-border">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="h-5 w-5 text-destructive mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-foreground mb-2">Motivo del bloqueo:</h3>
                  <p className="text-muted-foreground">
                    {blockInfo?.blocked_reason || "Violación de las políticas de la plataforma"}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Fecha del bloqueo:</span>{" "}
                  {formatDate(blockInfo?.blocked_at || null)}
                </p>
              </div>
            </Card>

            <Card className="p-6 bg-background border-border">
              <h3 className="font-bold text-foreground mb-3">Restricciones aplicadas:</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-destructive flex-shrink-0" />
                  No puedes subir packs
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-destructive flex-shrink-0" />
                  No puedes navegar la plataforma
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-destructive flex-shrink-0" />
                  No puedes acceder a tu perfil
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-destructive flex-shrink-0" />
                  No puedes realizar compras
                </li>
              </ul>
            </Card>
          </div>

          {!appealSubmitted ? (
            <form onSubmit={handleAppealSubmit} className="space-y-4 mb-6">
              <div className="space-y-3">
                <Label htmlFor="appeal" className="text-base font-bold text-foreground">
                  Solicitar revisión del bloqueo
                </Label>
                <Textarea
                  id="appeal"
                  placeholder="Explicá por qué considerás que el bloqueo no corresponde y solicitá una revisión de tu caso..."
                  value={appealMessage}
                  onChange={(e) => setAppealMessage(e.target.value)}
                  className="min-h-32 text-base rounded-xl bg-background border-border resize-none"
                  disabled={submittingAppeal}
                />
              </div>
              <Button
                type="submit"
                disabled={submittingAppeal || !appealMessage.trim()}
                className="w-full h-12 rounded-xl gap-2 text-base"
              >
                {submittingAppeal ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Enviar apelación
                  </>
                )}
              </Button>
            </form>
          ) : (
            <Card className="p-6 bg-primary/5 border-primary/20 mb-6">
              <p className="text-foreground text-center font-semibold">
                ✓ Tu apelación fue enviada. El equipo de ARSOUND la revisará en breve.
              </p>
            </Card>
          )}

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full h-12 rounded-xl gap-2 text-base border-2 bg-transparent"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Si tenés preguntas, contactanos en{" "}
              <a href="mailto:soprte@arsound.com.ar" className="text-primary hover:underline font-semibold">
                soprte@arsound.com.ar
              </a>
            </p>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  )
}
