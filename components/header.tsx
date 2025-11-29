"use client"

import { Waves, Menu, Upload, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // Obtener usuario
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user)

      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("avatar_url, display_name, username")
          .eq("id", user.id)
          .single()

        setProfile(profileData)
      }
    })

    // Subscripción a cambios en sesión
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("avatar_url, display_name, username")
          .eq("id", session.user.id)
          .single()

        setProfile(profileData)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Obtener iniciales para fallback
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

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative">
              <Waves className="h-9 w-9 text-primary" strokeWidth={2.5} />
              <div className="absolute inset-0 bg-primary/20 blur-xl" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-foreground">ARSOUND</span>
              <span className="text-[10px] font-medium text-muted-foreground -mt-1">ARGENTINA</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            <Link href="/" className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
              Inicio
            </Link>
            <Link href="/#packs" className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
              Explorar
            </Link>
            <Link
              href="/producers"
              className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
            >
              Productores
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {user && (
              <Link href="/upload" className="hidden sm:block">
                <Button
                  className="gap-2 rounded-lg h-11 px-4 bg-transparent border border-neutral-700 text-foreground hover:bg-neutral-900/20"
                >
                  <Upload className="h-4 w-4" />
                  Subir Pack
                </Button>
              </Link>
            )}

            {user ? (
              <>
                {/* Avatar con imagen o iniciales */}
                <Link href="/profile" className="hidden lg:block">
                  <Avatar className="h-11 w-11 cursor-pointer">
                    <AvatarImage src={profile?.avatar_url || ""} alt="Profile" />
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar>
                </Link>

                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden lg:block rounded-full h-11 w-11"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <Link href="/login" className="hidden lg:block">
                <Button className="rounded-full h-11 px-6">Ingresar</Button>
              </Link>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden rounded-full h-11 w-11"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* MOBILE MENU (sin cambios importantes) */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-6 space-y-4 border-t border-border">
            <nav className="flex flex-col gap-1">
              <Link
                href="/"
                className="text-sm font-semibold text-foreground hover:text-primary py-3 px-4 rounded-lg hover:bg-accent"
                onClick={() => setMobileMenuOpen(false)}
              >
                Inicio
              </Link>

              <Link
                href="/#packs"
                className="text-sm font-semibold text-foreground hover:text-primary py-3 px-4 rounded-lg hover:bg-accent"
                onClick={() => setMobileMenuOpen(false)}
              >
                Explorar
              </Link>

              <Link
                href="/producers"
                className="text-sm font-semibold text-foreground hover:text-primary py-3 px-4 rounded-lg hover:bg-accent"
                onClick={() => setMobileMenuOpen(false)}
              >
                Productores
              </Link>
            </nav>

            {user ? (
              <>
                <Link href="/upload" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full gap-2 rounded-lg bg-transparent border border-neutral-700 text-foreground hover:bg-neutral-900/20">
                    <Upload className="h-4 w-4" />
                    Subir Pack
                  </Button>
                </Link>

                <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full gap-2 rounded-full bg-transparent" variant="outline">
                    Mi Perfil
                  </Button>
                </Link>

                <Button
                  className="w-full gap-2 rounded-full bg-transparent"
                  variant="outline"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar Sesión
                </Button>
              </>
            ) : (
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full rounded-full">Ingresar</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
export function getInitials(name?: string | null) {
  if (!name) return "??";
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

