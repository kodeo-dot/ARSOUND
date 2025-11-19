"use client"

import type React from "react"
import { useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Waves, Mail, Lock, UserIcon } from 'lucide-react'
import Link from "next/link"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [usernameChecking, setUsernameChecking] = useState(false)
  const router = useRouter()
  const profile = null // Assuming profile is not used elsewhere and is null for simplicity
  const isEditing = false // Assuming isEditing is not used elsewhere and is false for simplicity
  const editForm = { username } // Assuming editForm is not used elsewhere and is set to { username } for simplicity

  useEffect(() => {
    if (!isEditing) return

    const checkUsername = async () => {
      const username = editForm.username.trim()

      // Validate format
      if (!username) {
        setUsernameAvailable(null)
        return
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setUsernameAvailable(false)
        return
      }

      if (username.length > 12) {
        setUsernameAvailable(false)
        return
      }

      // If username hasn't changed, it's available
      if (username === profile?.username) {
        setUsernameAvailable(true)
        return
      }

      setUsernameChecking(true)

      try {
        // Fixed query - use maybeSingle() instead of single() to handle no results gracefully
        const { data, error } = await createClient()
          .from("profiles")
          .select("id")
          .eq("username", username.toLowerCase().trim())
          .maybeSingle()

        setUsernameAvailable(!data)
      } catch (error) {
        setUsernameAvailable(true)
      } finally {
        setUsernameChecking(false)
      }
    }

    const timeoutId = setTimeout(checkUsername, 500)
    return () => clearTimeout(timeoutId)
  }, [editForm.username, isEditing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    if (!username || username.trim().length < 3) {
      setError("El nombre de usuario debe tener al menos 3 caracteres")
      return
    }

    const supabase = createClient()
    setIsLoading(true)

    try {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", username.toLowerCase().trim())
        .single()

      if (existingProfile) {
        setError("Nombre de usuario ya en uso")
        setIsLoading(false)
        return
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}`,
          data: {
            username: username.toLowerCase().trim(),
          },
        },
      })

      if (authError) throw authError

      if (authData.user) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          username: username.toLowerCase().trim(),
        })

        if (profileError) {
          // If profile creation fails, the user might already have been created
          // This can happen if they're re-verifying their email
          console.error("Profile creation error:", profileError)
        }
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Error al crear la cuenta")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-12 bg-gradient-to-br from-background via-accent/20 to-background">
          <Card className="w-full max-w-md p-8 space-y-6 border-border rounded-3xl text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Waves className="h-16 w-16 text-primary" strokeWidth={2.5} />
                <div className="absolute inset-0 bg-primary/20 blur-2xl" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-foreground mb-2">Cuenta Creada!</h1>
                <p className="text-sm text-muted-foreground">
                  Revisá tu email para confirmar tu cuenta. Serás redirigido al login en unos segundos...
                </p>
              </div>
            </div>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-12 bg-gradient-to-br from-background via-accent/20 to-background">
        <Card className="w-full max-w-md p-8 space-y-6 border-border rounded-3xl">
          {/* Logo */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Waves className="h-16 w-16 text-primary" strokeWidth={2.5} />
              <div className="absolute inset-0 bg-primary/20 blur-2xl" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-black text-foreground">Crear Cuenta</h1>
              <p className="text-sm text-muted-foreground mt-2">Unite a la comunidad de ARSOUND</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-semibold">
                Nombre de Usuario *
              </Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="tuusuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-11 h-12 rounded-xl"
                  required
                  minLength={3}
                />
              </div>
              <p className="text-xs text-muted-foreground">Mínimo 3 caracteres, sin espacios</p>
              {usernameChecking && <p className="text-xs text-muted-foreground">Verificando nombre de usuario...</p>}
              {usernameAvailable === false && (
                <p className="text-xs text-red-500 font-medium">El nombre de usuario no está disponible</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">
                Email *
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-12 rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">
                Contraseña *
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 h-12 rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold">
                Confirmar Contraseña *
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-11 h-12 rounded-xl"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-500 font-medium">{error}</p>
              </div>
            )}

            <div className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1 rounded" required />
              <span className="text-muted-foreground">
                Acepto los{" "}
                <Link href="/legal/terminos-condiciones" className="text-primary font-semibold hover:underline">
                  Términos y Condiciones
                </Link>{" "}
                y la{" "}
                <Link href="/legal/politica-privacidad" className="text-primary font-semibold hover:underline">
                  Política de Privacidad
                </Link>
              </span>
            </div>

            <Button type="submit" className="w-full h-12 rounded-xl text-base font-bold" disabled={isLoading}>
              {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
            </Button>
          </form>

          {/* Login Link */}
          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tenés cuenta?{" "}
            <Link href="/login" className="text-primary font-bold hover:underline">
              Ingresá
            </Link>
          </p>
        </Card>
      </main>

      <Footer />
    </div>
  )
}
