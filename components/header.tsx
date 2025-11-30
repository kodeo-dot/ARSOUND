"use client"

import Image from "next/image"
import { Menu, Upload, LogOut, BarChart3, Heart, ShoppingBag, Settings, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { UserAvatar } from "@/components/user-avatar"

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
          .select("username, avatar_url, display_name")
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
          .select("username, avatar_url, display_name")
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

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/icon.svg" alt="ARSOUND" width={36} height={36} className="rounded-lg object-contain" />
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-foreground">ARSOUND</span>
              <span className="text-[9px] font-semibold text-muted-foreground -mt-0.5">ARGENTINA</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Inicio
            </Link>
            <Link
              href="/#packs"
              className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Explorar
            </Link>
            <Link
              href="/producers"
              className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Productores
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {user && (
              <Link href="/upload" className="hidden sm:block">
                <Button
                  variant="outline"
                  className="gap-2 rounded-xl h-10 px-4 bg-transparent border-2 border-muted-foreground/30 text-foreground hover:border-primary hover:bg-primary/5 hover:text-foreground transition-all"
                >
                  <Upload className="h-4 w-4" />
                  <span className="font-semibold">Subir Pack</span>
                </Button>
              </Link>
            )}
            {user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="hidden lg:flex focus:outline-none focus:ring-2 focus:ring-primary rounded-full transition-all hover:ring-2 hover:ring-primary/50">
                      <UserAvatar
                        avatarUrl={profile?.avatar_url}
                        username={profile?.username}
                        displayName={profile?.display_name}
                        size="md"
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2">
                    <DropdownMenuLabel className="p-3">
                      <Link href="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <UserAvatar
                          avatarUrl={profile?.avatar_url}
                          username={profile?.username}
                          displayName={profile?.display_name}
                          size="md"
                        />
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">
                            {profile?.display_name || profile?.username || "Usuario"}
                          </span>
                          <span className="text-xs text-muted-foreground">Ver mi perfil</span>
                        </div>
                      </Link>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/statistics" className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        <span className="font-medium">Estadísticas</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/saved" className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer">
                        <Heart className="h-4 w-4 text-red-500" />
                        <span className="font-medium">Guardados</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/purchases" className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer">
                        <ShoppingBag className="h-4 w-4 text-secondary" />
                        <span className="font-medium">Mis compras</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer">
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Configuración</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        href="/plans"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-primary"
                      >
                        <Zap className="h-4 w-4" />
                        <span className="font-semibold">Mejorar plan</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-destructive focus:text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="font-medium">Cerrar sesión</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link href="/login" className="hidden lg:block">
                <Button className="rounded-xl h-10 px-6 font-semibold">Ingresar</Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden rounded-xl h-10 w-10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden py-4 space-y-3 border-t border-border">
            <nav className="flex flex-col gap-1">
              <Link
                href="/"
                className="text-sm font-semibold text-foreground hover:text-primary py-2.5 px-3 rounded-xl hover:bg-accent transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Inicio
              </Link>
              <Link
                href="/#packs"
                className="text-sm font-semibold text-foreground hover:text-primary py-2.5 px-3 rounded-xl hover:bg-accent transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Explorar
              </Link>
              <Link
                href="/producers"
                className="text-sm font-semibold text-foreground hover:text-primary py-2.5 px-3 rounded-xl hover:bg-accent transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Productores
              </Link>
            </nav>
            {user ? (
              <>
                <div className="pt-2 border-t border-border">
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors mb-2">
                      <UserAvatar
                        avatarUrl={profile?.avatar_url}
                        username={profile?.username}
                        displayName={profile?.display_name}
                        size="md"
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground text-sm">
                          {profile?.display_name || profile?.username || "Usuario"}
                        </span>
                        <span className="text-xs text-muted-foreground">Ver mi perfil</span>
                      </div>
                    </div>
                  </Link>
                </div>
                <Link href="/upload" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full gap-2 rounded-xl h-11 font-semibold bg-transparent justify-start"
                  >
                    <Upload className="h-4 w-4" />
                    Subir Pack
                  </Button>
                </Link>
                <Link href="/statistics" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full gap-2 rounded-xl h-11 font-semibold bg-transparent justify-start"
                  >
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Estadísticas
                  </Button>
                </Link>
                <Link href="/saved" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full gap-2 rounded-xl h-11 font-semibold bg-transparent justify-start"
                  >
                    <Heart className="h-4 w-4 text-red-500" />
                    Guardados
                  </Button>
                </Link>
                <Link href="/purchases" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full gap-2 rounded-xl h-11 font-semibold bg-transparent justify-start"
                  >
                    <ShoppingBag className="h-4 w-4 text-secondary" />
                    Mis compras
                  </Button>
                </Link>
                <Link href="/settings" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full gap-2 rounded-xl h-11 font-semibold bg-transparent justify-start"
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    Configuración
                  </Button>
                </Link>
                <Link href="/plans" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full gap-2 rounded-xl h-11 font-semibold bg-transparent justify-start text-primary border-primary/30 hover:bg-primary/5"
                  >
                    <Zap className="h-4 w-4" />
                    Mejorar plan
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="w-full gap-2 rounded-xl h-11 font-semibold text-destructive border-destructive/30 hover:bg-destructive/10 bg-transparent justify-start"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar Sesión
                </Button>
              </>
            ) : (
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full rounded-xl h-11 font-semibold">Ingresar</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
