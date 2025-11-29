  "use client"
  
  import Image from "next/image";

  import { Waves, Search, Menu, Upload, User, LogOut } from "lucide-react"
  import { Button } from "@/components/ui/button"
  import { Input } from "@/components/ui/input"
  import { useState, useEffect } from "react"
  import Link from "next/link"
  import { createClient } from "@/lib/supabase/client"
  import { useRouter } from "next/navigation"

  export function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [user, setUser] = useState<any>(null)
    const router = useRouter()

    useEffect(() => {
      const supabase = createClient()

      supabase.auth.getUser().then(({ data: { user } }) => {
        setUser(user)
      })

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null)
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
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-20 items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="public\apple-icon.png"         // Cambialo por tu logo 
                alt="ARSOUND"
                width={40}
                height={40}
                className="rounded-lg object-contain"
              />

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

            {/* Search Bar - Desktop */}

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
                  <Link href="/profile" className="hidden lg:block">
                    <Button variant="ghost" size="icon" className="rounded-full h-11 w-11">
                      <User className="h-5 w-5" />
                    </Button>
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

          {mobileMenuOpen && (
            <div className="lg:hidden py-6 space-y-4 border-t border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="search" placeholder="Buscar packs..." className="pl-10 bg-accent rounded-full" />
              </div>
              <nav className="flex flex-col gap-1">
                <Link
                  href="/"
                  className="text-sm font-semibold text-foreground hover:text-primary py-3 px-4 rounded-lg hover:bg-accent transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Inicio
                </Link>
                <Link
                  href="/#packs"
                  className="text-sm font-semibold text-foreground hover:text-primary py-3 px-4 rounded-lg hover:bg-accent transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Explorar
                </Link>
                <Link
                  href="/producers"
                  className="text-sm font-semibold text-foreground hover:text-primary py-3 px-4 rounded-lg hover:bg-accent transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Productores
                </Link>
              </nav>
              {user ? (
                <>
                  <Link href="/upload" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full gap-2 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                      <Upload className="h-4 w-4" />
                      Subir Pack
                    </Button>
                  </Link>
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full gap-2 rounded-full bg-transparent" variant="outline">
                      <User className="h-4 w-4" />
                      Mi Perfil
                    </Button>
                  </Link>
                  <Button className="w-full gap-2 rounded-full bg-transparent" variant="outline" onClick={handleLogout}>
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
