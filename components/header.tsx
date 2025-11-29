"use client"

import { Waves, Menu, Upload, LogOut } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from 'next/navigation'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user)
      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("avatar_url, username, display_name")
          .eq("id", user.id)
          .single()
        setProfile(profileData)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("avatar_url, username, display_name")
          .eq("id", session.user.id)
          .single()
        setProfile(profileData)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    if (profile?.username) return profile.username.slice(0, 2).toUpperCase()
    if (user?.email) return user.email.slice(0, 2).toUpperCase()
    return "U"
  }

  return (
    <header className="border-b border-border bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Waves className="h-6 w-6 text-foreground" strokeWidth={2} />
            <span className="text-xl font-bold tracking-tight text-foreground">ARSOUND</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            <Link href="/" className="text-sm font-medium px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md">
              Inicio
            </Link>
            <Link href="/#packs" className="text-sm font-medium px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md">
              Explorar
            </Link>
            <Link href="/producers" className="text-sm font-medium px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md">
              Productores
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            {user && (
              <Link href="/upload" className="hidden sm:block">
                <Button
                  variant="outline"
                  className="gap-2 h-9 px-4 bg-transparent border-2 border-foreground/20 hover:bg-accent hover:border-foreground/30 text-foreground"
                >
                  <Upload className="h-4 w-4" />
                  Subir pack
                </Button>
              </Link>
            )}

            {user ? (
              <>
                <Link href="/profile" className="hidden lg:flex">
                  <Avatar className="h-9 w-9 cursor-pointer">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar>
                </Link>

                <Button
                  variant="ghost"
                  className="p-2 hover:bg-accent"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5 text-foreground" />
                </Button>
              </>
            ) : (
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" className="text-foreground">
                  Iniciar sesión
                </Button>
              </Link>
            )}

            <Button
              variant="ghost"
              className="lg:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-background px-4 py-3 space-y-2">
          <Link href="/" className="block text-sm py-2 text-muted-foreground hover:text-foreground">Inicio</Link>
          <Link href="/#packs" className="block text-sm py-2 text-muted-foreground hover:text-foreground">Explorar</Link>
          <Link href="/producers" className="block text-sm py-2 text-muted-foreground hover:text-foreground">Productores</Link>

          {user && (
            <Link href="/upload" className="block">
              <Button
                variant="outline"
                className="w-full gap-2 bg-transparent border-2 border-foreground/20 hover:bg-accent hover:border-foreground/30 text-foreground"
              >
                <Upload className="h-4 w-4" />
                Subir pack
              </Button>
            </Link>
          )}

          {user ? (
            <>
              <Link href="/profile" className="flex items-center gap-2 py-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-foreground">{profile?.display_name || profile?.username || 'Mi Perfil'}</span>
              </Link>
              <Button
                variant="ghost"
                className="w-full flex items-center gap-2 justify-start"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                Cerrar sesión
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button variant="ghost" className="w-full">Iniciar sesión</Button>
            </Link>
          )}
        </div>
      )}
    </header>
  )
}
