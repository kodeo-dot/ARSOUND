import { Waves, Instagram, Twitter, Youtube, Mail } from "lucide-react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative">
                <Waves className="h-8 w-8 text-primary" strokeWidth={2.5} />
                <div className="absolute inset-0 bg-primary/20 blur-xl" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-foreground">ARSOUND</span>
                <span className="text-[9px] font-medium text-muted-foreground -mt-1">ARGENTINA</span>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs text-pretty">
              El marketplace de sample packs y loops para productores argentinos.
            </p>
            <p className="text-xs text-muted-foreground">
              Creado por <span className="font-bold text-primary">mixflp</span>
            </p>
          </div>

          {/* Links - Explorar */}
          <div>
            <h3 className="font-bold text-foreground mb-4">Explorar</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/#packs" className="text-muted-foreground hover:text-primary transition-colors">
                  Todos los Packs
                </Link>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Packs Gratis
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Más Vendidos
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Nuevos Lanzamientos
                </a>
              </li>
            </ul>
          </div>

          {/* Links - Recursos */}
          <div>
            <h3 className="font-bold text-foreground mb-4">Recursos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/upload" className="text-muted-foreground hover:text-primary transition-colors">
                  Subir Pack
                </Link>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Guía de Productores
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a
                  href="mailto:soporte@arsound.com.ar"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Contacto
                </a>
              </li>
            </ul>
          </div>

          {/* Links - Legal & Redes */}
          <div>
            <h3 className="font-bold text-foreground mb-4">Seguinos</h3>
            <div className="flex gap-2 mb-6">
              <a
                href="#"
                className="h-10 w-10 rounded-full bg-accent hover:bg-primary transition-colors flex items-center justify-center group"
              >
                <Instagram className="h-5 w-5 text-white" />
              </a>
              <a
                href="#"
                className="h-10 w-10 rounded-full bg-accent hover:bg-primary transition-colors flex items-center justify-center group"
              >
                <Twitter className="h-5 w-5 text-white" />
              </a>
              <a
                href="#"
                className="h-10 w-10 rounded-full bg-accent hover:bg-primary transition-colors flex items-center justify-center group"
              >
                <Youtube className="h-5 w-5 text-white" />
              </a>
              <a
                href="mailto:soporte@arsound.com.ar"
                className="h-10 w-10 rounded-full bg-accent hover:bg-primary transition-colors flex items-center justify-center group"
              >
                <Mail className="h-5 w-5 text-white" />
              </a>
            </div>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/license" className="text-muted-foreground hover:text-primary transition-colors">
                  Licencia de Uso
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/terminos-condiciones"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/politica-privacidad"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Política de Privacidad
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© 2025 ARSOUND. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
