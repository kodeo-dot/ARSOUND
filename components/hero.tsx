import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, ChevronRight, Zap } from "lucide-react"
import Link from "next/link"

export function Hero() {
  return (
    <section className="relative bg-background overflow-hidden">
      {/* Subtle ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 py-24 md:py-32 lg:py-40 relative z-10">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-bold text-primary border border-primary/20">
            <Zap className="h-3 w-3" />
            Plataforma de Sample Packs para LATAM
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-balance leading-[1.05] text-foreground">
            ARSOUND
          </h1>

          <p className="text-xl md:text-2xl lg:text-3xl text-foreground font-semibold text-balance max-w-3xl mx-auto leading-relaxed">
            El marketplace de recursos musicales
          </p>

          <p className="text-base md:text-lg text-muted-foreground text-balance max-w-2xl mx-auto leading-relaxed">
            Descubri sample packs, MIDI packs y herramientas creativas creadas por productores verificados. Precios en pesos argentinos, pagos con Mercado Pago.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/#packs">
              <Button
                size="lg"
                className="gap-2 text-base h-12 px-8 rounded-full font-bold w-full sm:w-auto min-w-[200px] shadow-lg shadow-primary/25"
              >
                Explorar Sample Packs
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/plans">
              <Button
                size="lg"
                variant="outline"
                className="text-base h-12 px-8 rounded-full font-bold bg-transparent w-full sm:w-auto min-w-[200px]"
              >
                Ver Planes
              </Button>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-6">
            <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] font-semibold text-muted-foreground border-border bg-secondary/50">
              <Play className="h-3 w-3 mr-1.5 fill-current text-primary" />
              Preview antes de comprar
            </Badge>
            <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] font-semibold text-muted-foreground border-border bg-secondary/50">
              Precios en ARS
            </Badge>
            <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] font-semibold text-muted-foreground border-border bg-secondary/50">
              Licencia Royalty-free
            </Badge>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
    </section>
  )
}
