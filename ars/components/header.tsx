"use client"

import Image from "next/image"
import { Menu, Upload, LogOut, BarChart3, Heart, ShoppingBag, Settings, Zap, X } from "lucide-react"
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
import { useAuth } from "@/components/auth-provider"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { SearchBar } from "@/components/search-bar"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, loading, signOut } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      setProfile(null)
      return
    }

    const loadProfile = async () => {
      try {
        const supabase = createClient()
        const { data: profileData } = await supabase
          .from("profiles")
          .select("username, avatar_url, display_name")
          .eq("id", user.id)
          .single()
        setProfile(profileData)
      } catch (error) {
        console.error("[ARSOUND] Error loading profile:", error)
      }
    }

    loadProfile()
  }, [user])

  const handleLogout = async () => {
    await signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Image src="/icon.svg" alt="ARSOUND" width={32} height={32} className="rounded object-contain" />
            <span className="text-lg font-black tracking-tight text-foreground">ARSOUND</span>
          </Link>

          <div className="hidden md:flex flex-1 max-w-2xl">
            <SearchBar />
          </div>

          <nav className="hidden lg:flex items-center gap-8 flex-shrink-0">
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
              Creadores
            </Link>
          </nav>

          <div className="flex items-center gap-3 flex-shrink-0">
            {loading ? (
              <div className="w-20 h-9 bg-muted/50 animate-pulse rounded-full" />
            ) : user ? (
              <>
                <NotificationsDropdown />
                <Link href="/upload" className="hidden sm:block">
                  <Button variant="outline" size="sm" className="gap-2 rounded-full font-semibold bg-transparent">
                    <Upload className="h-4 w-4" />
                    Subir
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="hidden md:flex focus:outline-none focus:ring-2 focus:ring-foreground rounded-full transition-all">
                      <UserAvatar
                        avatarUrl={profile?.avatar_url}
                        username={profile?.username}
                        displayName={profile?.display_name}
                        size="sm"
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <Link href="/profile" className="flex items-center gap-3">
                        <UserAvatar
                          avatarUrl={profile?.avatar_url}
                          username={profile?.username}
                          displayName={profile?.display_name}
                          size="sm"
                        />
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">
                            {profile?.display_name || profile?.username || "Usuario"}
                          </span>
                          <span className="text-xs text-muted-foreground">Ver perfil</span>
                        </div>
                      </Link>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/statistics" className="flex items-center gap-2 cursor-pointer">
                        <BarChart3 className="h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/saved" className="flex items-center gap-2 cursor-pointer">
                        <Heart className="h-4 w-4" />
                        Guardados
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/purchases" className="flex items-center gap-2 cursor-pointer">
                        <ShoppingBag className="h-4 w-4" />
                        Mis compras
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                        <Settings className="h-4 w-4" />
                        Configuración
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/plans" className="flex items-center gap-2 cursor-pointer">
                        <Zap className="h-4 w-4" />
                        Mejorar plan
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="flex items-center gap-2 cursor-pointer text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link href="/login" className="hidden md:block">
                <Button size="sm" className="rounded-full font-semibold">
                  Ingresar
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <div className="md:hidden pb-3">
          <SearchBar />
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-border">
            <Link
              href="/#packs"
              className="block text-sm font-semibold text-foreground py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Explorar
            </Link>
            <Link
              href="/producers"
              className="block text-sm font-semibold text-foreground py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Creadores
            </Link>
            {user ? (
              <>
                <NotificationsDropdown />
                <div className="pt-2 border-t border-border space-y-2">
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                    <div className="flex items-center gap-3 py-2">
                      <UserAvatar
                        avatarUrl={profile?.avatar_url}
                        username={profile?.username}
                        displayName={profile?.display_name}
                        size="sm"
                      />
                      <span className="font-semibold text-sm">
                        {profile?.display_name || profile?.username || "Usuario"}
                      </span>
                    </div>
                  </Link>
                  <Link href="/upload" onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 rounded-full justify-start bg-transparent"
                    >
                      <Upload className="h-4 w-4" />
                      Subir Pack
                    </Button>
                  </Link>
                  <Link href="/statistics" onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 rounded-full justify-start bg-transparent"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link href="/saved" onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 rounded-full justify-start bg-transparent"
                    >
                      <Heart className="h-4 w-4" />
                      Guardados
                    </Button>
                  </Link>
                  <Link href="/purchases" onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 rounded-full justify-start bg-transparent"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      Mis Compras
                    </Button>
                  </Link>
                  <Link href="/settings" onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 rounded-full justify-start bg-transparent"
                    >
                      <Settings className="h-4 w-4" />
                      Configuración
                    </Button>
                  </Link>
                  <Link href="/plans" onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 rounded-full justify-start bg-transparent"
                    >
                      <Zap className="h-4 w-4" />
                      Mejorar Plan
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 rounded-full text-destructive justify-start bg-transparent"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar Sesión
                  </Button>
                </div>
              </>
            ) : (
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" className="w-full rounded-full font-semibold">
                  Ingresar
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
